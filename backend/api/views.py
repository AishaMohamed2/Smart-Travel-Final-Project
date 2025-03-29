from django.shortcuts import get_object_or_404
from rest_framework import generics, serializers
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from transformers import pipeline
from .serializers import UserSerializer, TripSerializer, ExpenseSerializer
from .models import CustomUser, Trip, Expense
import re

# Initialize the Hugging Face model globally
classifier = pipeline("zero-shot-classification", 
                     model="facebook/bart-large-mnli")

# Add this new view for expense categorization
@api_view(['POST'])
def categorize_expense(request):
    description = request.data.get('description', '')
    
    candidate_labels = [
        "food & dining", 
        "transport", 
        "accommodation", 
        "entertainment", 
        "other"
    ]
    
    try:
        result = classifier(description, candidate_labels)
        predicted_label = result['labels'][0]
        return Response({"category": predicted_label.split(' ')[0]})  # Returns "food" from "food & dining"
    except Exception as e:
        return Response({"error": str(e)}, status=500)

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