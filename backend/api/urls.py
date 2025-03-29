from django.urls import path
from . import views

urlpatterns = [
     path("trips/", views.TripListCreate.as_view(), name="trip-list"),
     path("trips/<int:pk>/", views.TripDeleteView.as_view(), name="trip-delete"),
     path("trips/<int:pk>/update/", views.TripUpdateView.as_view(), name="trip-update"),
     path("expenses/", views.ExpenseListCreate.as_view(), name="expense-list"),
     path("expenses/<int:pk>/", views.ExpenseDeleteView.as_view(), name="expense-delete"),
     path("expenses/<int:pk>/update/", views.ExpenseUpdateView.as_view(), name="expense-update"),
     path("expenses/categorize/", views.categorize_expense, name="categorize-expense"),
]


