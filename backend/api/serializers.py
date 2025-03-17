from rest_framework import serializers
from .models import Note, CustomUser

# Serializer for the CustomUser model
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "email", "password", "first_name", "last_name"]  # Include first_name and last_name
        extra_kwargs = {"password": {"write_only": True}}  # Prevent password from being exposed in API responses

    def create(self, validated_data):
        password = validated_data.pop("password", None)  # Extract password from data
        user = CustomUser(**validated_data)  # Create user instance without saving yet
        if password:
            user.set_password(password)  # Hash the password before saving
        user.save()  # Save the user instance to the database
        return user

# Serializer for the Note model
class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ["id", "title", "content", "created_at", "author"]
        extra_kwargs = {"author": {"read_only": True}}  # Prevent clients from modifying the author field
