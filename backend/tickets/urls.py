from django.urls import path
from .views import (
    api_subjects, api_groups, api_chairmen, api_deputy_directors, api_teachers, api_tasks, test_api,
    LoginView, LogoutView,
    TicketGenerationView, TicketPreviewView, PDFGenerationView, TaskStatisticsView,
    TaskImportView
)

urlpatterns = [
    # Аутентификация
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    
    # Простые API для React
    path('subjects/', api_subjects, name='api-subjects'),
    path('groups/', api_groups, name='api-groups'),
    path('chairmen/', api_chairmen, name='api-chairmen'),
    path('deputy-directors/', api_deputy_directors, name='api-deputy-directors'),
    path('teachers/', api_teachers, name='api-teachers'),
    path('tasks/', api_tasks, name='api-tasks'),
    path('test/', test_api, name='test-api'),
    
    # Импорт заданий
    path('import-tasks/', TaskImportView.as_view(), name='import-tasks'),
    
    # Генерация билетов
    path('generate/', TicketGenerationView.as_view(), name='generate-tickets'),
    path('preview/', TicketPreviewView.as_view(), name='preview-tickets'),
    path('generate-pdf/', PDFGenerationView.as_view(), name='generate-pdf'),
    path('statistics/', TaskStatisticsView.as_view(), name='statistics'),
]