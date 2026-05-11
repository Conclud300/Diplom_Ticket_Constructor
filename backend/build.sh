#!/bin/bash

# Установка зависимостей
pip install -r requirements.txt

# Сбор статики
python manage.py collectstatic --noinput

# Миграции
python manage.py migrate