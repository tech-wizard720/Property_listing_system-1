import express from 'express';
import cors from 'cors';
import propertyRoutes from './routes/propertyRoutes';
import authRoutes from './routes/authRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import recommendationRoutes from './routes/recommendationRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.send('API is working');
});

// Routes
app.use('/auth', authRoutes);
app.use('/properties', propertyRoutes);
app.use('/favorites', favoriteRoutes);
app.use('/recommendations', recommendationRoutes);

export default app; 