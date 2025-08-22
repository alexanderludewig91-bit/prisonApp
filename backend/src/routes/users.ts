import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';

const router = express.Router();
const prisma = new PrismaClient();

// Alle Benutzer abrufen
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { isActive: true };
    
    if (search) {
      where.OR = [
        { username: { contains: String(search) } },
        { email: { contains: String(search) } },
        { firstName: { contains: String(search) } },
        { lastName: { contains: String(search) } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        groups: {
          include: {
            group: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Benutzer' });
  }
});

// Benutzer nach ID abrufen
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        groups: {
          include: {
            group: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    res.json(user);

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Benutzers' });
  }
});

// Benutzer aktualisieren
router.put('/:id', [
  body('firstName').optional(),
  body('lastName').optional(),
  body('email').optional().isEmail().withMessage('Gültige E-Mail-Adresse erforderlich'),
  body('isActive').optional().isBoolean().withMessage('isActive muss ein Boolean sein')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { firstName, lastName, email, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        firstName,
        lastName,
        email,
        isActive
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(user);

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Benutzers' });
  }
});

// Alle Gruppen abrufen
router.get('/groups/all', async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    res.json(groups);

  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Gruppen' });
  }
});

// Benutzer zu Gruppe hinzufügen
router.post('/:id/groups', [
  body('groupId').isInt().withMessage('Gruppen-ID ist erforderlich'),
  body('role').optional().isIn(['ADMIN', 'MEMBER', 'VIEWER']).withMessage('Ungültige Rolle')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { groupId, role = 'MEMBER' } = req.body;

    // Prüfen ob Benutzer existiert
    const user = await prisma.user.findUnique({
      where: { id: Number(id) }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Prüfen ob Gruppe existiert
    const group = await prisma.group.findUnique({
      where: { id: Number(groupId) }
    });

    if (!group) {
      return res.status(404).json({ error: 'Gruppe nicht gefunden' });
    }

    // Benutzer zur Gruppe hinzufügen
    const userGroup = await prisma.userGroup.create({
      data: {
        userId: Number(id),
        groupId: Number(groupId),
        role
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        group: true
      }
    });

    res.status(201).json(userGroup);

  } catch (error: any) {
    console.error('Add user to group error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Benutzer ist bereits in dieser Gruppe' });
    }
    res.status(500).json({ error: 'Fehler beim Hinzufügen zur Gruppe' });
  }
});

// Benutzer aus Gruppe entfernen
router.delete('/:id/groups/:groupId', async (req: Request, res: Response) => {
  try {
    const { id, groupId } = req.params;

    const userGroup = await prisma.userGroup.findFirst({
      where: {
        userId: Number(id),
        groupId: Number(groupId)
      }
    });

    if (!userGroup) {
      return res.status(404).json({ error: 'Benutzer ist nicht in dieser Gruppe' });
    }

    await prisma.userGroup.delete({
      where: { id: userGroup.id }
    });

    res.json({ message: 'Benutzer erfolgreich aus Gruppe entfernt' });

  } catch (error) {
    console.error('Remove user from group error:', error);
    res.status(500).json({ error: 'Fehler beim Entfernen aus der Gruppe' });
  }
});

export default router;
