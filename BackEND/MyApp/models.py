from django.conf import settings
from django.db import models


class Item(models.Model):
    """
    یک مدل نمونه برای نمایش قابلیت «افزودن/تغییر داده در PostgreSQL توسط ادمین».
    این مدل را می‌توانی حذف کنی و مدل‌های واقعی پروژه‌ات را با همین الگو
    (models -> serializers -> viewset -> permission) اضافه کنی.
    """
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="items",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title