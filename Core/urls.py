import re

from django.contrib import admin
from django.urls import include, path, re_path
from django.conf import settings
from django.conf.urls.static import static

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
    urlpatterns.append(re_path(rf"^{_prefix}(?:/.*)?$", spa_shell, name="spa"))

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
