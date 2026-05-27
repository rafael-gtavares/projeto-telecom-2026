require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

const authRoutes = require('./src/routes/auth.routes');
const coursesRoutes = require('./src/routes/courses.routes');
const enrollmentsRoutes = require('./src/routes/enrollments.routes');
const usersRoutes = require('./src/routes/users.routes');
const adminRoutes = require('./src/routes/admin.routes');
const schoolRoutes = require('./src/routes/school.routes');

const app = express();

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/auth', authRoutes);
app.use('/courses', coursesRoutes);
app.use('/enrollments', enrollmentsRoutes);
app.use('/users', usersRoutes);
app.use('/admin', adminRoutes);
app.use('/schools', schoolRoutes)

app.get('/health', (req, res) => res.json({ status: 'ok', message: 'CEFET API rodando' }));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor CEFET rodando na porta ${PORT}`));
