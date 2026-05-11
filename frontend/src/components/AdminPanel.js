import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const AdminPanel = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Панель администратора
        </Typography>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="body1">
            Административная панель находится по адресу:
          </Typography>
          <Typography variant="h6" sx={{ mt: 2, color: 'primary.main' }}>
            <a href="http://localhost:8000/admin" target="_blank" rel="noopener noreferrer">
              http://localhost:8000/admin
            </a>
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Используйте Django админку для управления:
            <ul>
              <li>Преподавателями</li>
              <li>Предметами</li>
              <li>Группами</li>
              <li>Заданиями</li>
              <li>Председателями ПЦК</li>
            </ul>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminPanel;