from django.urls import path
from .views import test_db_connection

urlpatterns = [
    path('health/db/', test_db_connection, name='test_db'),
]
