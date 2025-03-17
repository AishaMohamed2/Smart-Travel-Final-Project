from django.shortcuts import render
from rest_framework import generics
from .serializers import UserSerializer, NoteSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Note, CustomUser  # Import CustomUser instead of default User

# View to list and create notes
class NoteListCreate(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]  # Only authenticated users can access

    def get_queryset(self):
        user = self.request.user  # Get the logged-in user
        return Note.objects.filter(author=user)  # Only return notes belonging to this user

    def perform_create(self, serializer):
        if serializer.is_valid():  # Ensure data is valid before saving
            serializer.save(author=self.request.user)  # Set the logged-in user as the note author


# View to delete a note
class NoteDelete(generics.DestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]  # Only authenticated users can delete notes

    def get_queryset(self):
        user = self.request.user  # Get the logged-in user
        return Note.objects.filter(author=user)  # Allow deleting only user's own notes


# View to create a new user
class CreateUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()  # Using CustomUser instead of Django's default User model
    serializer_class = UserSerializer
    permission_classes = [AllowAny]  # Anyone can create an account (no authentication needed)

    def perform_create(self, serializer):
        serializer.save()  # Save the user instance
