from django.urls import path
from . import views

urlpatterns = [
     path("trips/", views.TripListCreate.as_view(), name="trip-list"),
     path("trips/<int:pk>/", views.TripDeleteView.as_view(), name="trip-delete"),
     path("trips/<int:pk>/update/", views.TripUpdateView.as_view(), name="trip-update"),
     
]

