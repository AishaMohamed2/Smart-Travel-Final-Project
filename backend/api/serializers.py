from rest_framework import serializers
from .models import CustomUser, Trip

# Serializer for the CustomUser model
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "email", "password", "first_name", "last_name"]
        extra_kwargs = {"password": {"write_only": True}} 

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = CustomUser(**validated_data)
        if password:
            user.set_password(password)  # Hash the password before saving
        user.save()
        return user

# Serializer for the Trip model
class TripSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = [
            "id", "trip_name", "destination", "start_date", "end_date", 
            "total_budget", "traveler_type", "savings"
        ]  

    def validate(self, data):
        # Ensure start_date is before end_date
        if "start_date" in data and "end_date" in data:
            if data["start_date"] > data["end_date"]:
                raise serializers.ValidationError("Start date cannot be after end date.")
        return data
