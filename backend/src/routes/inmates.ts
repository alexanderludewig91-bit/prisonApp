import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { checkGroup, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Verhaltensdokumentation für einen Insassen abrufen
router.get('/:id/behavior', checkGroup(['PS Prison Administration', 'PS General Enforcement Service', 'PS Vollzugsabteilungsleitung', 'PS Vollzugsleitung', 'PS Anstaltsleitung', 'PS Payments Office', 'PS Medical Staff', 'PS Designers']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const behaviorEntries = await prisma.inmateBehavior.findMany({
      where: {
        inmateId: Number(id)
      },
      orderBy: {
        recordedAt: 'desc'
      }
    });

    res.json({ behaviorEntries });

  } catch (error: any) {
    console.error('Get behavior entries error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Verhaltensdokumentation' });
  }
});

// Neue Verhaltensdokumentation erstellen
router.post('/:id/behavior', checkGroup(['PS Prison Administration', 'PS General Enforcement Service', 'PS Vollzugsabteilungsleitung', 'PS Vollzugsleitung', 'PS Anstaltsleitung', 'PS Payments Office', 'PS Medical Staff', 'PS Designers']), [
  body('recordedAt').isISO8601().withMessage('Datum/Uhrzeit ist erforderlich'),
  body('details').notEmpty().withMessage('Beschreibung ist erforderlich')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { recordedAt, details } = req.body;
    const recordedBy = req.user?.username || 'Unknown';

    const behaviorEntry = await prisma.inmateBehavior.create({
      data: {
        inmateId: Number(id),
        recordedAt: new Date(recordedAt),
        details,
        recordedBy
      }
    });

    res.status(201).json({ behaviorEntry });

  } catch (error: any) {
    console.error('Create behavior entry error:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Verhaltensdokumentation' });
  }
});

export default router;
