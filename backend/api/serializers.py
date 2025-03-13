from rest_framework import serializers
from .models import Note, CustomUser

# User Serializer (updated for CustomUser model)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser  # Use the custom user model here
        fields = ["id", "email", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        # You don't need to call `create_user` since `CustomUserManager` will handle it
        password = validated_data.pop("password", None)
        user = CustomUser(**validated_data)
        if password:
            user.set_password(password)  # Make sure to hash the password
        user.save()
        return user


# Note Serializer
class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ["id", "title", "content", "created_at", "author"]
        extra_kwargs = {"author": {"read_only": True}}
