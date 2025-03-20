from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError

# Custom user manager to handle user creation logic
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')


        email = self.normalize_email(email)  # Email is stored in a standard format
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # Hash the password before saving
        user.save(using=self._db)  # Save the user instance
        return user


# Custom User model replacing Django's default User model
class CustomUser(AbstractBaseUser):
    email = models.EmailField(unique=True)  # Primary identifier for authentication
    first_name = models.CharField(max_length=30)  
    last_name = models.CharField(max_length=30)   
   

    objects = CustomUserManager()  # Link the custom manager to this model

    USERNAME_FIELD = 'email'  
    REQUIRED_FIELDS = ['first_name', 'last_name']  

    def __str__(self):
        return self.email  # Display email when printing user instances


class Trip(models.Model):
    TRAVELER_TYPES = [
        ("luxury", "Luxury"),
        ("medium", "Medium"),
        ("budget", "Budget"),
    ]

    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="trips"
    )  # Link trips to users, deleting a user removes their trips
    trip_name = models.CharField(max_length=255)  # Name of the trip
    destination = models.CharField(max_length=255)  # Destination of the trip
    start_date = models.DateField()  # Start date of the trip
    end_date = models.DateField()  # End date of the trip
    total_budget = models.DecimalField(max_digits=10, decimal_places=2)  # Total budget for the trip
    traveler_type = models.CharField(
        max_length=10, choices=TRAVELER_TYPES, default="medium"
    )  # Type of traveler (Luxury, Medium, Budget)

    savings = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00
    )  
    
    


    def __str__(self):
        return f"{self.trip_name} - {self.destination} ({self.start_date} to {self.end_date})"
