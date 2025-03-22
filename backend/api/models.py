from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models

# Custom user manager to handle user creation logic
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")

        email = self.normalize_email(email)  # Standardize email format
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # Hash the password before saving
        user.save(using=self._db)
        return user


# Custom User model replacing Django's default User model
class CustomUser(AbstractBaseUser):
    email = models.EmailField(unique=True)  # Email as the primary identifier
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    def __str__(self):
        return self.email

# Trip Model
class Trip(models.Model):
    TRAVELER_TYPES = [
        ("luxury", "Luxury"),
        ("medium", "Medium"),
        ("budget", "Budget"),
    ]

    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="trips"
    )  # Deleting a user removes their trips

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


