from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer, TripSerializer
from .models import CustomUser, Trip  

# View to create a new user
class CreateUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]  # Anyone can create an account

    def perform_create(self, serializer):
        serializer.save()

# View to list and create trips
class TripListCreate(generics.ListCreateAPIView):
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]  # Only authenticated users can access

    def get_queryset(self):
        return Trip.objects.filter(user=self.request.user)  # Only show user's trips

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# View to delete a trip
class TripDeleteView(generics.DestroyAPIView):
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Trip.objects.filter(user=self.request.user)  # Ensure users can only delete their own trips

    def delete(self, request, *args, **kwargs):
        trip = get_object_or_404(Trip, id=kwargs["pk"], user=request.user)
        trip.delete()
        return Response({"message": "Trip deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
