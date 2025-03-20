from django.shortcuts import render
from rest_framework import generics
from .serializers import UserSerializer, TripSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import CustomUser, Trip  


# View to create a new user
class CreateUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()  # Using CustomUser instead of Django's default User model
    serializer_class = UserSerializer
    permission_classes = [AllowAny]  # Anyone can create an account (no authentication needed)

    def perform_create(self, serializer):
        serializer.save()  # Save the user instance

# View to list and create trips
class TripListCreate(generics.ListCreateAPIView):
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]  # Only authenticated users can access

    def get_queryset(self):
        # Return trips only for the logged-in user
        return Trip.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically set the logged-in user as the trip owner
        serializer.save(user=self.request.user)