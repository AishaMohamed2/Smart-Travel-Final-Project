""" Title: <Django & React Web App Tutorial - Authentication, Databases, Deployment & More...>
Author: <Tech with Tim>
Date: <26/03/2024>
Code version: <n/a>
Availability: <https://www.youtube.com/watch?v=c-QsfbznSXI> 
Model for user creation inspired by this video but i wanted to use email so did a custom user
"""

""" Title: <Learn Django - Build a Custom User Model with Extended Fields>
Author: <Very Academy>
Date: <07/09/2020>
Code version: <n/a>
Availability: <https://www.youtube.com/watch?v=Ae7nc1EGv-A> 
Lines reused specified below
"""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models

#REUSED FROM Very Academy (LINE 22-61)

# USER MANAGER
class CustomUserManager(BaseUserManager):
    """
    Manages creation of CustomUser instances with email as primary key.
    """
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
    """
    Custom user model using email as username instead of default username.
    """
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
    """
    Can be shared with other users (tripmates) for collaborative planning.
    """
    TRAVELER_TYPES = [
        ("luxury", "Luxury"),
        ("medium", "Medium"),
        ("budget", "Budget"),
    ]

    # Trip details 
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="trips")
    trip_name = models.CharField(max_length=255)
    destination = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    total_budget = models.DecimalField(max_digits=10, decimal_places=2)
    traveler_type = models.CharField(max_length=10, choices=TRAVELER_TYPES, default="medium")
    savings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tripmate = models.ManyToManyField(CustomUser, related_name="collaborated_trips", blank=True)
    currency = models.CharField(max_length=3, default='GBP')

    def __str__(self):
        return f"{self.trip_name} ({self.destination})"

    def is_user_allowed(self, user):
        """Check if user is owner or tripmate"""
        return self.user == user or user in self.tripmate.all()
    

# EXPENSE MODEL 
class Expense(models.Model):
    """
    Individual expense within a trip.
    """
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

    def __str__(self):
        return f"{self.category}: {self.amount} on {self.date}"