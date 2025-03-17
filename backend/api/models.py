from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models

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

    USERNAME_FIELD = 'email'  # Use email as the unique identifier instead of username
    REQUIRED_FIELDS = ['first_name', 'last_name']  

    def __str__(self):
        return self.email  # Display email when printing user instances

# Note Model (Allows users to create and manage notes)
class Note(models.Model):
    title = models.CharField(max_length=100)  # Note title with a max length
    content = models.TextField()  # Stores the main content of the note
    created_at = models.DateTimeField(auto_now_add=True)  # Auto timestamp when created
    author = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="notes"
    )  # Link notes to users, deleting a user removes their notes

    def __str__(self):
        return self.title  # Display title when printing note instances
