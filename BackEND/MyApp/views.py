import time

from django.contrib.auth import get_user_model, login, logout
from django.db import connections
from django.db.utils import OperationalError
from django.http import JsonResponse
from django.middleware.csrf import get_token
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Item
from .permissions import CanManageTargetUser, IsStaffUser
from .serializers import (
    ItemSerializer,
    LoginSerializer,
    UserCreateUpdateSerializer,
    UserSerializer,
)

User = get_user_model()


def test_db_connection(request):
    """
    بررسی واقعی وضعیت اتصال به دیتابیس PostgreSQL.
    یک کوئری واقعی روی کانکشن اجرا می‌شود تا از برقرار بودن اتصال مطمئن شویم.
    """
    db_conn = connections['default']
    start_time = time.monotonic()

    try:
        with db_conn.cursor() as cursor:
            cursor.execute("SELECT version();")
            pg_version = cursor.fetchone()[0]

        elapsed_ms = round((time.monotonic() - start_time) * 1000, 2)

        return JsonResponse({
            "status": "success",
            "message": "اتصال به PostgreSQL با موفقیت برقرار شد",
            "database": db_conn.settings_dict.get("NAME"),
            "host": db_conn.settings_dict.get("HOST"),
            "port": db_conn.settings_dict.get("PORT"),
            "postgres_version": pg_version,
            "response_time_ms": elapsed_ms,
        }, status=200)

    except OperationalError as e:
        return JsonResponse({
            "status": "error",
            "message": "اتصال به دیتابیس برقرار نشد",
            "detail": str(e),
        }, status=503)

    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": "خطای غیرمنتظره هنگام بررسی اتصال",
            "detail": str(e),
        }, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
def csrf_view(request):
    """
    فرانت‌اند باید قبل از هر لاگین یک بار این endpoint را صدا بزند
    تا کوکی csrftoken روی مرورگر ست شود.
    """
    return Response({"csrfToken": get_token(request)})


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]
    login(request, user)
    return Response(UserSerializer(user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({"detail": "خروج با موفقیت انجام شد"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(UserSerializer(request.user).data)


class UserViewSet(viewsets.ModelViewSet):
    """
    مدیریت کاربران — فقط برای کاربران is_staff=True در دسترس است.
    """
    queryset = User.objects.all().order_by("-date_joined")
    permission_classes = [IsStaffUser, CanManageTargetUser]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return UserCreateUpdateSerializer
        return UserSerializer

    def perform_destroy(self, instance):
        if instance == self.request.user:
            raise ValidationError("نمی‌توانید حساب کاربری خودتان را حذف کنید")
        instance.delete()


class ItemViewSet(viewsets.ModelViewSet):
    """
    نمونه‌ای از افزودن/تغییر داده در PostgreSQL:
    - هر کاربر لاگین‌کرده می‌تواند فهرست را ببیند
    - فقط ادمین‌ها (is_staff) اجازه‌ی ایجاد/ویرایش/حذف دارند
    """
    queryset = Item.objects.select_related("created_by").all()
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method not in ("GET", "HEAD", "OPTIONS"):
            return [IsStaffUser()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
