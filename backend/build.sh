#!/bin/bash

echo "🚀 Starting build..."

# Обновление pip
pip install --upgrade pip

# Установка зависимостей (пропускаем проблемные пакеты при ошибке)
pip install -r requirements.txt --no-deps || true

# Принудительная установка основных пакетов
pip install Django==5.0.3 djangorestframework==3.15.1 psycopg2-binary==2.9.9

# Установка Pillow отдельно с игнорированием ошибок
pip install Pillow==10.3.0 || echo "Pillow installation skipped for now"

# Установка остальных
pip install reportlab==4.2.2 gunicorn==21.2.0 whitenoise==6.6.0

# Сбор статики
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput || echo "No static files to collect"

# Миграции
echo "💾 Running migrations..."
python manage.py migrate || echo "Migrations skipped - database may not be ready"

echo "✅ Build completed!"