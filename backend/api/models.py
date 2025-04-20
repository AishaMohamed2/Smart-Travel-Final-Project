from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models

class CustomUserManager(BaseUserManager):
    """
    Custom user manager for email-based authentication.
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """
        Creates and saves a user with the given email and password.
        """
        if not email:
            raise ValueError("Users must have an email address.")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class CustomUser(AbstractBaseUser):
    """
    Custom user model that uses email as the primary identifier.
    """
    
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    currency = models.CharField(max_length=3, default='USD')

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email if not self.first_name else f"{self.first_name} {self.last_name}"

class Trip(models.Model):
    """
    Represents a travel trip with budget tracking.
    """
    
    TRAVELER_TYPES = [
        ("luxury", "Luxury"),
        ("medium", "Medium"),
        ("budget", "Budget"),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="trips")
    trip_name = models.CharField(max_length=255)
    destination = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    total_budget = models.DecimalField(max_digits=10, decimal_places=2)
    traveler_type = models.CharField(max_length=10, choices=TRAVELER_TYPES, default="medium")
    savings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    collaborators = models.ManyToManyField(CustomUser, related_name="collaborated_trips", blank=True)
    currency = models.CharField(max_length=3, default='USD')

    def __str__(self):
        return f"{self.trip_name} - {self.destination}"

    def is_user_allowed(self, user):
        """
        Checks if the user has permission to access this trip.
        """
        return self.user == user or user in self.collaborators.all()
    

class Expense(models.Model):
    """
    Represents an expense associated with a trip.
    """
    
    CATEGORY_CHOICES = [
        ("food", "Food & Dining"),
        ("transport", "Transportation"),
        ("accommodation", "Accommodation"),
        ("entertainment", "Entertainment"),
        ("other", "Other"),
    ]

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="expenses")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True, null=True)
    original_currency = models.CharField(max_length=3, default='USD')

    def __str__(self):
        return f"{self.category}: {self.amount} ({self.date})"