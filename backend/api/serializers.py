from rest_framework import serializers
from .models import CustomUser, Trip, Expense
from django.core.cache import cache
import requests

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "email", "password", "first_name", "last_name", "currency"]
        extra_kwargs = {
            "password": {"write_only": True},
            "email": {"required": True},
            "first_name": {"required": True},
            "last_name": {"required": True},
        }

    def validate_email(self, value):
        value = value.lower()
        if self.instance and self.instance.email == value:
            return value
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

class TripSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Trip
        fields = [
            "id", "user_id", "trip_name", "destination", 
            "start_date", "end_date", "total_budget", 
            "traveler_type", "savings", "currency"
        ]

    def validate(self, data):
        if data.get("start_date") and data.get("end_date") and data["start_date"] > data["end_date"]:
            raise serializers.ValidationError("Start date must be before end date.")
        return data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        if request and request.user.currency != instance.currency:
            data = self._convert_currency(data, instance.currency, request.user.currency)
        return data

    def _convert_currency(self, data, from_currency, to_currency):
        try:
            amount = float(data['total_budget'])
            if from_currency != to_currency:
                rate = self._get_exchange_rate(from_currency, to_currency)
                data['original_amount'] = data['total_budget']
                data['original_currency'] = from_currency
                data['total_budget'] = round(amount * rate, 2)
        except (ValueError, requests.RequestException):
            pass
        return data

    def _get_exchange_rate(self, from_currency, to_currency):
        cache_key = f"exchange_rate_{from_currency}_{to_currency}"
        if cached_rate := cache.get(cache_key):
            return cached_rate
            
        response = requests.get(
            f"https://api.exchangerate-api.com/v4/latest/{from_currency}",
            timeout=3
        )
        response.raise_for_status()
        rate = response.json()['rates'].get(to_currency, 1)
        cache.set(cache_key, rate, timeout=3600)
        return rate
    

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ["id", "trip", "amount", "date", "category", "description", "original_currency"]

    def create(self, validated_data):
        if request := self.context.get('request'):
            validated_data['original_currency'] = request.user.currency
        return super().create(validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if request := self.context.get('request'):
            data = self._convert_currency(data, instance.original_currency, request.user.currency)
        return data

    def _convert_currency(self, data, from_currency, to_currency):
        try:
            amount = float(data['amount'])
            if from_currency != to_currency:
                rate = self._get_exchange_rate(from_currency, to_currency)
                data['original_amount'] = data['amount']
                data['original_currency'] = from_currency
                data['amount'] = round(amount * rate, 2)
        except (ValueError, requests.RequestException):
            pass
        return data

    # Reuse the same rate fetching logic from TripSerializer
    _get_exchange_rate = TripSerializer._get_exchange_rate

class CollaboratorSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name']