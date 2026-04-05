import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import locationsRouter from './routes/locations.route';
import itineraryRouter from './routes/itinerary.route';
import galleryRouter from './routes/gallery.route';
import budgetRouter from './routes/budget.route';
import tripRouter from './routes/trip.route';
import extractRouter from './routes/extract.route';
import currencyRouter from './routes/currency.route';

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
app.use('/api/extract-location', extractRouter);
app.use('/api/currency', currencyRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler — catches all next(err) calls from async route handlers
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
