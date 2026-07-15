require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const empresasRoutes = require('./routes/empresas.routes');
const assinaturasRoutes = require('./routes/assinaturas.routes');
const modulosRoutes = require('./routes/modulos.routes');
const pagamentosRoutes = require('./routes/pagamentos.routes');

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*',
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

app.get('/', (req, res) => res.json({ success: true, message: 'BALU Food API' }));
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/empresas', empresasRoutes);
app.use('/api/assinaturas', assinaturasRoutes);
app.use('/api/modulos', modulosRoutes);
app.use('/api/pagamentos', pagamentosRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada.' });
});

app.listen(port, () => {
  console.log(`BALU Food API rodando na porta ${port}`);
});
