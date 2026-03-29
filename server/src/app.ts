import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import locationsRouter from './routes/locations.route';
import itineraryRouter from './routes/itinerary.route';
import galleryRouter from './routes/gallery.route';
import budgetRouter from './routes/budget.route';
import tripRouter from './routes/trip.route';

const app = express();
const corsOrigin = process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'];

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json());

app.use('/api/locations', locationsRouter);
app.use('/api/itinerary', itineraryRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/budget', budgetRouter);
app.use('/api/trip', tripRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
