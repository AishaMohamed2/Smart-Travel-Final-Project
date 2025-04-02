from django.shortcuts import get_object_or_404
from rest_framework import generics, serializers
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer, TripSerializer, ExpenseSerializer
from .models import CustomUser, Trip, Expense
from rest_framework.views import APIView
from django.db.models import Sum
from datetime import datetime, timedelta
from rest_framework.generics import UpdateAPIView, DestroyAPIView, RetrieveAPIView

# View to create a new user
class CreateUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        # Save the new user
        serializer.save()
        
# View to list and create trips
class TripListCreate(generics.ListCreateAPIView):
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only show trips belonging to the logged-in user
        return Trip.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically associate the trip with the logged-in user
        serializer.save(user=self.request.user)

# View to delete a trip
class TripDeleteView(generics.DestroyAPIView):
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Ensure users can only delete their own trips
        return Trip.objects.filter(user=self.request.user)

    def delete(self, request, *args, **kwargs):
        # Find the trip or return a 404 error
        trip = get_object_or_404(Trip, id=kwargs["pk"], user=request.user)
        trip.delete()
        return Response({"message": "Trip deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

# View to update an existing trip
class TripUpdateView(generics.UpdateAPIView):
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Ensure users can only update their own trips
        return Trip.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        # Allow partial updates (e.g., updating only some fields)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Invalidate any prefetched objects cache
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

# View to list and create expenses
class ExpenseListCreate(generics.ListCreateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only show expenses belonging to the logged-in user's trips
        return Expense.objects.filter(trip__user=self.request.user)

    def perform_create(self, serializer):
        trip = serializer.validated_data['trip']
        if trip.user != self.request.user:
            raise serializers.ValidationError("You can only add expenses to your own trips.")
        serializer.save()

# View to delete an expense
class ExpenseDeleteView(generics.DestroyAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Ensure users can only delete their own expenses
        return Expense.objects.filter(trip__user=self.request.user)

    def delete(self, request, *args, **kwargs):
        # Find the expense or return a 404 error
        expense = get_object_or_404(Expense, id=kwargs["pk"], trip__user=request.user)
        expense.delete()
        return Response({"message": "Expense deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

# View to update an existing expense
class ExpenseUpdateView(generics.UpdateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Ensure users can only update their own expenses
        return Expense.objects.filter(trip__user=self.request.user)

    def update(self, request, *args, **kwargs):
        # Allow partial updates (e.g., updating only some fields)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Invalidate any prefetched objects cache
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)


class AllTripsAnalyticsView(APIView):
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
                
                trip_data.append({
                    'trip_id': trip.id,
                    'trip_name': trip.trip_name,
                    'destination': trip.destination,
                    'start_date': trip.start_date.strftime("%Y-%m-%d"),
                    'end_date': trip.end_date.strftime("%Y-%m-%d"),
                    'total_budget': float(trip.total_budget),
                    'total_spent': float(trip_spent),
                    'remaining_budget': float(trip.total_budget - trip_spent),
                })

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
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class TripAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, trip_id):
        try:
            trip = Trip.objects.get(id=trip_id, user=request.user)
            expenses = Expense.objects.filter(trip=trip)
            
            # Calculate totals
            total_spent = expenses.aggregate(total=Sum('amount'))['total'] or 0
            remaining_budget = float(trip.total_budget) - float(total_spent)
            
            # Calculate daily average
            start_date = trip.start_date
            end_date = trip.end_date
            trip_duration = (end_date - start_date).days + 1
            daily_average = float(total_spent) / trip_duration if trip_duration > 0 else 0
            
            # Calculate spending by category
            categories = expenses.values('category').annotate(total=Sum('amount'))
            category_data = {item['category']: float(item['total']) for item in categories}
            
            # Prepare daily spending data
            daily_spending = {}
            current_date = start_date
            while current_date <= end_date:
                daily_expenses = expenses.filter(date=current_date)
                daily_total = daily_expenses.aggregate(total=Sum('amount'))['total'] or 0
                daily_spending[current_date.strftime("%Y-%m-%d")] = float(daily_total)
                current_date += timedelta(days=1)
            
            response_data = {
                'trip_name': trip.trip_name,
                'destination': trip.destination,
                'start_date': trip.start_date.strftime("%Y-%m-%d"),
                'end_date': trip.end_date.strftime("%Y-%m-%d"),
                'total_budget': float(trip.total_budget),
                'total_spent': float(total_spent),
                'remaining_budget': remaining_budget,
                'daily_average': daily_average,
                'categories': category_data,
                'daily_spending': daily_spending
            }
            
            return Response(response_data, status=status.HTTP_200_OK)

        except Trip.DoesNotExist:
            return Response(
                {"error": "Trip not found or doesn't belong to user"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserDetailView(RetrieveAPIView):
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
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Handle password change separately
        password = request.data.get('password')
        if password:
            instance.set_password(password)
            instance.save()
            return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)
        
        self.perform_update(serializer)
        return Response(serializer.data)

class UserDeleteView(DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def delete(self, request, *args, **kwargs):
        user = self.get_object()
        user.delete()
        return Response({"message": "Account deleted successfully"}, status=status.HTTP_204_NO_CONTENT) 