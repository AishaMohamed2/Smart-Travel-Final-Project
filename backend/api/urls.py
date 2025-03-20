from django.urls import path
from . import views

urlpatterns = [
     path("trips/", views.TripListCreate.as_view(), name="trip-list"),
]