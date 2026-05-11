from django import forms
from .models import Subject, Task

class TaskImportForm(forms.Form):
    """Форма для импорта заданий из файла"""
    file = forms.FileField(
        label='Файл с заданиями',
        help_text='Текстовый файл в кодировке UTF-8. Задания разделяются строкой "---"'
    )
    subject = forms.ModelChoiceField(
        queryset=Subject.objects.filter(is_active=True),
        label='Предмет',
        empty_label='---------'
    )
    course = forms.ChoiceField(
        choices=[(1, '1 курс'), (2, '2 курс'), (3, '3 курс'), (4, '4 курс')],
        label='Курс'
    )
    task_type = forms.ChoiceField(
        choices=Task.TASK_TYPES,
        label='Тип заданий'
    )
    delimiter = forms.CharField(
        initial='---',
        label='Разделитель',
        help_text='Строка, разделяющая задания в файле (по умолчанию "---")'
    )
    override_existing = forms.BooleanField(
        required=False,
        initial=False,
        label='Перезаписать существующие',
        help_text='Если отмечено, задания с такими же названиями будут обновлены'
    )