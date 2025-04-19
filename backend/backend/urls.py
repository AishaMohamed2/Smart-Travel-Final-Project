from django.contrib import admin
from django.urls import path, include
from api.views import CreateUserView, UserDetailView, UserUpdateView, UserDeleteView, CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/user/register/", CreateUserView.as_view(), name="register"),
    path("api/token/", TokenObtainPairView.as_view(), name="get_token"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("api-auth/", include("rest_framework.urls")),
    path("api/", include("api.urls")),
    path("api/user/", UserDetailView.as_view(), name="user-detail"),
    path("api/user/update/", UserUpdateView.as_view(), name="user-update"),
    path("api/user/delete/", UserDeleteView.as_view(), name="user-delete"),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
]