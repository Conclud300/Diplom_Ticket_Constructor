from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Создает суперпользователя, если его нет'

    def handle(self, *args, **options):
        if not User.objects.filter(is_superuser=True).exists():
            User.objects.create_superuser(
                username='admin',
                email='denis010606@gmail.com',
                password='fopapop1337'
            )
            self.stdout.write(self.style.SUCCESS('Суперпользователь admin создан с паролем admin123'))
        else:
            self.stdout.write(self.style.SUCCESS('Суперпользователь уже существует'))