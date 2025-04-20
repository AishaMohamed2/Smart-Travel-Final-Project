from django.shortcuts import get_object_or_404
from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import CustomUser, Trip, Expense
from .serializers import UserSerializer, TripSerializer, ExpenseSerializer, CollaboratorSerializer
from django.db.models import Sum, Q  
from datetime import timedelta
import requests
from django.core.cache import cache
import logging
from rest_framework.generics import UpdateAPIView, DestroyAPIView, RetrieveAPIView
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
from collections import defaultdict
import json
from django.conf import settings
import os

# Load cost of living data from JSON file
# File contains city-wise cost indices for different categories
with open(os.path.join(settings.BASE_DIR, '../frontend/src/data/cost_of_living_indices.json'), 'r') as f:
    cost_of_living_data = json.load(f)

# track errors and debug information
logger = logging.getLogger(__name__)

# HELPER FUNCTIONS
def calculate_trip_analytics(trip):
    """Calculate all analytics for a single trip including:
    - Total spent vs budget
    - Daily averages
    - Category breakdowns
    - Daily spending patterns
    """
    # Get expenses for the trip (works for both owners and collaborators)
    expenses = trip.expenses.all()
    total_spent = expenses.aggregate(total=Sum('amount'))['total'] or 0
    duration = (trip.end_date - trip.start_date).days + 1
    

    # Get category spending in the expected format
    category_data = expenses.values('category').annotate(total=Sum('amount'))
    category_dict = {
        item['category']: float(item['total'])
        for item in category_data
    }
    
    # Ensure all expected categories exist with at least 0 value
    expected_categories = ['food', 'transport', 'accommodation', 'entertainment', 'other']
    for cat in expected_categories:
        if cat not in category_dict:
            category_dict[cat] = 0.0
    
    return {
        'trip_id': trip.id,
        'trip_name': trip.trip_name,
        'destination': trip.destination,
        'start_date': trip.start_date.strftime("%Y-%m-%d"),
        'end_date': trip.end_date.strftime("%Y-%m-%d"),
        'total_budget': float(trip.total_budget),
        'total_spent': float(total_spent),
        'remaining_budget': float(trip.total_budget - total_spent),
        'daily_average': float(total_spent) / duration if duration > 0 else 0,
        'category_spending': category_dict, 
        'daily_spending': _get_daily_spending(trip)
    }

def _get_daily_spending(trip):
    #Generate daily spending breakdown between trip date
    daily_data = {}
    current_date = trip.start_date
    while current_date <= trip.end_date:
        daily_total = trip.expenses.filter(date=current_date).aggregate(
            total=Sum('amount'))['total'] or 0
        daily_data[current_date.strftime("%Y-%m-%d")] = float(daily_total)
        current_date += timedelta(days=1)
    return daily_data

# CORE USER VIEWS
class CreateUserView(generics.CreateAPIView):
    #Endpoint for creating new user accounts
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        """Handle password hashing during user creation"""
        user = serializer.save()
        user.set_password(serializer.validated_data['password'])
        user.save()

class UserDetailView(RetrieveAPIView):
    """Endpoint for retrieving authenticated user's details"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserUpdateView(UpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Create a copy of request data to avoid modifying the original
        data = request.data.copy()
        
        # Handle password change separately
        if 'new_password' in data:
            # Verify current password
            current_password = data.get('current_password', '')
            if not check_password(current_password, instance.password):
                return Response(
                    {"current_password": ["Current password is incorrect"]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify new password matches confirmation
            new_password = data.get('new_password', '')
            confirm_password = data.get('confirm_password', '')
            
            if new_password != confirm_password:
                return Response(
                    {"new_password": ["New passwords do not match"]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set the new password
            instance.set_password(new_password)
            instance.save()
            
            # Remove password fields from data to prevent serializer validation issues
            data.pop('current_password', None)
            data.pop('new_password', None)
            data.pop('confirm_password', None)
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)
    
class UserDeleteView(DestroyAPIView):
    """Endpoint for account deletion"""
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def delete(self, request, *args, **kwargs):
        user = self.get_object()
        user.delete()
        return Response({"message": "Account deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except AuthenticationFailed:
            # Check if user exists but password is wrong
            user = CustomUser.objects.filter(email=request.data.get('email')).first()
            if user:
                raise AuthenticationFailed("Incorrect password")
            raise AuthenticationFailed("User not found")
        
# TRIP MANAGEMENT VIEWS 
class TripListCreate(generics.ListCreateAPIView):
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Trip.objects.filter(
            Q(user=user) | Q(collaborators=user)
        ).distinct().prefetch_related('collaborators')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, currency=self.request.user.currency)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
class TripUpdateView(generics.UpdateAPIView):
    """Endpoint for updating existing trips"""
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Ensure users can only update their own trips"""
        return Trip.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        try:
            # Get the trip instance once
            instance = self.get_object()
            
            # Check ownership
            if instance.user != request.user:
                return Response(
                    {"error": "Only the trip owner can update this trip"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Proceed with update validation
            traveler_type = request.data.get('traveler_type', instance.traveler_type)
            requested_budget = float(request.data.get('total_budget', instance.total_budget))
            
            # Get budget recommendation for validation
            try:
                # Calculate duration for the trip
                start_date = request.data.get('start_date', instance.start_date)
                end_date = request.data.get('end_date', instance.end_date)
                duration = (end_date - start_date).days + 1
                
                # Get recommendation for the traveler type
                response = requests.post(
                    "http://localhost:8000/api/budget-recommendation/",
                    json={
                        'city': request.data.get('destination', instance.destination),
                        'traveler_type': traveler_type,
                        'duration': duration
                    },
                    headers={'Authorization': f'Bearer {request.auth}'}
                )
                
                if response.status_code == 200:
                    recommended_data = response.json()
                    max_allowed = recommended_data['total_budget'] * 1.5
                    min_allowed = recommended_data['total_budget'] * 0.5
                    
                    if not (min_allowed <= requested_budget <= max_allowed):
                        return Response(
                            {"error": f"Budget must be within 50% of recommended {traveler_type} budget ({recommended_data['total_budget']:.2f} {recommended_data['currency']})"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                        
            except Exception as e:
                logger.error(f"Budget validation error: {str(e)}")
                # Allow update if validation fails
            
            # Perform the update
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Trip update error: {str(e)}")
            return Response(
                {"error": "Failed to update trip"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class TripDeleteView(generics.DestroyAPIView):
    """Endpoint for deleting trips"""
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Ensure users can only delete their own trips"""
        return Trip.objects.filter(user=self.request.user)

    def delete(self, request, *args, **kwargs):
        try:
            trip = get_object_or_404(Trip, id=kwargs["pk"])
            if trip.user != request.user:
                return Response(
                    {"error": "Only the trip owner can delete this trip"},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            trip.delete()
            return Response(
                {"message": "Trip deleted successfully"}, 
                status=status.HTTP_204_NO_CONTENT
            )
            
        except Exception as e:
            logger.error(f"Trip deletion error: {str(e)}")
            return Response(
                {"error": "Failed to delete trip"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
# EXPENSE MANAGEMENT VIEWS 
class ExpenseListCreate(generics.ListCreateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.filter(
            Q(trip__user=self.request.user) | 
            Q(trip__collaborators=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        trip = serializer.validated_data['trip']
        if not trip.is_user_allowed(self.request.user):
            raise serializers.ValidationError("You can only add expenses to trips you own or collaborate on.")
        serializer.save()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class ExpenseUpdateView(generics.UpdateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.filter(
            Q(trip__user=self.request.user) | 
            Q(trip__collaborators=self.request.user)
        ).distinct()

    def perform_update(self, serializer):
        trip = serializer.validated_data['trip']
        if not trip.is_user_allowed(self.request.user):
            raise serializers.ValidationError(
                "You can only update expenses for trips you own or collaborate on."
            )
        serializer.save()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class ExpenseDeleteView(generics.DestroyAPIView):
    """Endpoint for deleting expenses"""
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Allow deletion for trip owners and collaborators"""
        return Expense.objects.filter(
            Q(trip__user=self.request.user) | 
            Q(trip__collaborators=self.request.user)
        ).distinct()

    def perform_destroy(self, instance):
        if not instance.trip.is_user_allowed(self.request.user):
            raise serializers.ValidationError(
                "You can only delete expenses for trips you own or collaborate on."
            )
        instance.delete()
        
# ANALYTICS VIEWS 
class AllTripsAnalyticsView(APIView):
    """Endpoint for aggregated analytics across all trips"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Get both owned and collaborated trips
            trips = Trip.objects.filter(
                Q(user=request.user) | Q(collaborators=request.user)
            ).distinct()
            
            if not trips.exists():
                return Response(
                    {"error": "No trips found for this user"},
                    status=status.HTTP_404_NOT_FOUND
                )

            response_data = {
                'total_budget': 0,
                'total_spent': 0,
                'remaining_budget': 0,
                'categories': defaultdict(float),
                'daily_spending': defaultdict(float),
                'trips': [],
                'user_currency': request.user.currency,
                'is_converted': False
            }

            # Process each trip
            for trip in trips:
                trip_data = {
                    'trip_id': trip.id,
                    'trip_name': trip.trip_name,
                    'destination': trip.destination,
                    'start_date': trip.start_date.strftime("%Y-%m-%d"),
                    'end_date': trip.end_date.strftime("%Y-%m-%d"),
                    'total_budget': float(trip.total_budget),
                    'total_spent': 0,
                    'remaining_budget': 0,
                    'daily_average': 0,
                    'category_spending': defaultdict(float),
                    'is_converted': False
                }

                # Convert trip budget if needed
                if request.user.currency != trip.currency:
                    converted_budget = self.convert_currency(
                        trip_data['total_budget'],
                        trip.currency,
                        request.user.currency
                    )
                    if converted_budget is not None:
                        trip_data['total_budget'] = converted_budget
                        trip_data['is_converted'] = True
                        response_data['is_converted'] = True

                # Process all expenses for this trip
                expenses = trip.expenses.all()
                for expense in expenses:
                    amount = float(expense.amount)
                    
                    # Convert amount if needed
                    if request.user.currency != expense.original_currency:
                        converted_amount = self.convert_currency(
                            amount,
                            expense.original_currency,
                            request.user.currency
                        )
                        if converted_amount is not None:
                            amount = converted_amount
                            trip_data['is_converted'] = True
                            response_data['is_converted'] = True
                    
                    trip_data['total_spent'] += amount
                    trip_data['category_spending'][expense.category] += amount
                    
                    date_str = expense.date.strftime("%Y-%m-%d")
                    response_data['daily_spending'][date_str] += amount
                    trip_data['daily_spending'] = trip_data.get('daily_spending', {})
                    trip_data['daily_spending'][date_str] = trip_data['daily_spending'].get(date_str, 0) + amount

                # Calculate remaining budget and daily average
                trip_data['remaining_budget'] = trip_data['total_budget'] - trip_data['total_spent']
                duration = (trip.end_date - trip.start_date).days + 1
                trip_data['daily_average'] = trip_data['total_spent'] / duration if duration > 0 else 0
                
                # Round trip data
                trip_data['total_budget'] = round(trip_data['total_budget'], 2)
                trip_data['total_spent'] = round(trip_data['total_spent'], 2)
                trip_data['remaining_budget'] = round(trip_data['remaining_budget'], 2)
                trip_data['daily_average'] = round(trip_data['daily_average'], 2)
                trip_data['category_spending'] = {k: round(v, 2) for k, v in trip_data['category_spending'].items()}
                
                # Add to totals
                response_data['total_budget'] += trip_data['total_budget']
                response_data['total_spent'] += trip_data['total_spent']
                
                # Aggregate category spending
                for category, amount in trip_data['category_spending'].items():
                    response_data['categories'][category] += amount
                
                response_data['trips'].append(trip_data)

            # Calculate remaining budget and round all values
            response_data['remaining_budget'] = round(response_data['total_budget'] - response_data['total_spent'], 2)
            response_data['total_budget'] = round(response_data['total_budget'], 2)
            response_data['total_spent'] = round(response_data['total_spent'], 2)
            response_data['categories'] = {k: round(v, 2) for k, v in response_data['categories'].items()}
            response_data['daily_spending'] = {k: round(v, 2) for k, v in response_data['daily_spending'].items()}

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"All trips analytics error: {str(e)}")
            return Response(
                {"error": "Could not generate analytics"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def convert_currency(self, amount, from_currency, to_currency):
        if from_currency == to_currency:
            return amount
            
        cache_key = f"exchange_rate_{from_currency}_{to_currency}"
        try:
            if cached_rate := cache.get(cache_key):
                return round(amount * cached_rate, 2)
                
            response = requests.get(
                f"https://api.exchangerate-api.com/v4/latest/{from_currency}",
                timeout=5
            )
            response.raise_for_status()
            data = response.json()
            rate = data['rates'].get(to_currency, 1)
            cache.set(cache_key, rate, timeout=3600)
            return round(amount * rate, 2)
            
        except requests.RequestException as e:
            logger.error(f"Currency conversion failed: {str(e)}")
            return None
        
class TripAnalyticsView(APIView):
    """Endpoint for detailed analytics of a specific trip"""
    permission_classes = [IsAuthenticated]

    def get(self, request, trip_id):
        try:
            trip = get_object_or_404(Trip, id=trip_id)
            
            # Check if user is owner or collaborator
            if not trip.is_user_allowed(request.user):
                return Response(
                    {"error": "Not authorized to view this trip's analytics"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Initialize data structures
            category_spending = defaultdict(float)
            daily_spending = defaultdict(float)
            total_spent = 0.0
            
            # Get all expenses and convert each one
            expenses = trip.expenses.all()
            for expense in expenses:
                amount = float(expense.amount)
                
                # Convert amount if needed
                if request.user.currency != expense.original_currency:
                    converted_amount = self.convert_currency(
                        amount,
                        expense.original_currency,
                        request.user.currency
                    )
                    if converted_amount is not None:
                        amount = converted_amount
                
                total_spent += amount
                category_spending[expense.category] += amount
                date_str = expense.date.strftime("%Y-%m-%d")
                daily_spending[date_str] += amount
            
            # Convert trip budget if needed
            total_budget = float(trip.total_budget)
            if request.user.currency != trip.currency:
                converted_budget = self.convert_currency(
                    total_budget,
                    trip.currency,
                    request.user.currency
                )
                if converted_budget is not None:
                    total_budget = converted_budget
            
            # Calculate duration and daily average
            duration = (trip.end_date - trip.start_date).days + 1
            daily_avg = total_spent / duration if duration > 0 else 0
            
            # Prepare response data
            analytics_data = {
                'trip_id': trip.id,
                'trip_name': trip.trip_name,
                'destination': trip.destination,
                'start_date': trip.start_date.strftime("%Y-%m-%d"),
                'end_date': trip.end_date.strftime("%Y-%m-%d"),
                'total_budget': round(total_budget, 2),
                'total_spent': round(total_spent, 2),
                'remaining_budget': round(total_budget - total_spent, 2),
                'daily_average': round(daily_avg, 2),
                'category_spending': {k: round(v, 2) for k, v in category_spending.items()},
                'daily_spending': {k: round(v, 2) for k, v in daily_spending.items()},
                'user_currency': request.user.currency,
                'trip_currency': trip.currency,
                'is_converted': request.user.currency != trip.currency
            }
            
            return Response(analytics_data)
            
        except Trip.DoesNotExist:
            return Response(
                {"error": "Trip not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Trip analytics error: {str(e)}")
            return Response(
                {"error": "Could not generate trip analytics"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def convert_currency(self, amount, from_currency, to_currency):
        if from_currency == to_currency:
            return amount
            
        cache_key = f"exchange_rate_{from_currency}_{to_currency}"
        try:
            if cached_rate := cache.get(cache_key):
                return round(amount * cached_rate, 2)
                
            response = requests.get(
                f"https://api.exchangerate-api.com/v4/latest/{from_currency}",
                timeout=5
            )
            response.raise_for_status()
            data = response.json()
            rate = data['rates'].get(to_currency, 1)
            cache.set(cache_key, rate, timeout=3600)
            return round(amount * rate, 2)
            
        except requests.RequestException as e:
            logger.error(f"Currency API error: {str(e)}")
            return None
        
# BUDGET RECOMMENDATION VIEW 
class BudgetRecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Get budget recommendations for a trip to a specific city based on traveler type
        """
        try:
            city = request.data.get('city')
            traveler_type = request.data.get('traveler_type', 'medium')
            duration = int(request.data.get('duration', 7))

            if not city:
                return Response(
                    {"error": "City parameter is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Load cost data from JSON
            cost_data = self._get_city_cost_data(city)
            if not cost_data:
                return Response(
                    {"error": f"Cost data not available for {city}. Please try a major city."},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Calculate adjusted costs based on traveler type
            multipliers = {
                "luxury": 1.8,
                "medium": 1.0,
                "budget": 0.6
            }
            
            # Use the indices directly from the JSON data
            daily_costs = {
                'food and dining': (cost_data['groceries_index'] + cost_data['restaurant_index']) / 2,  # Average of both
                'accommodation': cost_data['rent_index'],
                'general': cost_data['index'],
                'entertainment': cost_data['purchasing_index']
            }
            
            # Apply traveler type multiplier to relevant categories
            adjusted_costs = {
                'food and dining': daily_costs['food and dining'] * multipliers.get(traveler_type, 1.0),
                'accommodation': daily_costs['accommodation'] * multipliers.get(traveler_type, 1.0),
                'general': daily_costs['general'] * multipliers.get(traveler_type, 1.0),
                'entertainment': daily_costs['entertainment'] * multipliers.get(traveler_type, 1.0),
            }

            # Convert to user's currency if needed
            user_currency = getattr(request.user, 'currency', 'GBP')
            converted_costs = self._convert_currency(
                adjusted_costs,
                cost_data['currency_type'],
                user_currency
            )

            # Calculate totals
            daily_total = sum(converted_costs.values())  # Sum ALL categories
            total_budget = round(daily_total * duration, 2)
            converted_costs = {k: round(v, 2) for k, v in converted_costs.items()}

            return Response({
                'city': city,
                'daily_breakdown': converted_costs,
                'daily_total': round(daily_total, 2),
                'total_budget': total_budget,
                'currency': user_currency,
                'traveler_type': traveler_type,
                'duration_days': duration,
                'source_currency': cost_data['currency_type'],
                'is_converted': user_currency != cost_data['currency_type']
            })

        except Exception as e:
            logger.error(f"Budget recommendation error: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

    def _get_city_cost_data(self, city):
        """Fetch cost of living data from our JSON data"""
        # Try to find the city in our data (case insensitive)
        city_lower = city.lower()
        
        # First try exact match
        for city_name, data in cost_of_living_data.items():
            if city_lower == city_name.lower():
                return data
                
        # If not found, try to find a partial match
        for city_name, data in cost_of_living_data.items():
            if city_lower in city_name.lower():
                return data
                
        return None

    def _convert_currency(self, costs, from_currency, to_currency):
        """Convert costs to user's preferred currency"""
        if from_currency == to_currency:
            return costs

        cache_key = f"exchange_rate_{from_currency}_{to_currency}"
        try:
            # Try to get cached rate first
            if cached_rate := cache.get(cache_key):
                return {k: round(v * cached_rate, 2) for k, v in costs.items()}

            response = requests.get(
                f"https://api.exchangerate-api.com/v4/latest/{from_currency}",
                timeout=5
            )
            response.raise_for_status()
            data = response.json()
            rate = data['rates'].get(to_currency)

            if not rate:
                raise Exception(f"No exchange rate available for {to_currency}")

            # Cache rate for 1 hour
            cache.set(cache_key, rate, timeout=3600)
            return {k: round(v * rate, 2) for k, v in costs.items()}

        except Exception as e:
            logger.error(f"Currency conversion failed: {str(e)}")
            raise Exception("Currency conversion service unavailable. Using original values.")
        
class TripCollaboratorsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, trip_id):
        trip = get_object_or_404(Trip, id=trip_id)
        
        # Check if user is owner or collaborator
        if not trip.is_user_allowed(request.user):
            return Response({'detail': 'Not authorized'}, status=403)

        collaborators = trip.collaborators.all()
        return Response({
            'status': 'success',
            'data': {
                'owner': {
                    'id': trip.user.id,
                    'email': trip.user.email,
                    'first_name': trip.user.first_name,
                    'last_name': trip.user.last_name
                },
                'collaborators': CollaboratorSerializer(collaborators, many=True).data,
                'is_owner': request.user.id == trip.user.id
            }
        })

    def post(self, request, trip_id):
        trip = get_object_or_404(Trip, id=trip_id)
        
        if request.user != trip.user:
            return Response({'detail': 'Only the trip owner can add collaborators'}, status=403)
        
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required'}, status=400)

        try:
            # Verify user exists first
            user_to_add = CustomUser.objects.get(email=email)
            
            if trip.collaborators.filter(id=user_to_add.id).exists():
                return Response({'detail': 'User is already a collaborator'}, status=400)
            
            if user_to_add.id == request.user.id:
                return Response({'detail': 'You cannot add yourself as a collaborator'}, status=400)
            
            trip.collaborators.add(user_to_add)
            
            return Response({
                'status': 'success',
                'message': 'Collaborator added successfully',
                'user': CollaboratorSerializer(user_to_add).data
            }, status=200)
            
        except CustomUser.DoesNotExist:
            return Response({'detail': 'User with this email does not exist'}, status=404)

    def delete(self, request, trip_id):
        trip = get_object_or_404(Trip, id=trip_id)

        if request.user != trip.user:
            return Response({'detail': 'Only the trip owner can remove collaborators'}, status=403)

        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required'}, status=400)

        try:
            user_to_remove = CustomUser.objects.get(email=email)
            trip.collaborators.remove(user_to_remove)
            return Response({'detail': 'Collaborator removed successfully'}, status=200)
        except CustomUser.DoesNotExist:
            return Response({'detail': 'User not found'}, status=404)
        
class UserVerificationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        email = request.query_params.get('email', '').strip().lower()
        if not email:
            return Response({'exists': False}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = CustomUser.objects.get(email=email)
            return Response({
                'exists': True,
                'first_name': user.first_name,
                'last_name': user.last_name
            })
        except CustomUser.DoesNotExist:
            return Response({'exists': False})