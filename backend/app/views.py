# from django.shortcuts import render
from django.http import JsonResponse
from django.db import connections
from django.db.utils import OperationalError


def test_db_connection(request):
    db_conn = connections['default']
    try:
        # تلاش برای اتصال واقعی به دیتابیس
        return JsonResponse({
            "status": "success",
            "message": "Connected to PostgreSQL successfully",
            "database": db_conn.settings_dict['NAME']
        }, status=200)
    except OperationalError as e:
        return JsonResponse({
            "status": "error",
            "message": f"Database connection failed:@@@@@@@@@@############# {str(e)}"
        }, status=500)
