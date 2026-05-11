from django.db import models
from django.contrib.auth.models import User

class Subject(models.Model):
    """Предмет (дисциплина)"""
    name = models.CharField(max_length=200, verbose_name="Название дисциплины")
    code = models.CharField(max_length=50, verbose_name="Код МДК", blank=True)
    hours = models.IntegerField(verbose_name="Количество часов")
    specialty = models.CharField(max_length=200, verbose_name="Специальность")
    course = models.IntegerField(verbose_name="Курс")
    has_exam = models.BooleanField(default=True, verbose_name="Есть экзамен")
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    
    def __str__(self):
        return f"{self.name} ({self.specialty}, {self.course} курс)"

class Teacher(models.Model):
    """Преподаватель"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile', null=True, blank=True)
    full_name = models.CharField(max_length=200, verbose_name="ФИО")
    department = models.CharField(max_length=200, verbose_name="Кафедра")
    position = models.CharField(max_length=100, verbose_name="Должность")
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    phone = models.CharField(max_length=20, blank=True, verbose_name="Телефон")
    email = models.EmailField(verbose_name="Email")
    
    def __str__(self):
        return self.full_name

class PZKChairman(models.Model):
    """Председатель ПЦК"""
    full_name = models.CharField(max_length=200, verbose_name="ФИО")
    position = models.CharField(max_length=200, verbose_name="Должность")
    department = models.CharField(max_length=200, verbose_name="ПЦК")
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    
    def __str__(self):
        return self.full_name

class DeputyDirector(models.Model):
    """Заместитель директора ИСПО"""
    full_name = models.CharField(max_length=200, verbose_name="ФИО")
    position = models.CharField(max_length=200, verbose_name="Должность", default="Заместитель директора по УМР")
    short_name = models.CharField(max_length=50, verbose_name="Краткое имя", default="Конакина Е.Г.")
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    
    def __str__(self):
        return f"{self.full_name} - {self.position}"

class StudentGroup(models.Model):
    """Группа студентов"""
    name = models.CharField(max_length=50, verbose_name="Название группы")
    course = models.IntegerField(verbose_name="Курс")
    specialty = models.CharField(max_length=200, verbose_name="Специальность")
    start_year = models.IntegerField(verbose_name="Год начала обучения")
    is_active = models.BooleanField(default=True, verbose_name="Активна")
    
    def __str__(self):
        return f"{self.name} ({self.specialty})"

class Task(models.Model):
    """Задание для билетов"""
    TASK_TYPES = [
        ('oral', 'Устное'),
        ('practical', 'Практическое'),
    ]
    
    title = models.CharField(max_length=500, verbose_name="Название задания")
    description = models.TextField(verbose_name="Текст задания", blank=True)
    task_type = models.CharField(max_length=20, choices=TASK_TYPES, verbose_name="Тип задания")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='tasks')
    course = models.IntegerField(verbose_name="Для курса")
    difficulty = models.IntegerField(default=1, verbose_name="Сложность (1-5)")
    attachment = models.FileField(upload_to='tasks/', blank=True, null=True, verbose_name="Файл с заданием")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title[:50]}... ({self.get_task_type_display()})"

class TicketTemplate(models.Model):
    """Шаблон билета"""
    name = models.CharField(max_length=200, verbose_name="Название шаблона")
    header_template = models.TextField(verbose_name="Шапка билета")
    footer_template = models.TextField(verbose_name="Подвал билета")
    is_default = models.BooleanField(default=False, verbose_name="Шаблон по умолчанию")
    
    def __str__(self):
        return self.name

class GeneratedTicket(models.Model):
    """Сгенерированный билет"""
    ticket_number = models.IntegerField(verbose_name="Номер билета")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    groups = models.ManyToManyField(StudentGroup)
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Преподаватель")
    chairman = models.ForeignKey(PZKChairman, on_delete=models.CASCADE, verbose_name="Председатель ПЦК")
    deputy_director = models.ForeignKey(DeputyDirector, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Зам. директора")
    tasks = models.ManyToManyField(Task, through='TicketTask')
    generation_date = models.DateTimeField(auto_now_add=True)
    semester = models.IntegerField(default=5, verbose_name="Семестр")
    
    class Meta:
        ordering = ['ticket_number']

class TicketTask(models.Model):
    """Связь билета и заданий"""
    ticket = models.ForeignKey(GeneratedTicket, on_delete=models.CASCADE)
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    order = models.IntegerField(verbose_name="Порядковый номер в билете")
    
    class Meta:
        ordering = ['order']

class TaskImportBatch(models.Model):
    """Пакет импорта заданий из файла"""
    file_name = models.CharField(max_length=500, verbose_name="Имя файла")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, verbose_name="Предмет")
    course = models.IntegerField(verbose_name="Курс")
    task_type = models.CharField(max_length=20, choices=Task.TASK_TYPES, verbose_name="Тип заданий")
    imported_count = models.IntegerField(default=0, verbose_name="Создано заданий")
    updated_count = models.IntegerField(default=0, verbose_name="Обновлено заданий")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата импорта")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Импортировал")
    
    class Meta:
        verbose_name = "Импорт заданий"
        verbose_name_plural = "Импорты заданий"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.file_name} - {self.created_at.strftime('%d.%m.%Y %H:%M')}"