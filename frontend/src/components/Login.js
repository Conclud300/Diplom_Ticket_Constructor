import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Grid
} from '@mui/material';
import {
  School as SchoolIcon,
  Login as LoginIcon
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
      const response = await axios.post('https://ticket-backend-3zm6.onrender.com/api/tickets/login/', loginData);
      
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
      setError(err.response?.data?.error || 'Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
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
      </Paper>
    </Container>
  );
};

export default Login;