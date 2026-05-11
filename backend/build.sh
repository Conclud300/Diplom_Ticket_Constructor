#!/bin/bash

echo "🚀 Starting build process..."

# Обновляем pip и устанавливаем зависимости
pip install --upgrade pip
pip install -r requirements.txt

# Собираем статику и применяем миграции
python manage.py collectstatic --noinput
python manage.py migrate

echo "✅ Build completed!"