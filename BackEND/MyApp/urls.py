from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ItemViewSet,
    UserViewSet,
    csrf_view,
    login_view,
    logout_view,
    me_view,
    test_db_connection,
)

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("items", ItemViewSet, basename="item")

urlpatterns = [
    path("auth/csrf/", csrf_view),
    path("auth/login/", login_view),
    path("auth/logout/", logout_view),
    path("auth/me/", me_view),
    path("", include(router.urls)),
    path('health/db/', test_db_connection, name='test_db'),
]
