from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models

# Custom user manager to handle user creation logic
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        # Ensure the email field is provided
        if not email:
            raise ValueError("The Email field must be set")
        # Normalise the email to ensure consistency (e.g., lowercase domain)
        email = self.normalize_email(email)
        # Create a user instance with the provided email and extra fields
        user = self.model(email=email, **extra_fields)
        # Hash the password before saving it to the database
        user.set_password(password)
        # Save the user to the database
        user.save(using=self._db)
        return user


# Custom User model to replace Django's default User model
class CustomUser(AbstractBaseUser):
    # Use email as the primary identifier for users
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)

    # Use the custom user manager for this model
    objects = CustomUserManager()

    # Specify that the email field is used for authentication
    USERNAME_FIELD = "email"
    # Additional required fields when creating a user
    REQUIRED_FIELDS = ["first_name", "last_name"]

    def __str__(self):
        # Return the email when the user object is printed
        return self.email

# Trip Model to store trip details
class Trip(models.Model):
    # Define choices for the traveler type field
    TRAVELER_TYPES = [
        ("luxury", "Luxury"),
        ("medium", "Medium"),
        ("budget", "Budget"),
    ]

    # Link the trip to a user. If the user is deleted, their trips are also deleted
    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="trips"
    )

    # Fields for trip details
    trip_name = models.CharField(max_length=255)
    destination = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    total_budget = models.DecimalField(max_digits=10, decimal_places=2)
    traveler_type = models.CharField(
        max_length=10, choices=TRAVELER_TYPES, default="medium"
    )
    savings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.trip_name} - {self.destination} ({self.start_date} to {self.end_date})"