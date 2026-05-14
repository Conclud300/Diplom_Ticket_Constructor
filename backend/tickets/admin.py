from django.contrib import admin
from django.shortcuts import render, redirect
from django.contrib import messages
from django.urls import path
from django.utils.html import format_html
from django.http import HttpResponseRedirect
from django.urls import reverse
import codecs
from .models import *
from .forms import TaskImportForm

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'specialty', 'course', 'has_exam', 'is_active')
    list_filter = ('course', 'specialty', 'has_exam', 'is_active')
    search_fields = ('name', 'code')
    list_editable = ('is_active',)
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'code', 'hours')
        }),
        ('Специализация', {
            'fields': ('specialty', 'course', 'has_exam')
        }),
        ('Статус', {
            'fields': ('is_active',)
        }),
    )

@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'department', 'position', 'is_active', 'email')
    list_filter = ('is_active', 'department')
    search_fields = ('full_name', 'email', 'phone')
    list_editable = ('is_active',)
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'full_name', 'position')
        }),
        ('Контакты', {
            'fields': ('department', 'phone', 'email')
        }),
        ('Статус', {
            'fields': ('is_active',)
        }),
    )

@admin.register(PZKChairman)
class PZKChairmanAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'department', 'position', 'is_active')
    list_filter = ('is_active', 'department')
    search_fields = ('full_name',)
    list_editable = ('is_active',)

@admin.register(DeputyDirector)
class DeputyDirectorAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'position', 'short_name', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('full_name', 'short_name')
    list_editable = ('is_active',)

@admin.register(StudentGroup)
class StudentGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'course', 'specialty', 'start_year', 'is_active')
    list_filter = ('course', 'specialty', 'is_active')
    search_fields = ('name', 'specialty')
    list_editable = ('is_active',)

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('short_title', 'task_type', 'subject', 'course', 'difficulty', 'created_at')
    list_filter = ('task_type', 'course', 'subject', 'difficulty')
    search_fields = ('title', 'description')
    list_per_page = 25
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'description', 'task_type')
        }),
        ('Привязка', {
            'fields': ('subject', 'course')
        }),
        ('Дополнительно', {
            'fields': ('difficulty', 'attachment')
        }),
    )
    
    def short_title(self, obj):
        return obj.title[:50] + '...' if len(obj.title) > 50 else obj.title
    short_title.short_description = 'Название'
    
    actions = ['duplicate_tasks', 'change_difficulty']
    
    def duplicate_tasks(self, request, queryset):
        """Дублировать выбранные задания"""
        for task in queryset:
            task.pk = None
            task.title = f"Копия {task.title}"
            task.save()
        self.message_user(request, f"Создано {queryset.count()} копий заданий")
    duplicate_tasks.short_description = "Создать копии выбранных заданий"
    
    def change_difficulty(self, request, queryset):
        """Изменить сложность заданий"""
        difficulty = request.POST.get('difficulty', 1)
        updated = queryset.update(difficulty=difficulty)
        self.message_user(request, f"Сложность изменена для {updated} заданий")
    change_difficulty.short_description = "Изменить сложность"
    
    # Добавляем кнопку импорта в changelist
    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['show_import_button'] = True
        extra_context['import_url'] = reverse('admin:import-tasks')
        return super().changelist_view(request, extra_context=extra_context)
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('import-tasks/', self.admin_site.admin_view(self.import_tasks_view), name='import-tasks'),
        ]
        return custom_urls + urls
    
    def import_tasks_view(self, request):
        """View для импорта заданий из файла"""
        if request.method == 'POST':
            form = TaskImportForm(request.POST, request.FILES)
            if form.is_valid():
                file = form.cleaned_data['file']
                subject = form.cleaned_data['subject']
                course = form.cleaned_data['course']
                task_type = form.cleaned_data['task_type']
                delimiter = form.cleaned_data['delimiter']
                override = form.cleaned_data['override_existing']
                
                try:
                    content = None
                    encodings = ['utf-8', 'windows-1251', 'koi8-r']
                    
                    for encoding in encodings:
                        try:
                            file.seek(0)
                            content = file.read().decode(encoding)
                            break
                        except UnicodeDecodeError:
                            continue
                    
                    if content is None:
                        messages.error(request, 'Не удалось прочитать файл. Проверьте кодировку (должна быть UTF-8)')
                        return render(request, 'admin/task_import.html', {
                            'form': form,
                            'subjects': Subject.objects.filter(is_active=True),
                            'title': 'Импорт заданий из файла'
                        })
                    
                except Exception as e:
                    messages.error(request, f'Ошибка чтения файла: {str(e)}')
                    return render(request, 'admin/task_import.html', {
                        'form': form,
                        'subjects': Subject.objects.filter(is_active=True),
                        'title': 'Импорт заданий из файла'
                    })
                
                raw_tasks = content.split(delimiter)
                
                imported = 0
                updated = 0
                errors = []
                
                for i, raw_task in enumerate(raw_tasks, 1):
                    raw_task = raw_task.strip()
                    if not raw_task:
                        continue
                    
                    lines = raw_task.split('\n')
                    title = lines[0].strip()
                    
                    if len(title) > 500:
                        title = title[:497] + '...'
                    
                    description = '\n'.join(lines[1:]).strip() if len(lines) > 1 else ''
                    
                    if not title:
                        errors.append(f'Задание {i}: пустое название')
                        continue
                    
                    try:
                        existing = Task.objects.filter(
                            title=title,
                            subject=subject,
                            course=course,
                            task_type=task_type
                        ).first()
                        
                        if existing and override:
                            existing.description = description
                            existing.save()
                            updated += 1
                        elif not existing:
                            Task.objects.create(
                                title=title,
                                description=description,
                                task_type=task_type,
                                subject=subject,
                                course=course,
                                difficulty=1
                            )
                            imported += 1
                        else:
                            errors.append(f'Задание {i}: "{title[:30]}..." уже существует')
                            
                    except Exception as e:
                        errors.append(f'Задание {i}: ошибка - {str(e)}')
                
                if imported > 0 or updated > 0:
                    TaskImportBatch.objects.create(
                        file_name=file.name,
                        subject=subject,
                        course=course,
                        task_type=task_type,
                        imported_count=imported,
                        updated_count=updated,
                        created_by=request.user
                    )
                
                if imported > 0 or updated > 0:
                    messages.success(
                        request, 
                        f'Импорт завершен! Создано: {imported}, обновлено: {updated}'
                    )
                else:
                    messages.warning(request, 'Не импортировано ни одного задания')
                
                if errors:
                    for error in errors[:10]:
                        messages.warning(request, error)
                    
                return redirect('admin:tickets_task_changelist')
        else:
            form = TaskImportForm()
        
        total_tasks = Task.objects.count()
        oral_tasks = Task.objects.filter(task_type='oral').count()
        practical_tasks = Task.objects.filter(task_type='practical').count()
        
        return render(request, 'admin/task_import.html', {
            'form': form,
            'subjects': Subject.objects.filter(is_active=True),
            'title': 'Импорт заданий из файла',
            'total_tasks': total_tasks,
            'oral_tasks': oral_tasks,
            'practical_tasks': practical_tasks,
            'opts': self.model._meta,
        })

@admin.register(GeneratedTicket)
class GeneratedTicketAdmin(admin.ModelAdmin):
    # ИСПРАВЛЕНО: убрали teacher (ForeignKey), добавили get_teachers (ManyToMany)
    list_display = ('ticket_number', 'subject', 'get_teachers', 'chairman', 'deputy_director', 'generation_date')
    # ИСПРАВЛЕНО: убрали teacher из list_filter
    list_filter = ('subject', 'chairman', 'deputy_director', 'semester', 'generation_date')
    search_fields = ('ticket_number', 'subject__name')
    readonly_fields = ('generation_date',)
    
    def get_teachers(self, obj):
        """Возвращает список преподавателей"""
        return ', '.join([t.full_name for t in obj.teachers.all()])
    get_teachers.short_description = 'Преподаватели'
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('ticket_number', 'subject', 'semester')
        }),
        ('Участники', {
            'fields': ('groups', 'teachers', 'chairman', 'deputy_director')
        }),
        ('Дата', {
            'fields': ('generation_date',)
        }),
    )
    # ИСПРАВЛЕНО: добавили teachers в filter_horizontal
    filter_horizontal = ('groups', 'teachers')

@admin.register(TaskImportBatch)
class TaskImportBatchAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'subject', 'course', 'task_type', 'imported_count', 'updated_count', 'created_at')
    list_filter = ('subject', 'course', 'task_type', 'created_at')
    readonly_fields = ('file_name', 'subject', 'course', 'task_type', 'imported_count', 'updated_count', 'created_at', 'created_by')
    date_hierarchy = 'created_at'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False