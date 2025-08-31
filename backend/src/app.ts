import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// Routes
import authRoutes from './routes/auth';
import serviceRoutes from './routes/services';
import userRoutes from './routes/users';
import groupRoutes from './routes/groups';
import adminLogRoutes from './routes/adminLogs';
import houseRoutes from './routes/houses';
import inmateRoutes from './routes/inmates';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());

// JWT Middleware für User-Informationen
app.use((req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      req.user = decoded;
    } catch (error) {
      // Token ist ungültig, aber wir lassen die Anfrage durchgehen
      // Die einzelnen Routen können dann entscheiden, ob sie eine Authentifizierung benötigen
    }
  }
  
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Prisoner Services API läuft',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/admin-logs', adminLogRoutes);
app.use('/api/houses', houseRoutes);
app.use('/api/inmates', inmateRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Etwas ist schief gelaufen!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Prisoner Services API läuft auf Port ${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

export default app;
