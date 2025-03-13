from django.shortcuts import render
from rest_framework import generics
from .serializers import UserSerializer, NoteSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Note, CustomUser  # Import CustomUser instead of User

# Note List and Create View
class NoteListCreate(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(author=user)

    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(author=self.request.user)
        else:
            print(serializer.errors)

# Note Delete View
class NoteDelete(generics.DestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(author=user)

# Create User View (Updated to use CustomUser)
class CreateUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()  # Change from User to CustomUser
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    
    def perform_create(self, serializer):
        # You can override this method to add additional logic if needed
        serializer.save()