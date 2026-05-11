#!/bin/bash

# Установка зависимостей
pip install --upgrade pip
pip install -r requirements.txt

# Сбор статики
python manage.py collectstatic --noinput

# Применение миграций
python manage.py migrate