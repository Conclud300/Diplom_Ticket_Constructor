import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from tickets.models import Task, Subject

print("=" * 80)
print("ПРОВЕРКА ЗАДАНИЙ В БАЗЕ ДАННЫХ")
print("=" * 80)

# Все задания
tasks = Task.objects.all()
print(f"\nВсего заданий в базе: {tasks.count()}")

if tasks.exists():
    print("\nСписок всех заданий:")
    for task in tasks:
        print(f"  ID: {task.id}")
        print(f"  Название: {task.title[:50]}...")
        print(f"  Тип: {task.task_type}")
        print(f"  Предмет ID: {task.subject_id}")
        print(f"  Курс: {task.course}")
        print(f"  Предмет: {task.subject.name if task.subject else 'Не указан'}")
        print("-" * 40)

# Задания по предмету 1 и курсу 2
print(f"\nЗадания с subject_id=1 и course=2:")
tasks_filtered = Task.objects.filter(subject_id=1, course=2)
print(f"Найдено: {tasks_filtered.count()}")

if tasks_filtered.exists():
    for task in tasks_filtered:
        print(f"  ✓ {task.title[:50]}... (тип: {task.task_type})")
else:
    print("  ✗ Нет заданий с такими параметрами")
    
    # Проверим, есть ли задания с subject_id=1 вообще
    tasks_subj1 = Task.objects.filter(subject_id=1)
    print(f"\nЗадания с subject_id=1 (любой курс): {tasks_subj1.count()}")
    if tasks_subj1.exists():
        courses = set(tasks_subj1.values_list('course', flat=True))
        print(f"  Курсы, на которые назначены задания: {sorted(courses)}")
        
        for task in tasks_subj1:
            print(f"  - {task.title[:30]}... (курс: {task.course})")

# Проверим, какие предметы есть
print(f"\nПредметы в базе:")
subjects = Subject.objects.all()
for subject in subjects:
    task_count = Task.objects.filter(subject=subject).count()
    print(f"  ID: {subject.id}, Название: {subject.name}, Курс: {subject.course}, Заданий: {task_count}")

print("\n" + "=" * 80)