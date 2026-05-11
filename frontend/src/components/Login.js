import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Grid,
  Link
} from '@mui/material';
import {
  School as SchoolIcon,
  Login as LoginIcon,
  AdminPanelSettings as AdminPanelSettingsIcon
} from '@mui/icons-material';

const Login = ({ setAuth, setUser, setTeacher }) => {
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ВАЖНО: используем POST, а не GET!
      const response = await api.post('/login/', loginData);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      if (response.data.teacher) {
        localStorage.setItem('teacher', JSON.stringify(response.data.teacher));
      }
      
      setAuth(true);
      setUser(response.data.user);
      if (response.data.teacher) {
        setTeacher(response.data.teacher);
      }
      
      navigate('/generator');
      
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка входа. Проверьте логин и пароль.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoginData({ username: 'demo', password: 'demo123' });
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/login/', {
        username: 'demo',
        password: 'demo123'
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      if (response.data.teacher) {
        localStorage.setItem('teacher', JSON.stringify(response.data.teacher));
      }
      
      setAuth(true);
      setUser(response.data.user);
      if (response.data.teacher) {
        setTeacher(response.data.teacher);
      }
      navigate('/generator');
      
    } catch (err) {
      setError('Демо-пользователь не настроен. Используйте учетные данные созданные в Django админке.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <SchoolIcon sx={{ fontSize: 60, color: 'primary.main', mr: 2 }} />
        <Box>
          <Typography variant="h3" fontWeight="bold" color="primary">
            Конструктор экзаменационных билетов
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Институт среднего профессионального образования СПбПУ
          </Typography>
        </Box>
      </Box>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <LoginIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Вход в систему
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleLoginSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Логин"
                value={loginData.username}
                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                required
                margin="normal"
                autoComplete="username"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Пароль"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                required
                margin="normal"
                autoComplete="current-password"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ mt: 2 }}
                startIcon={loading ? null : <LoginIcon />}
              >
                {loading ? 'Вход...' : 'Войти'}
              </Button>
            </Grid>
          </Grid>
        </form>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Для тестирования вы можете:
          </Typography>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleDemoLogin}
            disabled={loading}
            sx={{ mr: 2, mb: 2 }}
          >
            Войти как демо-пользователь
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.open('http://localhost:8000/admin', '_blank')}
            startIcon={<AdminPanelSettingsIcon />}
            sx={{ mb: 2 }}
          >
            Открыть Django админку
          </Button>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            💡 Информация для администраторов:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Как создать пользователя:</strong><br/>
            1. Откройте Django админку: <Link href="http://localhost:8000/admin" target="_blank" rel="noreferrer">http://localhost:8000/admin</Link><br/>
            2. Войдите под суперпользователем<br/>
            3. В разделе "Users" создайте нового пользователя<br/>
            4. В разделе "Teachers" создайте преподавателя и свяжите с пользователем<br/>
            5. Используйте созданные логин/пароль для входа<br/>
            <br/>
            <strong>Команда для суперпользователя:</strong><br/>
            <code>python manage.py createsuperuser</code>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;