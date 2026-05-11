import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import TicketGenerator from './components/TicketGenerator';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Chip
} from '@mui/material';
import {
  School as SchoolIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminPanelSettingsIcon
} from '@mui/icons-material';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const teacherData = localStorage.getItem('teacher');
    
    if (token && userData) {
      try {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
        if (teacherData) {
          setTeacher(JSON.parse(teacherData));
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        localStorage.clear();
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setUser(null);
    setTeacher(null);
    setAnchorEl(null);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Безопасное получение данных
  const getUserName = () => {
    if (teacher?.full_name) return teacher.full_name;
    if (user?.first_name && user?.last_name) return `${user.first_name} ${user.last_name}`;
    if (user?.username) return user.username;
    return 'Пользователь';
  };

  const getInitials = () => {
    const name = getUserName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <Router>
      <AppBar position="static" sx={{ bgcolor: '#1a237e' }}>
        <Toolbar>
          <SchoolIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Конструктор экзаменационных билетов ИСПО
          </Typography>
          
          {isAuthenticated ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {teacher?.department && (
                  <Chip 
                    label={teacher.department} 
                    size="small" 
                    color="secondary"
                    variant="outlined"
                  />
                )}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      mr: 1, 
                      bgcolor: teacher ? 'secondary.main' : 'primary.main'
                    }}
                  >
                    {getInitials()}
                  </Avatar>
                  <Typography variant="body2" sx={{ mr: 2 }}>
                    {getUserName()}
                  </Typography>
                </Box>
                {user?.is_staff && (
                  <Button
                    color="inherit"
                    startIcon={<AdminPanelSettingsIcon />}
                    onClick={() => window.open('http://localhost:8000/admin', '_blank')}
                    size="small"
                  >
                    Админка
                  </Button>
                )}
                <IconButton
                  color="inherit"
                  onClick={handleMenu}
                  aria-label="меню пользователя"
                >
                  <AccountCircleIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={handleLogout}>
                    <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
                    Выйти
                  </MenuItem>
                </Menu>
              </Box>
            </>
          ) : (
            <Button color="inherit" href="/login">
              Войти
            </Button>
          )}
        </Toolbar>
      </AppBar>
      
      <Container>
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
              <Navigate to="/generator" /> : 
              <Navigate to="/login" />
            } 
          />
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
              <Navigate to="/generator" /> : 
              <Login setAuth={setIsAuthenticated} setUser={setUser} setTeacher={setTeacher} />
            } 
          />
          <Route 
            path="/generator" 
            element={
              isAuthenticated ? 
              <TicketGenerator teacher={teacher} user={user} /> : 
              <Navigate to="/login" />
            } 
          />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;