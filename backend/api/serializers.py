from rest_framework import serializers
from .models import CustomUser, Trip, Expense
from django.utils import timezone

# Serializer for the CustomUser model
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "email", "password", "first_name", "last_name"]
        extra_kwargs = {"password": {"write_only": True}}  # Ensure password is write-only

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = CustomUser(**validated_data)
        if password:
            user.set_password(password)  # Hash the password before saving
        user.save()
        return user

    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def update(self, instance, validated_data):
        # Remove password from validated_data if it exists
        validated_data.pop('password', None)
        return super().update(instance, validated_data)
    

    
    

# Serializer for the Trip model
class TripSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = [
            "id", "trip_name", "destination", "start_date", "end_date", 
            "total_budget", "traveler_type", "savings"
        ]

    def validate(self, data):
        # Ensure start date is before end date
        if "start_date" in data and "end_date" in data:
            if data["start_date"] > data["end_date"]:
                raise serializers.ValidationError("The start date cannot be after the end date.")
        return data

# Serializer for the Expense model
class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ["id", "trip", "amount", "date", "category", "description"]

    def validate(self, data):
        trip = data.get("trip")
        expense_date = data.get("date")

        # Ensure the expense date is within the trip's start and end dates
        if expense_date < trip.start_date or expense_date > trip.end_date:
            raise serializers.ValidationError("The expense date must be within the trip's start and end dates.")

        # Ensure the trip is currently happening
        today = timezone.now().date()
        if trip.start_date > today or trip.end_date < today:
            raise serializers.ValidationError("Expenses can only be added for trips that are currently happening.")

        return data