from rest_framework import serializers
from .models import CustomUser, Trip

# Serializer for the CustomUser model
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "email", "password", "first_name", "last_name"]  # Include first_name and last_name
        extra_kwargs = {"password": {"write_only": True}} 

    def create(self, validated_data):
        password = validated_data.pop("password", None)  # Extract password from data
        user = CustomUser(**validated_data)  # Create user instance without saving yet
        if password:
            user.set_password(password)  # Hash the password before saving
        user.save()  # Save the user instance to the database
        return user


class TripSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = [
            'id', 'trip_name', 'destination', 'start_date', 'end_date', 
            'total_budget', 'traveler_type', 'savings'
        ]
    
    def validate(self, data):
       
        return data
