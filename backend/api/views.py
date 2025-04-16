from django.shortcuts import get_object_or_404
from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import CustomUser, Trip, Expense
from .serializers import UserSerializer, TripSerializer, ExpenseSerializer
from django.db.models import Sum
from datetime import timedelta
import requests
from django.core.cache import cache
import logging
from rest_framework.generics import UpdateAPIView, DestroyAPIView, RetrieveAPIView

logger = logging.getLogger(__name__)

# HELPER FUNCTIONS
def calculate_trip_analytics(trip):
    """Calculate all analytics for a single trip including:
    - Total spent vs budget
    - Daily averages
    - Category breakdowns
    - Daily spending patterns
    """
    expenses = trip.expenses.all()
    total_spent = expenses.aggregate(total=Sum('amount'))['total'] or 0
    duration = (trip.end_date - trip.start_date).days + 1
    
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
        'categories': expenses.values('category').annotate(total=Sum('amount')),
        'daily_spending': _get_daily_spending(trip)
    }

def _get_daily_spending(trip):
    """Generate daily spending breakdown between trip dates"""
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
    """Endpoint for creating new user accounts"""
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
    """Endpoint for updating user details including password"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        """Handle password updates separately from other fields"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        if 'password' in request.data:
            instance.set_password(request.data['password'])
            instance.save()
            return Response({"message": "Password updated successfully"})
        
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

# TRIP MANAGEMENT VIEWS 
class TripListCreate(generics.ListCreateAPIView):
    """Endpoint for listing and creating trips"""
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Only show trips belonging to the authenticated user"""
        return Trip.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Automatically associate new trips with current user"""
        serializer.save(user=self.request.user)

class TripUpdateView(generics.UpdateAPIView):
    """Endpoint for updating existing trips"""
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Ensure users can only update their own trips"""
        return Trip.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
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
                "http://localhost:8000/api/budget-recommendation/",  # Adjust URL as needed
                json={
                    'city': request.data.get('destination', instance.destination),
                    'traveler_type': traveler_type,
                    'duration': duration
                },
                headers={'Authorization': f'Bearer {request.auth}'}
            )
            
            if response.status_code == 200:
                recommended_data = response.json()
                max_allowed = recommended_data['total_budget'] * 1.5  # 50% above recommendation
                min_allowed = recommended_data['total_budget'] * 0.5  # 50% below recommendation
                
                if not (min_allowed <= requested_budget <= max_allowed):
                    return Response(
                        {"error": f"Budget must be within 50% of recommended {traveler_type} budget ({recommended_data['total_budget']:.2f} {recommended_data['currency']})"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
        except Exception as e:
            logger.error(f"Budget validation error: {str(e)}")
            # Allow update if validation fails (you might want to change this)
        
        return super().update(request, *args, **kwargs)
    
class TripDeleteView(generics.DestroyAPIView):
    """Endpoint for deleting trips"""
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Ensure users can only delete their own trips"""
        return Trip.objects.filter(user=self.request.user)

    def delete(self, request, *args, **kwargs):
        trip = get_object_or_404(Trip, id=kwargs["pk"], user=request.user)
        trip.delete()
        return Response({"message": "Trip deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

# EXPENSE MANAGEMENT VIEWS 
class ExpenseListCreate(generics.ListCreateAPIView):
    """Endpoint for listing and creating expenses"""
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Only show expenses from the user's trips"""
        return Expense.objects.filter(trip__user=self.request.user)

    def perform_create(self, serializer):
        """Validate that expense is being added to user's own trip"""
        trip = serializer.validated_data['trip']
        if trip.user != self.request.user:
            raise serializers.ValidationError("You can only add expenses to your own trips.")
        serializer.save()

class ExpenseUpdateView(generics.UpdateAPIView):
    """Endpoint for updating existing expenses"""
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Ensure users can only update their own expenses"""
        return Expense.objects.filter(trip__user=self.request.user)

class ExpenseDeleteView(generics.DestroyAPIView):
    """Endpoint for deleting expenses"""
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Ensure users can only delete their own expenses"""
        return Expense.objects.filter(trip__user=self.request.user)

    def delete(self, request, *args, **kwargs):
        expense = get_object_or_404(Expense, id=kwargs["pk"], trip__user=request.user)
        expense.delete()
        return Response({"message": "Expense deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

# ANALYTICS VIEWS 
class AllTripsAnalyticsView(APIView):
    """Endpoint for aggregated analytics across all trips"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            trips = Trip.objects.filter(user=request.user)
            
            if not trips.exists():
                return Response(
                    {"error": "No trips found for this user"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Calculate totals across all trips
            total_budget = sum(trip.total_budget for trip in trips)
            total_spent = Expense.objects.filter(
                trip__in=trips
            ).aggregate(total=Sum('amount'))['total'] or 0
            remaining_budget = total_budget - total_spent

            # Get spending by category across all trips
            category_data = Expense.objects.filter(
                trip__in=trips
            ).values('category').annotate(
                total=Sum('amount')
            ).order_by('-total')

            # Convert to dictionary with proper labels
            category_dict = {
                item['category']: item['total']
                for item in category_data
            }

            # Prepare daily spending data across all trips
            daily_spending_data = Expense.objects.filter(
                trip__in=trips
            ).values('date').annotate(
                total=Sum('amount')
            ).order_by('date')

            # Convert to dictionary with date strings as keys
            daily_spending = {
                item['date'].strftime("%Y-%m-%d"): float(item['total'])
                for item in daily_spending_data
            }

            # Prepare trip data for the bar chart
            trip_data = []
            for trip in trips:
                trip_spent = Expense.objects.filter(
                    trip=trip
                ).aggregate(total=Sum('amount'))['total'] or 0
                
                trip_data.append(calculate_trip_analytics(trip))

            response_data = {
                'total_budget': float(total_budget),
                'total_spent': float(total_spent),
                'remaining_budget': float(remaining_budget),
                'categories': category_dict,
                'daily_spending': daily_spending,
                'trips': trip_data
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"All trips analytics error: {str(e)}")
            return Response(
                {"error": "Could not generate analytics"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TripAnalyticsView(APIView):
    """Endpoint for detailed analytics of a specific trip"""
    permission_classes = [IsAuthenticated]

    def get(self, request, trip_id):
        try:
            trip = Trip.objects.get(id=trip_id, user=request.user)
            return Response(calculate_trip_analytics(trip))
            
        except Trip.DoesNotExist:
            return Response(
                {"error": "Trip not found or doesn't belong to user"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Trip analytics error: {str(e)}")
            return Response(
                {"error": "Could not generate trip analytics"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# BUDGET RECOMMENDATION VIEW 
class BudgetRecommendationView(APIView):
    """Endpoint for generating budget recommendations based on destination"""
    permission_classes = [IsAuthenticated]

    
    
    DEFAULT_COSTS = {
        'food': 30,
        'transport': 10,
        'accommodation': 80,
        'currency': 'GBP'
    }

    def post(self, request):
        """Generate budget recommendations with options for:
        - Different traveler types (luxury/medium/budget)
        - Currency conversion
        - Duration adjustments
        """
        try:
            city = request.data.get('city')
            if not city:
                logger.error("City parameter missing in request")
                return Response(
                    {"error": "City parameter is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            cost_data = self._get_city_cost_data(city)
            traveler_type = request.data.get('traveler_type', 'medium')
            duration = int(request.data.get('duration', 7))
            user_currency = getattr(request.user, 'currency', 'GBP')

            # Calculate adjusted costs based on traveler type
            multipliers = {
                "luxury": 1.8,
                "medium": 1.0,
                "budget": 0.6
            }
            adjusted_costs = {
                'food': cost_data['food'] * multipliers.get(traveler_type, 1.0),
                'transport': cost_data['transport'] * multipliers.get(traveler_type, 1.0),
                'accommodation': cost_data['accommodation'] * multipliers.get(traveler_type, 1.0)
            }

            # Convert currency if needed
            converted_costs = self._convert_currency(
                adjusted_costs,
                cost_data['currency'],
                user_currency
            )

            # Calculate total budget
            total = sum(converted_costs.values()) * duration

            return Response({
                'city': city,
                'daily_breakdown': converted_costs,
                'total_budget': total,
                'currency': user_currency,
                'is_estimate': cost_data.get('is_estimate', False),
                'traveler_type': traveler_type,
                'duration_days': duration,
                'source_currency': cost_data['currency']
            })

        except Exception as e:
            logger.error(f"Budget recommendation error: {str(e)}")
            return Response(
                {"error": "Could not generate budget recommendation"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_city_cost_data(self, city):
        """Fetch city cost data with caching"""
        cache_key = f"city_cost_{city.lower()}"
        if cached := cache.get(cache_key):
            return cached
            
        try:
            response = requests.get(
                "https://cities-cost-of-living1.p.rapidapi.com/cost_of_living",
                headers={
                    "X-RapidAPI-Key": "your-api-key",
                    "X-RapidAPI-Host": "cities-cost-of-living1.p.rapidapi.com"
                },
                params={'city': city},
                timeout=5
            )
            data = response.json()
            
            result = {
                'food': float(data.get('food_index', self.DEFAULT_COSTS['food'])),
                'transport': float(data.get('transport_index', self.DEFAULT_COSTS['transport'])),
                'accommodation': float(data.get('rent_index', self.DEFAULT_COSTS['accommodation'])),
                'currency': data.get('currency_code', 'GBP'),
                'is_estimate': False
            }
            
            cache.set(cache_key, result, timeout=86400)
            return result
            
        except requests.RequestException:
            return {
                **self.DEFAULT_COSTS,
                'is_estimate': True,
                'note': f"Using default values for {city}"
            }
    
    def _convert_currency(self, costs, from_currency, to_currency):
        """Convert costs between currencies using external API"""
        if from_currency == to_currency:
            return costs
            
        cache_key = f"exchange_rate_{from_currency}_{to_currency}"
        try:
            if cached_rate := cache.get(cache_key):
                return {k: v * cached_rate for k, v in costs.items()}
                
            response = requests.get(
                f"https://api.exchangerate-api.com/v4/latest/{from_currency}",
                timeout=5
            )
            data = response.json()
            rate = data['rates'].get(to_currency, 1)
            
            cache.set(cache_key, rate, timeout=3600)
            return {k: v * rate for k, v in costs.items()}
            
        except Exception:
            return costs