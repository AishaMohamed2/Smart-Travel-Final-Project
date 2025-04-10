from rest_framework import serializers
from .models import CustomUser, Trip, Expense
from django.utils import timezone

# USER SERIALIZER
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "email", "password", "first_name", "last_name", "currency"]
        extra_kwargs = {
            "password": {
                "write_only": True,  # Never show password in API responses
                "style": {"input_type": "password"}  # Makes browsable API hide password
            }
        }

    def create(self, validated_data):
        """Creates a user with hashed password."""
        password = validated_data.pop("password", None)
        user = CustomUser(**validated_data)
        if password:
            user.set_password(password)  # Securely hash password
        user.save()
        return user

    def update(self, instance, validated_data):
        """Prevents password updates via this endpoint."""
        validated_data.pop("password", None)  # Ignore password if sent
        return super().update(instance, validated_data)


# TRIP SERIALIZER
class TripSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = [
            "id", "trip_name", "destination", "start_date", "end_date",
            "total_budget", "traveler_type", "savings"
        ]

    def validate(self, data):
        """Checks trip date logic."""
        start_date = data.get("start_date")
        end_date = data.get("end_date")
        
        if start_date and end_date and (start_date > end_date):
            raise serializers.ValidationError(
                {"The start date cannot be after the end date."}  # More descriptive error
            )
        return data


# EXPENSE SERIALIZER
class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ["id", "trip", "amount", "date", "category", "description"]

    def validate(self, data):
        """Ensures expenses align with trip dates."""
        trip = data.get("trip")
        expense_date = data.get("date")
        today = timezone.now().date()

        if not trip:
            return data  # Skip if trip isn't provided

        # Date checks
        if expense_date < trip.start_date:
            raise serializers.ValidationError(
                {"date": "Expense can't be before the trip starts."}
            )
        if expense_date > trip.end_date:
            raise serializers.ValidationError(
                {"date": "Expense can't be after the trip ends."}
            )
        if trip.start_date > today:
            raise serializers.ValidationError(
                {"trip": "Can't add expenses to future trips."}
            )
        if trip.end_date < today:
            raise serializers.ValidationError(
                {"trip": "Can't add expenses to completed trips."}
            )

        return data