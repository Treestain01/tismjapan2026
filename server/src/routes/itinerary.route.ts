import { Router } from 'express';
import { itineraryRepository } from '../repositories/itinerary.repository';
import type { CreateItineraryDayBody, UpdateItineraryDayBody } from '../types';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    res.json(await itineraryRepository.findAll());
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const body = req.body as CreateItineraryDayBody;
    if (body.day == null || typeof body.day !== 'number' || !body.date || !body.city || !body.title) {
      res.status(400).json({ error: 'Missing required fields: day, date, city, title' });
      return;
    }
    const existing = await itineraryRepository.findByDay(body.day);
    if (existing) {
      // Day already exists — append the new location and events to it
      const updated = await itineraryRepository.addLocation(
        body.day,
        body.locationIds ?? [],
        body.events ?? [],
      );
      res.status(200).json(updated);
      return;
    }
    const day = await itineraryRepository.create(body);
    res.status(201).json(day);
  } catch (err) {
    next(err);
  }
});

router.put('/:day', async (req, res, next) => {
  try {
    const day = parseInt(req.params.day, 10);
    if (isNaN(day)) {
      res.status(400).json({ error: 'Day must be a number' });
      return;
    }
    const existing = await itineraryRepository.findByDay(day);
    if (!existing) {
      res.status(404).json({ error: `Day ${day} not found` });
      return;
    }
    const body = req.body as UpdateItineraryDayBody;
    if (!body.date || !body.city || !body.title) {
      res.status(400).json({ error: 'Missing required fields: date, city, title' });
      return;
    }
    const updated = await itineraryRepository.update(day, body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
