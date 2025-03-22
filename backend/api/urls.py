from django.urls import path
from . import views

urlpatterns = [
     path("trips/", views.TripListCreate.as_view(), name="trip-list"),
     path("trips/<int:pk>/", views.TripDeleteView.as_view(), name="trip-delete"),
     
]

