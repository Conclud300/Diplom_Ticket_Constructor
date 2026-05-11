import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  Slider,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const TicketGenerator = ({ teacher, user }) => {
  // Состояния для данных из Django
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [chairmen, setChairmen] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [deputyDirectors, setDeputyDirectors] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [tasksStats, setTasksStats] = useState({ oral: 0, practical: 0 });
  const [apiError, setApiError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Добавляем ключ для принудительного обновления
  
  // Параметры генерации
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedChairman, setSelectedChairman] = useState('');
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedDeputyDirector, setSelectedDeputyDirector] = useState('');
  const [numTickets, setNumTickets] = useState(30);
  const [oralPerTicket, setOralPerTicket] = useState(2);
  const [practicalPerTicket, setPracticalPerTicket] = useState(1);
  const [includePractical, setIncludePractical] = useState(true);
  const [semester, setSemester] = useState(5);
  const [advancedMode, setAdvancedMode] = useState(false);
  
  // Результаты
  const [generatedTickets, setGeneratedTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewTicket, setPreviewTicket] = useState(null);

  // Функция загрузки данных
  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadingData(true);
    setApiError('');
    
    try {
      console.log('Загрузка данных из Django API...');
      
      // Загружаем данные из Django API
      const [subjectsRes, groupsRes, chairmenRes, teachersRes, deputiesRes] = await Promise.all([
        axios.get('http://localhost:8000/api/tickets/subjects/'),
        axios.get('http://localhost:8000/api/tickets/groups/'),
        axios.get('http://localhost:8000/api/tickets/chairmen/'),
        axios.get('http://localhost:8000/api/tickets/teachers/'),
        axios.get('http://localhost:8000/api/tickets/deputy-directors/')
      ]);

      setSubjects(subjectsRes.data);
      setGroups(groupsRes.data);
      setChairmen(chairmenRes.data);
      setTeachers(teachersRes.data);
      setDeputyDirectors(deputiesRes.data);
      
      const now = new Date().toLocaleTimeString();
      setLastUpdated(now);
      
      console.log('✅ Данные загружены из Django:', now);
      console.log('- Предметы:', subjectsRes.data.length);
      console.log('- Группы:', groupsRes.data.length);
      console.log('- Председатели:', chairmenRes.data.length);
      console.log('- Преподаватели:', teachersRes.data.length);
      
      // Если есть данные, выбираем первые по умолчанию (только если еще не выбраны)
      if (subjectsRes.data.length > 0 && !selectedSubject) {
        setSelectedSubject(subjectsRes.data[0].id);
      }
      if (groupsRes.data.length > 0 && selectedGroups.length === 0) {
        setSelectedGroups([groupsRes.data[0].id]);
      }
      if (chairmenRes.data.length > 0 && !selectedChairman) {
        setSelectedChairman(chairmenRes.data[0].id);
      }
      // Автоматически выбираем текущего преподавателя
      if (teacher?.id && teachersRes.data.some(t => t.id === teacher.id) && selectedTeachers.length === 0) {
        setSelectedTeachers([teacher.id]);
      } else if (teachersRes.data.length > 0 && selectedTeachers.length === 0) {
        setSelectedTeachers([teachersRes.data[0].id]);
      }
      
    } catch (error) {
      console.error('❌ Ошибка загрузки данных:', error);
      setApiError('Не удалось загрузить данные из Django. Проверьте: 1) Запущен ли Django сервер? 2) Есть ли данные в админке?');
      
      // Тестовые данные для демонстрации
      setSubjects([
        { id: 1, name: 'Разработка программных модулей', code: 'ПМ.01', course: 2, hours: 256 },
        { id: 2, name: 'Мобильные приложения', code: 'МДК.01.03', course: 3, hours: 192 },
      ]);
      setGroups([
        { id: 1, name: '32919/11', course: 3, specialty: '09.02.07 - Информационные системы' },
        { id: 2, name: '42919/1', course: 4, specialty: '09.02.07 - Информационные системы' },
      ]);
      setChairmen([
        { id: 1, full_name: 'Сынкова А.Д.', position: 'Председатель ПЦК', department: 'Информационные системы и программирование' },
      ]);
      setTeachers([
        { id: 1, full_name: 'Девятко Н.С.', department: 'Информационные системы', position: 'Преподаватель' },
        { id: 2, full_name: 'Иванов И.И.', department: 'Программирование', position: 'Старший преподаватель' },
      ]);
      
    } finally {
      setLoadingData(false);
    }
  }, [teacher, selectedSubject, selectedGroups.length, selectedChairman, selectedTeachers.length]);

  // Загрузка данных при монтировании и при изменении refreshKey
  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]); // Добавляем refreshKey в зависимости

  // Загрузка статистики заданий при выборе предмета и курса
  useEffect(() => {
    const fetchTasksStats = async () => {
      if (!selectedSubject || selectedGroups.length === 0) return;
      
      try {
        const course = groups.find(g => selectedGroups.includes(g.id))?.course || 1;
        
        const response = await axios.get(
          `http://localhost:8000/api/tickets/statistics/?subject_id=${selectedSubject}&course=${course}`
        );
        
        console.log('Статистика заданий:', response.data);
        
        setTasksStats({
          oral: response.data.oral || 0,
          practical: response.data.practical || 0
        });
        
      } catch (error) {
        console.error('Ошибка загрузки статистики заданий:', error);
      }
    };
    
    fetchTasksStats();
  }, [selectedSubject, selectedGroups, groups, refreshKey]); // Добавляем refreshKey в зависимости

  // Функция для принудительного обновления всех данных
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1); // Изменяем ключ, что вызывает перезагрузку всех данных
    setSuccess('Данные обновлены');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Валидация параметров
  const validateParameters = () => {
    const errors = [];
    
    if (!selectedSubject) errors.push('Выберите предмет');
    if (selectedGroups.length === 0) errors.push('Выберите хотя бы одну группу');
    if (!selectedChairman) errors.push('Выберите председателя ПЦК');
    if (selectedTeachers.length === 0) errors.push('Выберите хотя бы одного преподавателя');
    if (numTickets < 1 || numTickets > 1000) errors.push('Количество билетов должно быть от 1 до 1000'); // Увеличил до 1000
    if (oralPerTicket < 1) errors.push('Количество устных заданий должно быть не менее 1');
    if (includePractical && practicalPerTicket < 1) errors.push('Количество практических заданий должно быть не менее 1');
    
    // Проверка достаточности заданий
    const requiredOral = numTickets * oralPerTicket;
    const requiredPractical = numTickets * (includePractical ? practicalPerTicket : 0);
    
    if (tasksStats.oral < requiredOral) {
      errors.push(`Недостаточно устных заданий. Нужно: ${requiredOral}, доступно: ${tasksStats.oral}`);
    }
    if (includePractical && tasksStats.practical < requiredPractical) {
      errors.push(`Недостаточно практических заданий. Нужно: ${requiredPractical}, доступно: ${tasksStats.practical}`);
    }
    
    if (errors.length > 0) {
      setError(errors.join('. '));
      return false;
    }
    
    return true;
  };

  // Генерация билетов
  const handleGenerate = async () => {
    if (!validateParameters()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      // Подготавливаем данные для отправки
      const generationData = {
        subject_id: selectedSubject,
        group_ids: selectedGroups,
        chairman_id: selectedChairman,
        teacher_ids: selectedTeachers,
        deputy_director_id: selectedDeputyDirector || null,
        num_tickets: numTickets,
        oral_per_ticket: oralPerTicket,
        practical_per_ticket: includePractical ? practicalPerTicket : 0,
        semester: semester
      };

      console.log('Отправка данных для генерации:', generationData);
      
      // Отправляем запрос на генерацию билетов
      const response = await axios.post(
        'http://localhost:8000/api/tickets/generate/',
        generationData,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Token ${token}` })
          }
        }
      );

      console.log('Ответ от сервера:', response.data);
      
      // Преобразуем данные для отображения
      const formattedTickets = response.data.tickets.map(ticket => ({
        id: ticket.id || ticket.ticket_number,
        ticket_number: ticket.ticket_number,
        subject: ticket.subject,
        groups: ticket.groups,
        chairman: ticket.chairman,
        teacher: ticket.teacher,
        semester: ticket.semester,
        tasks: ticket.tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          task_type: task.task_type,
          order: task.order
        }))
      }));

      setGeneratedTickets(formattedTickets);
      setPreviewTicket(formattedTickets[0]);
      
      // Обновляем статистику после генерации
      if (response.data.available_oral && response.data.available_practical) {
        setTasksStats({
          oral: response.data.available_oral,
          practical: response.data.available_practical
        });
      }
      
      // Обновляем данные из базы
      handleRefresh();
      
      setSuccess(`Успешно сгенерировано ${response.data.tickets_count} билетов!`);
      
    } catch (err) {
      console.error('Ошибка генерации билетов:', err);
      setError(err.response?.data?.error || 'Ошибка при генерации билетов');
    } finally {
      setLoading(false);
    }
  };

  // Генерация PDF
  const handleDownloadPDF = async () => {
    if (generatedTickets.length === 0) {
      setError('Сначала сгенерируйте билеты');
      return;
    }

    try {
      setLoading(true);
      
      // Собираем ID всех сгенерированных билетов
      const ticketIds = generatedTickets.map(ticket => ticket.id);
      
      const response = await axios.post(
        'http://localhost:8000/api/tickets/generate-pdf/',
        { ticket_ids: ticketIds },
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      // Создание ссылки для скачивания HTML файла
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/html' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `экзаменационные_билеты_${new Date().toLocaleDateString('ru-RU')}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSuccess('HTML файл с билетами скачан! Откройте его в браузере и сохраните как PDF через меню печати.');
      
    } catch (error) {
      console.error('Ошибка генерации PDF:', error);
      setError('Ошибка при генерации файла. Используйте кнопку "Печать" для создания билетов.');
      // Fallback на печать
      handlePrint();
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (generatedTickets.length === 0) {
      setError('Сначала сгенерируйте билеты');
      return;
    }

    try {
      // Создаем новое окно для печати
      const printWindow = window.open('', '_blank');
      
      // Создаем HTML по шаблону
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Экзаменационные билеты</title>
          <style>
            @page {
              size: A4;
              margin: 1.5cm;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.5;
              margin: 0;
              padding: 0;
            }
            .page-break {
              page-break-after: always;
            }
            .ticket {
              margin-bottom: 2cm;
            }
            .header {
              text-align: center;
              margin-bottom: 0.5cm;
            }
            .ministry {
              font-size: 11pt;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .university {
              font-size: 11pt;
              margin-bottom: 3px;
            }
            .institute {
              font-size: 11pt;
              margin-bottom: 0.5cm;
            }
            .ticket-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 1cm;
            }
            .ticket-table td {
              border: 1px solid #000;
              padding: 8px;
              vertical-align: top;
            }
            .left-column {
              width: 40%;
            }
            .middle-column {
              width: 40%;
              text-align: center;
            }
            .right-column {
              width: 20%;
            }
            .protocol {
              font-size: 10pt;
              line-height: 1.3;
            }
            .ticket-number {
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .qualification {
              font-size: 11pt;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .groups {
              font-size: 10pt;
              margin-bottom: 5px;
            }
            .semester {
              font-size: 10pt;
            }
            .approval {
              font-size: 10pt;
              text-align: right;
              line-height: 1.3;
            }
            .subject-header {
              font-size: 11pt;
              font-weight: bold;
              text-align: center;
              margin: 0.5cm 0;
              padding: 5px;
              background-color: #f0f0f0;
            }
            .tasks {
              margin: 0.5cm 0;
            }
            .task {
              margin: 10px 0;
              padding-left: 15px;
              text-align: justify;
            }
            .task-number {
              font-weight: bold;
            }
            .task-title {
              font-weight: bold;
              margin-bottom: 5px;
            }
            .task-description {
              font-size: 11pt;
              line-height: 1.4;
            }
            .formulas {
              font-family: 'Courier New', monospace;
              font-size: 10pt;
              margin: 10px 20px;
              padding: 10px;
              background-color: #f9f9f9;
              border-left: 3px solid #ccc;
            }
            .teachers {
              margin-top: 1cm;
              font-size: 11pt;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          ${generatedTickets.map((ticket, idx) => `
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
                      ${ticket.chairman?.full_name || 'Председатель ПЦК'}
                    </div>
                  </td>
                  <td class="middle-column">
                    <div class="ticket-number">Экзаменационный билет № ${ticket.ticket_number}</div>
                    <div class="qualification">Квалификационный экзамен по ${ticket.subject?.name || 'Предмет'}</div>
                    <div class="groups">группы ${ticket.groups?.map(g => g.name).join(', ') || 'Группа'}</div>
                    <div class="semester">Семестр ${ticket.semester}</div>
                  </td>
                  <td class="right-column">
                    <div class="approval">
                      «УТВЕРЖДАЮ»<br>
                      Зам.директора ИСПО<br>
                      по УМР<br>
                      ________________<br>
                      Конакина Е.Г.<br>
                      «__» __________ 2025 г.
                    </div>
                  </td>
                </tr>
              </table>
              
              <div class="subject-header">${ticket.subject?.name || 'Предмет'}</div>
              
              <div class="tasks">
                ${ticket.tasks?.map((task, taskIdx) => `
                  <div class="task">
                    <div class="task-number">${taskIdx + 1}.</div>
                    <div class="task-title">${task.title}</div>
                    <div class="task-description">${task.description || ''}</div>
                    ${task.description && (task.description.includes('формул') || task.description.includes('=')) ? `
                      <div class="formulas">
                        Формулы для справки:<br>
                        Δ = a₁b₂ - a₂b₁<br>
                        Δ₁ = c₁b₂ - c₂b₁<br>
                        Δ₂ = a₁c₂ - a₂c₁<br>
                        x = Δ₁/Δ, y = Δ₂/Δ
                      </div>
                    ` : ''}
                  </div>
                `).join('') || ''}
              </div>
              
              <div class="teachers">
                Преподаватели: ________________ ${ticket.teacher?.full_name || '________________'}
              </div>
            </div>
            ${idx < generatedTickets.length - 1 ? '<div class="page-break"></div>' : ''}
          `).join('')}
        </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Ждем загрузки и открываем печать
      printWindow.onload = function() {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
      
      setSuccess('Открыто окно для печати билетов');
      
    } catch (error) {
      console.error('Ошибка при подготовке печати:', error);
      setError('Ошибка при подготовке печати. Попробуйте скачать HTML файл.');
    }
  };

  const handleClear = () => {
    setSelectedSubject('');
    setSelectedGroups([]);
    setSelectedChairman('');
    setSelectedTeachers([]);
    setSelectedDeputyDirector('');
    setGeneratedTickets([]);
    setPreviewTicket(null);
    setError('');
    setSuccess('');
  };

  // Статистика по заданиям
  const totalOralTasks = tasksStats.oral;
  const totalPracticalTasks = tasksStats.practical;
  const requiredOral = numTickets * oralPerTicket;
  const requiredPractical = numTickets * (includePractical ? practicalPerTicket : 0);
  const hasEnoughOral = totalOralTasks >= requiredOral;
  const hasEnoughPractical = totalPracticalTasks >= requiredPractical;

  // Навигация по билетам
  const handlePrevTicket = () => {
    if (!previewTicket || generatedTickets.length === 0) return;
    const currentIndex = generatedTickets.findIndex(t => t.id === previewTicket.id);
    if (currentIndex > 0) {
      setPreviewTicket(generatedTickets[currentIndex - 1]);
    }
  };

  const handleNextTicket = () => {
    if (!previewTicket || generatedTickets.length === 0) return;
    const currentIndex = generatedTickets.findIndex(t => t.id === previewTicket.id);
    if (currentIndex < generatedTickets.length - 1) {
      setPreviewTicket(generatedTickets[currentIndex + 1]);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          🎫 Конструктор экзаменационных билетов
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loadingData}
            size="small"
          >
            Обновить данные
          </Button>
        </Box>
      </Box>
      
      {lastUpdated && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Последнее обновление: {lastUpdated}
        </Typography>
      )}
      
      {apiError && (
        <Alert severity="warning" sx={{ mb: 2 }} icon={<WarningIcon />}>
          {apiError}
          <br />
          <small>Работаем с тестовыми данными. Проверьте Django сервер: <a href="http://localhost:8000/api/tickets/test/" target="_blank" rel="noreferrer">http://localhost:8000/api/tickets/test/</a></small>
        </Alert>
      )}
      
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      
      {loadingData ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Загрузка данных из Django...</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Левая колонка - Параметры генерации */}
          <Grid item xs={12} md={5}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  Параметры генерации
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              {/* Информация о загруженных данных */}
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f0f7ff', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  📊 Данные из Django админки:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip label={`${subjects.length} предметов`} size="small" color="primary" variant="outlined" />
                  <Chip label={`${groups.length} групп`} size="small" color="secondary" variant="outlined" />
                  <Chip label={`${chairmen.length} председателей`} size="small" color="success" variant="outlined" />
                  <Chip label={`${teachers.length} преподавателей`} size="small" color="warning" variant="outlined" />
                </Box>
              </Box>
              
              {/* Основные параметры */}
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: '#555' }}>
                Основные параметры
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Предмет *</InputLabel>
                <Select
                  value={selectedSubject}
                  label="Предмет *"
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={subjects.length === 0}
                >
                  {subjects.length === 0 ? (
                    <MenuItem value="">Нет данных</MenuItem>
                  ) : (
                    subjects.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        <Box>
                          <Typography variant="body1">{subject.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Код: {subject.code} | Курс: {subject.course} | Часы: {subject.hours}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Зам. директора ИСПО</InputLabel>
                <Select
                  value={selectedDeputyDirector}
                  label="Зам. директора ИСПО"
                  onChange={(e) => setSelectedDeputyDirector(e.target.value)}
                  disabled={deputyDirectors.length === 0}
                >
                  <MenuItem value="">Не выбрано</MenuItem>
                  {deputyDirectors.length === 0 ? (
                    <MenuItem value="">Нет данных</MenuItem>
                  ) : (
                    deputyDirectors.map((deputy) => (
                      <MenuItem key={deputy.id} value={deputy.id}>
                        <Box>
                          <Typography variant="body1">{deputy.full_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {deputy.position} ({deputy.short_name})
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Группы *</InputLabel>
                <Select
                  multiple
                  value={selectedGroups}
                  label="Группы *"
                  onChange={(e) => setSelectedGroups(e.target.value)}
                  disabled={groups.length === 0}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((groupId) => {
                        const group = groups.find(g => g.id === groupId);
                        return group ? (
                          <Chip 
                            key={groupId} 
                            label={group.name} 
                            size="small"
                            onDelete={() => {
                              setSelectedGroups(selectedGroups.filter(id => id !== groupId));
                            }}
                          />
                        ) : null;
                      })}
                    </Box>
                  )}
                >
                  {groups.length === 0 ? (
                    <MenuItem value="">Нет данных</MenuItem>
                  ) : (
                    groups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        <Box>
                          <Typography variant="body1">{group.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {group.specialty} | {group.course} курс
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
                <Typography variant="caption" color="text.secondary">
                  Выбрано: {selectedGroups.length} групп
                </Typography>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Председатель ПЦК *</InputLabel>
                <Select
                  value={selectedChairman}
                  label="Председатель ПЦК *"
                  onChange={(e) => setSelectedChairman(e.target.value)}
                  disabled={chairmen.length === 0}
                >
                  {chairmen.length === 0 ? (
                    <MenuItem value="">Нет данных</MenuItem>
                  ) : (
                    chairmen.map((chairman) => (
                      <MenuItem key={chairman.id} value={chairman.id}>
                        <Box>
                          <Typography variant="body1">{chairman.full_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {chairman.position}, {chairman.department}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Преподаватель(и) *</InputLabel>
                <Select
                  multiple
                  value={selectedTeachers}
                  label="Преподаватель(и) *"
                  onChange={(e) => setSelectedTeachers(e.target.value)}
                  disabled={teachers.length === 0}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((teacherId) => {
                        const teacherObj = teachers.find(t => t.id === teacherId);
                        return teacherObj ? (
                          <Chip 
                            key={teacherId} 
                            label={teacherObj.full_name} 
                            size="small"
                            onDelete={() => {
                              setSelectedTeachers(selectedTeachers.filter(id => id !== teacherId));
                            }}
                          />
                        ) : null;
                      })}
                    </Box>
                  )}
                >
                  {teachers.length === 0 ? (
                    <MenuItem value="">Нет данных</MenuItem>
                  ) : (
                    teachers.map((teacherItem) => (
                      <MenuItem key={teacherItem.id} value={teacherItem.id}>
                        <Box>
                          <Typography variant="body1">{teacherItem.full_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {teacherItem.department} | {teacherItem.position}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
                <Typography variant="caption" color="text.secondary">
                  Выбрано: {selectedTeachers.length} преподавателей
                </Typography>
              </FormControl>
              
              <TextField
                fullWidth
                label="Семестр"
                type="number"
                margin="normal"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                InputProps={{ inputProps: { min: 1, max: 10 } }}
              />
              
              {/* Статистика заданий */}
              {selectedSubject && (
                <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: '#f9f9f9' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    📝 Доступные задания для выбранного предмета:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                    <Box>
                      <Typography variant="body2">
                        <Box component="span" sx={{ 
                          color: hasEnoughOral ? '#2e7d32' : '#d32f2f',
                          fontWeight: 'bold'
                        }}>
                          {hasEnoughOral ? '✅' : '❌'} Устные: {totalOralTasks}
                        </Box>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          Нужно: {requiredOral}
                        </Typography>
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2">
                        <Box component="span" sx={{ 
                          color: hasEnoughPractical ? '#2e7d32' : '#d32f2f',
                          fontWeight: 'bold'
                        }}>
                          {hasEnoughPractical ? '✅' : '❌'} Практические: {totalPracticalTasks}
                        </Box>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          Нужно: {requiredPractical}
                        </Typography>
                      </Typography>
                    </Box>
                  </Box>
                  {(!hasEnoughOral || !hasEnoughPractical) && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                      ⚠️ Добавьте больше заданий в Django админке
                    </Typography>
                  )}
                </Paper>
              )}
              
              {/* Расширенные параметры */}
              <Accordion 
                expanded={advancedMode} 
                onChange={() => setAdvancedMode(!advancedMode)}
                sx={{ mt: 3 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Расширенные параметры
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mt: 2 }}>
                    <Typography gutterBottom>
                      Количество билетов: <strong>{numTickets}</strong>
                    </Typography>
                    <Slider
                      value={numTickets}
                      onChange={(e, newValue) => setNumTickets(newValue)}
                      min={1}
                      max={1000}
                      step={1}
                      marks={[
                        { value: 1, label: '1' },
                        { value: 30, label: '30' },
                        { value: 100, label: '100' },
                        { value: 500, label: '500' },
                        { value: 1000, label: '1000' }
                      ]}
                      valueLabelDisplay="auto"
                    />
                    
                    <Box sx={{ mt: 3 }}>
                      <Typography gutterBottom>
                        Устных заданий в билете: <strong>{oralPerTicket}</strong>
                      </Typography>
                      <Slider
                        value={oralPerTicket}
                        onChange={(e, newValue) => setOralPerTicket(newValue)}
                        min={1}
                        max={5}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                      />
                    </Box>
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={includePractical}
                          onChange={(e) => setIncludePractical(e.target.checked)}
                        />
                      }
                      label="Включить практические задания"
                      sx={{ mt: 2, display: 'block' }}
                    />
                    
                    {includePractical && (
                      <Box sx={{ mt: 2 }}>
                        <Typography gutterBottom>
                          Практических заданий: <strong>{practicalPerTicket}</strong>
                        </Typography>
                        <Slider
                          value={practicalPerTicket}
                          onChange={(e, newValue) => setPracticalPerTicket(newValue)}
                          min={1}
                          max={4}
                          step={1}
                          marks
                          valueLabelDisplay="auto"
                        />
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
              
              {/* Кнопки управления */}
              <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleGenerate}
                  disabled={loading || subjects.length === 0}
                  startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                  sx={{ flexGrow: 1 }}
                >
                  {loading ? 'Генерация...' : 'Сгенерировать билеты'}
                </Button>
                
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleClear}
                  disabled={loading}
                >
                  Очистить
                </Button>
              </Box>
              
              {/* Информация о выбранных параметрах */}
              {selectedSubject && (
                <Paper variant="outlined" sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    📋 Выбранные параметры:
                  </Typography>
                  <Typography variant="body2">
                    • Предмет: {subjects.find(s => s.id === selectedSubject)?.name}
                    <br />
                    • Группы: {selectedGroups.length} шт.
                    <br />
                    • Преподаватели: {selectedTeachers.length} шт.
                    <br />
                    • Билетов: {numTickets}
                    <br />
                    • Заданий в билете: {oralPerTicket} устных {includePractical ? `+ ${practicalPerTicket} практических` : ''}
                    <br />
                    • Всего заданий: {numTickets * (oralPerTicket + (includePractical ? practicalPerTicket : 0))}
                  </Typography>
                </Paper>
              )}
            </Paper>
          </Grid>

          {/* Правая колонка - Предпросмотр и результаты */}
          <Grid item xs={12} md={7}>
            {generatedTickets.length > 0 ? (
              <>
                {/* Статистика */}
                <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: '#e3f2fd' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary">
                          {generatedTickets.length}
                        </Typography>
                        <Typography variant="caption">Билетов</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="secondary">
                          {oralPerTicket}
                        </Typography>
                        <Typography variant="caption">Устных заданий</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main">
                          {includePractical ? practicalPerTicket : 0}
                        </Typography>
                        <Typography variant="caption">Практических</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="warning.main">
                          {oralPerTicket + (includePractical ? practicalPerTicket : 0)}
                        </Typography>
                        <Typography variant="caption">Всего заданий</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
                
                {/* Кнопки экспорта */}
                <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadPDF}
                    disabled={loading}
                  >
                    Скачать PDF
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                  >
                    Печать
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', alignSelf: 'center' }}>
                    📁 Данные из Django: {subjects.length} предметов, {groups.length} групп, {teachers.length} преподавателей
                  </Typography>
                </Box>
                
                {/* Предпросмотр билета */}
                {previewTicket && (
                  <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        📄 Предпросмотр билета №{previewTicket.ticket_number}
                      </Typography>
                      <Box>
                        <Tooltip title="Предыдущий билет">
                          <IconButton 
                            size="small" 
                            onClick={handlePrevTicket}
                            disabled={generatedTickets.findIndex(t => t.id === previewTicket.id) === 0}
                          >
                            <ArrowBackIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Следующий билет">
                          <IconButton 
                            size="small"
                            onClick={handleNextTicket}
                            disabled={generatedTickets.findIndex(t => t.id === previewTicket.id) === generatedTickets.length - 1}
                          >
                            <ArrowForwardIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary">
                          {previewTicket.subject?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Группы: {previewTicket.groups?.map(g => g.name).join(', ')} | 
                          Семестр: {previewTicket.semester} | 
                          Председатель: {previewTicket.chairman?.full_name}
                        </Typography>
                        
                        {previewTicket.teacher && (
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Преподаватель: {previewTicket.teacher.full_name} ({previewTicket.teacher.position})
                          </Typography>
                        )}
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <List>
                          {previewTicket.tasks?.map((task, index) => (
                            <ListItem key={task.id || index} sx={{ alignItems: 'flex-start' }}>
                              <Box sx={{ 
                                bgcolor: task.task_type === 'oral' ? '#e8f5e9' : '#e3f2fd', 
                                p: 1, 
                                borderRadius: 1,
                                mr: 2,
                                minWidth: 100,
                                textAlign: 'center'
                              }}>
                                <Typography variant="caption" sx={{ 
                                  fontWeight: 'bold',
                                  color: task.task_type === 'oral' ? '#2e7d32' : '#1565c0'
                                }}>
                                  {task.task_type === 'oral' ? 'УСТНОЕ' : 'ПРАКТИЧЕСКОЕ'}
                                </Typography>
                              </Box>
                              <ListItemText
                                primary={
                                  <Typography variant="body1">
                                    <strong>{task.order || index + 1}. {task.title}</strong>
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="body2" color="text.secondary">
                                    {task.description}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Paper>
                )}
                
                {/* Список всех билетов */}
                <Paper elevation={3} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    📋 Список всех билетов (показано {Math.min(generatedTickets.length, 12)} из {generatedTickets.length})
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {generatedTickets.slice(0, 12).map((ticket) => (
                      <Grid item xs={6} sm={4} md={3} key={ticket.id}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            cursor: 'pointer',
                            borderColor: previewTicket?.id === ticket.id ? 'primary.main' : '',
                            bgcolor: previewTicket?.id === ticket.id ? '#f0f7ff' : '',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: '#f5f5f5'
                            }
                          }}
                          onClick={() => setPreviewTicket(ticket)}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="subtitle2" align="center" gutterBottom>
                              Билет №{ticket.ticket_number}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Chip 
                                label={`${ticket.tasks?.filter(t => t.task_type === 'oral').length || 0} уст.`} 
                                size="small" 
                                color="success"
                                variant="outlined"
                              />
                              {includePractical && (
                                <Chip 
                                  label={`${ticket.tasks?.filter(t => t.task_type === 'practical').length || 0} пр.`} 
                                  size="small" 
                                  color="primary"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                  
                  {generatedTickets.length > 12 && (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                      ... и еще {generatedTickets.length - 12} билетов
                    </Typography>
                  )}
                </Paper>
              </>
            ) : (
              /* Пустое состояние */
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 6, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
              >
                <Box sx={{ fontSize: 60, color: '#1976d2', mb: 2 }}>
                  🎓
                </Box>
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  Здесь появятся экзаменационные билеты
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Заполните параметры слева и нажмите "Сгенерировать билеты"
                </Typography>
                
                <Box sx={{ mt: 3, p: 2, bgcolor: '#f0f7ff', borderRadius: 2, maxWidth: 400 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    💡 Подсказка:
                  </Typography>
                  <Typography variant="body2">
                    1. Добавьте данные в Django админке<br />
                    2. Выберите предмет, группы и преподавателей<br />
                    3. Настройте количество билетов<br />
                    4. Нажмите "Сгенерировать билеты"
                  </Typography>
                </Box>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Готово к работе: {subjects.length} предметов, {groups.length} групп, {teachers.length} преподавателей
                  </Typography>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default TicketGenerator;