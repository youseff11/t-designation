"""مسارات الموقع العام (الباقات، الأسئلة، نموذج الطلب، القوالب…).

صاحب الملف: B1. كل مسارات الميزة (views + serializers + urlpatterns) هنا
أو في ملفات جنبه بنفس البادئة — مابتلمسش ‎views.py‎ و‎serializers.py‎ (الأساس
المشترك) ولا ملفات الميزات التانية. شكل الرد والأخطاء في ‎http.py‎.
"""

from django.urls import path  # noqa: F401  (مستخدم لما تضيف المسارات)

urlpatterns: list = []
