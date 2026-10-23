from django.urls import path

from . import views

urlpatterns = [
    path("csrf/", views.csrf, name="api_csrf"),
    path("me/", views.me, name="api_me"),
    path("auth/login/", views.auth_login, name="api_login"),
    path("auth/logout/", views.auth_logout, name="api_logout"),
    path("language/", views.set_language, name="api_language"),
    path("site/", views.site, name="api_site"),
    path("templates/", views.templates_list, name="api_templates"),
]
