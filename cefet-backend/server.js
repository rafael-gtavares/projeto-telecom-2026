require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const sanitizeMongo = require('./src/middleware/sanitize');

// Falha rápido no boot se segredos essenciais não estiverem configurados,
// em vez de quebrar no primeiro login. Evita subir em produção com placeholder.
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGO_URI'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Variáveis de ambiente obrigatórias ausentes: ${missing.join(', ')}`);
  process.exit(1);
}

const authRoutes = require('./src/routes/auth.routes');
const coursesRoutes = require('./src/routes/courses.routes');
const enrollmentsRoutes = require('./src/routes/enrollments.routes');
const usersRoutes = require('./src/routes/users.routes');
const adminRoutes = require('./src/routes/admin.routes');
const schoolsRoutes = require('./src/routes/schools.routes');

const app = express();

// Em produção a API roda atrás de um proxy reverso (nginx/Render/Heroku).
// Confiar no primeiro proxy garante que o rate-limit use o IP real do cliente
// (X-Forwarded-For) em vez do IP do proxy.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

connectDB();

// Headers de segurança. crossOriginResourcePolicy ajustado para permitir
// que o front (outra origem) carregue as imagens servidas em /uploads.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Normaliza a origem do CORS (remove barra final que invalidaria o match)
const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
app.use(cors({ origin: clientUrl, credentials: true }));

app.use(express.json({ limit: '1mb' })); // limita payload JSON para mitigar abuso
app.use(sanitizeMongo);                  // remove operadores NoSQL ($, .) de body/query/params

// Imagens servidas sem rate limit (antes do limiter global)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limit global para as rotas da API — protege contra flood/brute-force
// em endpoints que não têm limiter próprio. Os limiters de auth são mais estritos.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitas requisições. Tente novamente em alguns minutos.' },
});
app.use(apiLimiter);

app.use('/auth', authRoutes);
app.use('/courses', coursesRoutes);
app.use('/enrollments', enrollmentsRoutes);
app.use('/users', usersRoutes);
app.use('/admin', adminRoutes);
app.use('/schools', schoolsRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', message: 'CEFET API rodando' }));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor CEFET rodando na porta ${PORT}`));
