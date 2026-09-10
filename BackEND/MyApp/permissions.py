from rest_framework.permissions import BasePermission


class IsStaffUser(BasePermission):
    """
    فقط کاربرانی که is_staff=True دارند (ادمین‌های پنل) به این endpoint دسترسی دارند.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
        )


class CanManageTargetUser(BasePermission):
    """
    محدودیت تکمیلی برای مدیریت کاربران:
    - فقط سوپریوزر می‌تواند کاربران staff/superuser دیگر را بسازد یا ویرایش کند.
    - یک ادمین معمولی (is_staff) فقط می‌تواند کاربران عادی (غیر staff) را مدیریت کند.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_superuser:
            return True
        if obj.is_staff or obj.is_superuser:
            return False
        return True
