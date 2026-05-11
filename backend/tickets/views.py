from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import JsonResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
import random
import tempfile
import os
import re
from datetime import datetime
from .models import *
from .serializers import *

# ============ АВТЕНТИФИКАЦИЯ ============

class LoginView(APIView):
    """Вход в систему"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({'error': 'Необходимо указать логин и пароль'}, status=400)
        
        user = authenticate(username=username, password=password)
        
        if user is not None:
            token, created = Token.objects.get_or_create(user=user)
            
            teacher_data = None
            try:
                teacher = Teacher.objects.get(user=user)
                teacher_data = TeacherSerializer(teacher).data
            except Teacher.DoesNotExist:
                pass
            
            return Response({
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                },
                'teacher': teacher_data,
                'message': 'Вход выполнен успешно'
            })
        else:
            return Response({'error': 'Неверный логин или пароль'}, status=400)

class LogoutView(APIView):
    """Выход из системы"""
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            request.user.auth_token.delete()
        except:
            pass
        
        logout(request)
        return Response({'message': 'Выход выполнен успешно'})

# ============ ПРОСТЫЕ API ДЛЯ REACT ============

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def api_subjects(request):
    """Список предметов"""
    try:
        subjects = Subject.objects.filter(is_active=True)
        serializer = SubjectSerializer(subjects, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def api_groups(request):
    """Список групп"""
    try:
        groups = StudentGroup.objects.filter(is_active=True)
        serializer = StudentGroupSerializer(groups, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def api_chairmen(request):
    """Список председателей ПЦК"""
    try:
        chairmen = PZKChairman.objects.filter(is_active=True)
        serializer = PZKChairmanSerializer(chairmen, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def api_deputy_directors(request):
    """Список заместителей директора"""
    try:
        deputies = DeputyDirector.objects.filter(is_active=True)
        serializer = DeputyDirectorSerializer(deputies, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def api_teachers(request):
    """Список преподавателей"""
    try:
        teachers = Teacher.objects.filter(is_active=True)
        serializer = TeacherSerializer(teachers, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def api_tasks(request):
    """Список заданий с фильтрацией по предмету"""
    try:
        subject_id = request.GET.get('subject_id')
        
        tasks = Task.objects.all()
        
        if subject_id:
            tasks = tasks.filter(subject_id=subject_id)
            
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@csrf_exempt
def test_api(request):
    """Тестовый endpoint"""
    return JsonResponse({
        'message': 'Django API работает!',
        'status': 'OK',
        'endpoints': [
            '/api/tickets/subjects/',
            '/api/tickets/groups/',
            '/api/tickets/chairmen/',
            '/api/tickets/deputy-directors/',
            '/api/tickets/teachers/',
            '/api/tickets/tasks/',
            '/api/tickets/statistics/'
        ]
    })

# ============ СТАТИСТИКА ЗАДАНИЙ (ИСПРАВЛЕННАЯ) ============

class TaskStatisticsView(APIView):
    """Статистика по заданиям для выбранного предмета (без учета курса заданий)"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Получить статистику по заданиям для предмета"""
        try:
            subject_id = request.GET.get('subject_id')
            
            print(f"ЗАПРОС СТАТИСТИКИ: subject_id={subject_id}")
            
            if not subject_id:
                return Response({
                    'oral': 0,
                    'practical': 0,
                    'error': 'Укажите subject_id'
                })
            
            try:
                subject_id = int(subject_id)
            except ValueError:
                return Response({
                    'oral': 0,
                    'practical': 0,
                    'error': 'subject_id должен быть числом'
                })
            
            # Получаем все задания для этого предмета (без фильтра по курсу!)
            oral_count = Task.objects.filter(
                subject_id=subject_id,
                task_type='oral'
            ).count()
            
            practical_count = Task.objects.filter(
                subject_id=subject_id,
                task_type='practical'
            ).count()
            
            print(f"Найдено: устных={oral_count}, практических={practical_count}")
            
            return Response({
                'oral': oral_count,
                'practical': practical_count,
                'subject_id': subject_id
            })
                
        except Exception as e:
            print(f"Ошибка в статистике: {e}")
            return Response({
                'oral': 0,
                'practical': 0,
                'error': str(e)
            })

# ============ ГЕНЕРАЦИЯ БИЛЕТОВ ============

class TicketGenerationView(APIView):
    """Генерация экзаменационных билетов"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """Генерация билетов"""
        try:
            data = request.data
            
            # Проверяем обязательные поля
            required_fields = ['subject_id', 'group_ids', 'chairman_id', 'teacher_ids', 'num_tickets']
            for field in required_fields:
                if field not in data:
                    return Response(
                        {'error': f'Отсутствует обязательное поле: {field}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            subject_id = data['subject_id']
            group_ids = data['group_ids']
            chairman_id = data['chairman_id']
            teacher_ids = data['teacher_ids']
            deputy_director_id = data.get('deputy_director_id')
            num_tickets = data['num_tickets']
            oral_per_ticket = data.get('oral_per_ticket', 2)
            practical_per_ticket = data.get('practical_per_ticket', 1)
            semester = data.get('semester', 5)
            
            # Получаем объекты из базы данных
            try:
                subject = Subject.objects.get(id=subject_id, is_active=True)
                groups = StudentGroup.objects.filter(id__in=group_ids, is_active=True)
                chairman = PZKChairman.objects.get(id=chairman_id, is_active=True)
                teachers = Teacher.objects.filter(id__in=teacher_ids, is_active=True)
                deputy_director = None
                if deputy_director_id:
                    deputy_director = DeputyDirector.objects.get(id=deputy_director_id, is_active=True)
            except Subject.DoesNotExist:
                return Response({'error': 'Предмет не найден'}, status=404)
            except StudentGroup.DoesNotExist:
                return Response({'error': 'Группы не найдены'}, status=404)
            except PZKChairman.DoesNotExist:
                return Response({'error': 'Председатель ПЦК не найден'}, status=404)
            except Teacher.DoesNotExist:
                return Response({'error': 'Преподаватели не найдены'}, status=404)
            except DeputyDirector.DoesNotExist:
                return Response({'error': 'Заместитель директора не найден'}, status=404)
            
            # Получаем ВСЕ задания для данного предмета (без фильтра по курсу!)
            oral_tasks = list(Task.objects.filter(
                subject=subject,
                task_type='oral'
            ))
            
            practical_tasks = list(Task.objects.filter(
                subject=subject,
                task_type='practical'
            ))
            
            print(f"Найдено заданий: устных={len(oral_tasks)}, практических={len(practical_tasks)}")
            
            # Проверяем, что заданий достаточно
            required_oral = num_tickets * oral_per_ticket
            required_practical = num_tickets * practical_per_ticket
            
            if len(oral_tasks) < required_oral:
                return Response(
                    {'error': f'Недостаточно устных заданий. Нужно: {required_oral}, есть: {len(oral_tasks)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if len(practical_tasks) < required_practical:
                return Response(
                    {'error': f'Недостаточно практических заданий. Нужно: {required_practical}, есть: {len(practical_tasks)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Перемешиваем задания для случайного выбора
            random.shuffle(oral_tasks)
            random.shuffle(practical_tasks)
            
            # Удаляем старые билеты для этой комбинации (если есть)
            GeneratedTicket.objects.filter(
                subject=subject,
                chairman=chairman,
                semester=semester
            ).delete()
            
            # Генерируем билеты
            tickets = []
            oral_idx = 0
            practical_idx = 0
            
            for i in range(1, num_tickets + 1):
                ticket = GeneratedTicket.objects.create(
                    ticket_number=i,
                    subject=subject,
                    chairman=chairman,
                    deputy_director=deputy_director,
                    semester=semester,
                    generation_date=datetime.now()
                )
                
                ticket.groups.set(groups)
                
                if teachers.exists():
                    ticket.teacher = teachers.first()
                    ticket.save()
                
                for j in range(oral_per_ticket):
                    if oral_idx < len(oral_tasks):
                        task = oral_tasks[oral_idx]
                        TicketTask.objects.create(
                            ticket=ticket,
                            task=task,
                            order=j + 1
                        )
                        oral_idx += 1
                
                for k in range(practical_per_ticket):
                    if practical_idx < len(practical_tasks):
                        task = practical_tasks[practical_idx]
                        TicketTask.objects.create(
                            ticket=ticket,
                            task=task,
                            order=oral_per_ticket + k + 1
                        )
                        practical_idx += 1
                
                ticket_data = {
                    'id': ticket.id,
                    'ticket_number': ticket.ticket_number,
                    'subject': SubjectSerializer(subject).data,
                    'groups': StudentGroupSerializer(groups, many=True).data,
                    'chairman': PZKChairmanSerializer(chairman).data,
                    'deputy_director': DeputyDirectorSerializer(deputy_director).data if deputy_director else None,
                    'teacher': TeacherSerializer(ticket.teacher).data if ticket.teacher else None,
                    'semester': semester,
                    'tasks': []
                }
                
                ticket_tasks = TicketTask.objects.filter(ticket=ticket).order_by('order')
                for ticket_task in ticket_tasks:
                    task_data = TaskSerializer(ticket_task.task).data
                    task_data['order'] = ticket_task.order
                    ticket_data['tasks'].append(task_data)
                
                tickets.append(ticket_data)
            
            return Response({
                'message': f'Успешно сгенерировано {num_tickets} билетов',
                'tickets_count': num_tickets,
                'total_oral_used': oral_idx,
                'total_practical_used': practical_idx,
                'available_oral': len(oral_tasks),
                'available_practical': len(practical_tasks),
                'tickets': tickets[:10],
                'all_tickets_count': len(tickets)
            })
            
        except Exception as e:
            print(f"Ошибка генерации: {e}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=500)

# ============ ПРЕДПРОСМОТР БИЛЕТОВ ============

class TicketPreviewView(APIView):
    """Предпросмотр сгенерированных билетов"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Получить список сгенерированных билетов"""
        try:
            subject_id = request.GET.get('subject_id')
            chairman_id = request.GET.get('chairman_id')
            semester = request.GET.get('semester', 5)
            
            tickets = GeneratedTicket.objects.all()
            
            if subject_id:
                tickets = tickets.filter(subject_id=subject_id)
            if chairman_id:
                tickets = tickets.filter(chairman_id=chairman_id)
            if semester:
                tickets = tickets.filter(semester=semester)
            
            ticket_data = []
            for ticket in tickets.order_by('ticket_number'):
                ticket_info = {
                    'id': ticket.id,
                    'ticket_number': ticket.ticket_number,
                    'subject': SubjectSerializer(ticket.subject).data,
                    'groups': StudentGroupSerializer(ticket.groups.all(), many=True).data,
                    'chairman': PZKChairmanSerializer(ticket.chairman).data,
                    'deputy_director': DeputyDirectorSerializer(ticket.deputy_director).data if ticket.deputy_director else None,
                    'teacher': TeacherSerializer(ticket.teacher).data if ticket.teacher else None,
                    'semester': ticket.semester,
                    'generation_date': ticket.generation_date,
                    'tasks': []
                }
                
                ticket_tasks = TicketTask.objects.filter(ticket=ticket).order_by('order')
                for ticket_task in ticket_tasks:
                    task_data = TaskSerializer(ticket_task.task).data
                    task_data['order'] = ticket_task.order
                    ticket_info['tasks'].append(task_data)
                
                ticket_data.append(ticket_info)
            
            return Response({
                'tickets': ticket_data,
                'total': len(ticket_data)
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)

# ============ ГЕНЕРАЦИЯ PDF ============

class PDFGenerationView(APIView):
    """Генерация PDF с билетами"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """Генерация HTML файла с билетами"""
        try:
            data = request.data
            ticket_ids = data.get('ticket_ids', [])
            
            if not ticket_ids:
                return Response({'error': 'Не указаны ID билетов'}, status=400)
            
            tickets = GeneratedTicket.objects.filter(id__in=ticket_ids).order_by('ticket_number')
            
            if not tickets.exists():
                return Response({'error': 'Билеты не найдены'}, status=404)
            
            html_content = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Экзаменационные билеты</title>
                <style>
                    @page { size: A4; margin: 1.5cm; }
                    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; }
                    .page-break { page-break-after: always; }
                    .ticket { margin-bottom: 2cm; }
                    .header { text-align: center; margin-bottom: 0.5cm; }
                    .ministry { font-size: 11pt; font-weight: bold; margin-bottom: 5px; }
                    .university { font-size: 11pt; margin-bottom: 3px; }
                    .institute { font-size: 11pt; margin-bottom: 0.5cm; }
                    .ticket-table { width: 100%; border-collapse: collapse; margin-bottom: 1cm; }
                    .ticket-table td { border: 1px solid #000; padding: 8px; vertical-align: top; }
                    .left-column { width: 40%; }
                    .middle-column { width: 40%; text-align: center; }
                    .right-column { width: 20%; }
                    .protocol { font-size: 10pt; line-height: 1.3; }
                    .ticket-number { font-size: 14pt; font-weight: bold; margin-bottom: 5px; }
                    .qualification { font-size: 11pt; font-weight: bold; margin-bottom: 10px; }
                    .groups { font-size: 10pt; margin-bottom: 5px; }
                    .semester { font-size: 10pt; }
                    .approval { font-size: 10pt; text-align: right; line-height: 1.3; }
                    .subject-header { font-size: 11pt; font-weight: bold; text-align: center; margin: 0.5cm 0; padding: 5px; background-color: #f0f0f0; }
                    .tasks { margin: 0.5cm 0; }
                    .task { margin: 10px 0; padding-left: 15px; text-align: justify; }
                    .task-number { font-weight: bold; }
                    .task-title { font-weight: bold; margin-bottom: 5px; }
                    .task-description { font-size: 11pt; line-height: 1.4; }
                    .teachers { margin-top: 1cm; font-size: 11pt; border-top: 1px solid #000; padding-top: 10px; }
                    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                </style>
            </head>
            <body>
            """
            
            for idx, ticket in enumerate(tickets):
                ticket_tasks = TicketTask.objects.filter(ticket=ticket).order_by('order')
                
                html_content += f"""
                <div class="ticket">
                    <div class="header">
                        <div class="ministry">МИНИСТЕРСТВО НАУКИ И ВЫСШЕГО ОБРАЗОВАНИЯ РОССИЙСКОЙ ФЕДЕРАЦИИ</div>
                        <div class="university">федеральное государственное автономное образовательное учреждение</div>
                        <div class="university">высшего образования</div>
                        <div class="university">«Санкт-Петербургский политехнический университет Петра Великого»</div>
                        <div class="institute">(ФГАОУ ВО «СПбПУ»)<br>Институт среднего профессионального образования</div>
                    </div>
                    
                    <table class="ticket-table">
                        <tr>
                            <td class="left-column">
                                <div class="protocol">
                                    Рассмотрено предметно-цикловой комиссией<br>
                                    «Информационные системы и программирование»<br>
                                    протокол № ___<br>
                                    «__» __________ 2025 г.<br><br>
                                    Председатель ________________<br>
                                    {ticket.chairman.full_name if ticket.chairman else 'Председатель ПЦК'}
                                </div>
                            </td>
                            <td class="middle-column">
                                <div class="ticket-number">Экзаменационный билет № {ticket.ticket_number}</div>
                                <div class="qualification">Квалификационный экзамен по {ticket.subject.name}</div>
                                <div class="groups">группы {', '.join([g.name for g in ticket.groups.all()])}</div>
                                <div class="semester">Семестр {ticket.semester}</div>
                            </td>
                            <td class="right-column">
                                <div class="approval">
                                    «УТВЕРЖДАЮ»<br>
                                    Зам.директора ИСПО<br>
                                    по УМР<br>
                                    ________________<br>
                                    {ticket.deputy_director.full_name if ticket.deputy_director else 'Конакина Е.Г.'}<br>
                                    «__» __________ 2025 г.
                                </div>
                            </td>
                        </tr>
                    </table>
                    
                    <div class="subject-header">{ticket.subject.name}</div>
                    
                    <div class="tasks">
                """
                
                for task_rel in ticket_tasks:
                    task = task_rel.task
                    html_content += f"""
                        <div class="task">
                            <div class="task-number">{task_rel.order}.</div>
                            <div class="task-title">{task.title}</div>
                            <div class="task-description">{task.description or ''}</div>
                        </div>
                    """
                
                html_content += f"""
                    </div>
                    
                    <div class="teachers">
                        Преподаватели: ________________ {ticket.teacher.full_name if ticket.teacher else '________________'}
                    </div>
                </div>
                """
                
                if idx < len(tickets) - 1:
                    html_content += '<div class="page-break"></div>'
            
            html_content += "</body></html>"
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as tmp:
                tmp.write(html_content)
                html_path = tmp.name
            
            response = FileResponse(
                open(html_path, 'rb'),
                content_type='text/html',
                as_attachment=True,
                filename=f'ekzamenatsionnye_bilety_{datetime.now().strftime("%Y%m%d_%H%M%S")}.html'
            )
            
            def cleanup():
                try:
                    os.unlink(html_path)
                except:
                    pass
            
            import atexit
            atexit.register(cleanup)
            
            return response
            
        except Exception as e:
            print(f"Ошибка генерации HTML: {e}")
            return Response({'error': str(e)}, status=500)

# ============ ИМПОРТ ЗАДАНИЙ ============

class TaskImportView(APIView):
    """Импорт заданий из текстового файла"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            file = request.FILES.get('file')
            subject_id = request.data.get('subject_id')
            course = request.data.get('course')
            task_type = request.data.get('task_type')
            delimiter = request.data.get('delimiter', '---')
            
            if not file or not subject_id or not course or not task_type:
                return Response(
                    {'error': 'Необходимо указать файл, предмет, курс и тип заданий'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                subject = Subject.objects.get(id=subject_id)
            except Subject.DoesNotExist:
                return Response({'error': 'Предмет не найден'}, status=404)
            
            try:
                content = file.read().decode('utf-8')
            except UnicodeDecodeError:
                try:
                    file.seek(0)
                    content = file.read().decode('windows-1251')
                except:
                    return Response({'error': 'Не удалось прочитать файл. Используйте кодировку UTF-8'}, status=400)
            
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
                        task_type=task_type
                    ).first()
                    
                    if existing:
                        existing.description = description
                        existing.save()
                        updated += 1
                    else:
                        Task.objects.create(
                            title=title,
                            description=description,
                            task_type=task_type,
                            subject=subject,
                            course=course,
                            difficulty=1
                        )
                        imported += 1
                        
                except Exception as e:
                    errors.append(f'Задание {i}: ошибка - {str(e)}')
            
            TaskImportBatch.objects.create(
                file_name=file.name,
                subject=subject,
                course=int(course),
                task_type=task_type,
                imported_count=imported,
                updated_count=updated,
                created_by=request.user
            )
            
            return Response({
                'message': f'Успешно импортировано: создано {imported}, обновлено {updated}',
                'imported': imported,
                'updated': updated,
                'errors': errors,
                'total_found': len(raw_tasks)
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)