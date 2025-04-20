from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models

# USER MANAGER
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        # Check if email exists
        if not email:
            raise ValueError("Email is required")
        

        email = self.normalize_email(email)
        

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        
        return user


# USER MODEL
class CustomUser(AbstractBaseUser):
    # User details
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    currency = models.CharField(max_length=3, default='GBP')

    # Use the custom user manager for this model
    objects = CustomUserManager()

    # Login settings
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

# TRIP MODEL 
class Trip(models.Model):
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
    currency = models.CharField(max_length=3, default='GBP')

    def __str__(self):
        return f"{self.trip_name} ({self.destination})"

    def is_user_allowed(self, user):
        """Check if user is owner or collaborator"""
        return self.user == user or user in self.collaborators.all()
    

# EXPENSE MODEL 
class Expense(models.Model):
    CATEGORY_CHOICES = [
        ("food", "Food & Dining"),
        ("transport", "Transport"),
        ("accommodation", "Accommodation"),
        ("entertainment", "Entertainment"),
        ("other", "Other"),
    ]

    # Expense details
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="expenses")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True, null=True)
    original_currency = models.CharField(max_length=3, default='GBP')  # Currency of the user who added the expense

    # How expenses are displayed
    def __str__(self):
        return f"{self.category}: {self.amount} on {self.date}"