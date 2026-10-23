import re

from django.contrib import admin
from django.urls import include, path, re_path
from django.conf import settings
from django.conf.urls.static import static

from system.api import invite_page
from system.spa import spa_shell

urlpatterns = [
    path('admin/', admin.site.urls),
    # مبدّل اللغة (set_language) — يحفظ الاختيار في الجلسة والكوكي
    path('i18n/', include('django.conf.urls.i18n')),
    # واجهة JSON لتطبيق React
    path('api/v1/', include('system.api.urls')),
    path('', include('system.urls')),
]

# تطبيق React: كل ما تحت SPA_BASENAME بيرجّع الـshell والـrouter بيكمّل.
if settings.SPA_BASENAME:
    _prefix = re.escape(settings.SPA_BASENAME.strip("/"))
    # صفحات الدعوة ليها entry خفيف خاص بيها (من غير لوحة التحكم) و<head> بيتبني
    # على السيرفر للمعاينة (OG). لازم تتسجّل **قبل** الـcatch-all تحت.
    urlpatterns += [
        re_path(rf"^{_prefix}/i/(?P<slug>[-\w]+)/?$",
                invite_page.invitation_page, name="spa_invite"),
        re_path(rf"^{_prefix}/i/(?P<slug>[-\w]+)/g/(?P<token>[^/]+)/?$",
                invite_page.invitation_page, name="spa_invite_guest"),
        re_path(rf"^{_prefix}/templates/(?P<slug>[-\w]+)/preview/?$",
                invite_page.template_page, name="spa_template_preview"),
    ]
    urlpatterns.append(re_path(rf"^{_prefix}(?:/.*)?$", spa_shell, name="spa"))

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
