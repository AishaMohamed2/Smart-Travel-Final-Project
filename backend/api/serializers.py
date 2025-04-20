from rest_framework import serializers
from .models import CustomUser, Trip, Expense
from django.utils import timezone
from django.core.cache import cache
import requests

# USER SERIALIZER
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "email", "password", "first_name", "last_name", "currency"]
        extra_kwargs = {
            "password": {
                "write_only": True,
                "required": False
            },
            "email": {
                "required": True
            },
            "first_name": {
                "required": True
            },
            "last_name": {
                "required": True
            }
        }

    def validate_email(self, value):
        if self.instance and self.instance.email == value:
            return value
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

# TRIP SERIALIZER
class TripSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    
    class Meta:
        model = Trip
        fields = [
            "id", "user_id", "trip_name", "destination", "start_date", "end_date",
            "total_budget", "traveler_type", "savings", "currency"
        ]

    def validate(self, data):
        start_date = data.get("start_date")
        end_date = data.get("end_date")
        
        if start_date and end_date and (start_date > end_date):
            raise serializers.ValidationError(
                {"The start date cannot be after the end date."}
            )
        return data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        if request:
            user = request.user
            # Only convert if the viewing user's currency is different from the trip's currency
            if user.currency != instance.currency:
                try:
                    converted_amount = self.convert_currency(
                        float(data['total_budget']),
                        instance.currency,
                        user.currency
                    )
                    data['original_amount'] = data['total_budget']
                    data['original_currency'] = instance.currency
                    data['total_budget'] = converted_amount
                except Exception as e:
                    # If conversion fails, keep original amount
                    pass
                
        return data

    def convert_currency(self, amount, from_currency, to_currency):
        if from_currency == to_currency:
            return amount
            
        cache_key = f"exchange_rate_{from_currency}_{to_currency}"
        try:
            if cached_rate := cache.get(cache_key):
                return round(amount * cached_rate, 2)
                
            response = requests.get(
                f"https://api.exchangerate-api.com/v4/latest/{from_currency}",
                timeout=5
            )
            response.raise_for_status()
            data = response.json()
            rate = data['rates'].get(to_currency, 1)
            cache.set(cache_key, rate, timeout=3600)
            return round(amount * rate, 2)
            
        except requests.RequestException:
            return amount

# EXPENSE SERIALIZER
class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ["id", "trip", "amount", "date", "category", "description", "original_currency"]

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            # Set the original currency to the user's currency
            validated_data['original_currency'] = request.user.currency
        
        return super().create(validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        if request:
            user = request.user
            # Only convert if the viewing user's currency is different from the expense's original currency
            if user.currency != instance.original_currency:
                try:
                    converted_amount = self.convert_currency(
                        float(data['amount']),
                        instance.original_currency,
                        user.currency
                    )
                    data['original_amount'] = data['amount']
                    data['original_currency'] = instance.original_currency
                    data['amount'] = converted_amount
                except Exception as e:
                    # If conversion fails, keep original amount
                    pass
                
        return data

    def convert_currency(self, amount, from_currency, to_currency):
        if from_currency == to_currency:
            return amount
            
        cache_key = f"exchange_rate_{from_currency}_{to_currency}"
        try:
            if cached_rate := cache.get(cache_key):
                return round(amount * cached_rate, 2)
                
            response = requests.get(
                f"https://api.exchangerate-api.com/v4/latest/{from_currency}",
                timeout=5
            )
            response.raise_for_status()
            data = response.json()
            rate = data['rates'].get(to_currency, 1)
            cache.set(cache_key, rate, timeout=3600)
            return round(amount * rate, 2)
            
        except requests.RequestException:
            return amount

# COLLABORATOR SERIALIZER
class CollaboratorSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name']