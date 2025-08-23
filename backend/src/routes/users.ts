import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { logAdminActionManually } from '../middleware/adminLogging';
import { AuthenticatedRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Alle Benutzer abrufen
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page, limit, search } = req.query;
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { username: { contains: String(search) } },
        { email: { contains: String(search) } },
        { firstName: { contains: String(search) } },
        { lastName: { contains: String(search) } }
      ];
    }

    // Wenn keine Paginierung angefordert wird, alle Benutzer laden
    const queryOptions: any = {
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
            group: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                permissions: true,
                isActive: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    };

    // Paginierung nur anwenden, wenn page und limit angegeben sind
    if (page && limit) {
      const skip = (Number(page) - 1) * Number(limit);
      queryOptions.skip = skip;
      queryOptions.take = Number(limit);
    }

    const users = await prisma.user.findMany(queryOptions);
    const total = await prisma.user.count({ where });

    const response: any = { users };

    // Pagination-Info nur hinzufügen, wenn Paginierung angewendet wurde
    if (page && limit) {
      response.pagination = {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      };
    }

    res.json(response);

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
  body('firstName').notEmpty().withMessage('Vorname ist erforderlich'),
  body('lastName').notEmpty().withMessage('Nachname ist erforderlich'),
  body('username').notEmpty().withMessage('Benutzername ist erforderlich'),
  body('email').isEmail().withMessage('Gültige E-Mail-Adresse erforderlich'),
  body('isActive').optional().isBoolean().withMessage('isActive muss ein Boolean sein')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { firstName, lastName, username, email, isActive } = req.body;

    // Prüfen ob Benutzername bereits existiert (außer für den aktuellen Benutzer)
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        id: { not: Number(id) }
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Benutzername ist bereits vergeben' });
    }

    // Prüfen ob E-Mail bereits existiert (außer für den aktuellen Benutzer)
    const existingEmail = await prisma.user.findFirst({
      where: {
        email,
        id: { not: Number(id) }
      }
    });

    if (existingEmail) {
      return res.status(400).json({ error: 'E-Mail-Adresse ist bereits vergeben' });
    }

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        firstName,
        lastName,
        username,
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

    // Admin-Logging
    await logAdminActionManually(req, 'Benutzer bearbeitet', `Benutzer ${user.firstName} ${user.lastName}`, `Benutzer ${user.firstName} ${user.lastName} wurde bearbeitet`);

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

// Passwort ändern
router.put('/:id/password', [
  body('newPassword').isLength({ min: 6 }).withMessage('Passwort muss mindestens 6 Zeichen lang sein'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwörter stimmen nicht überein');
    }
    return true;
  })
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { newPassword } = req.body;

    // Prüfen ob Benutzer existiert
    const existingUser = await prisma.user.findUnique({
      where: { id: Number(id) }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Passwort aktualisieren
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        password: hashedPassword
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

    // Admin-Logging
    await logAdminActionManually(req, 'Passwort geändert', `Passwort für ${user.firstName} ${user.lastName}`, `Passwort für Benutzer ${user.firstName} ${user.lastName} wurde geändert`);

    res.json({ message: 'Passwort erfolgreich geändert' });
  } catch (error) {
    console.error('Fehler beim Ändern des Passworts:', error);
    res.status(500).json({ error: 'Fehler beim Ändern des Passworts' });
  }
});

// Benutzer löschen
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prüfen ob Benutzer existiert
    const existingUser = await prisma.user.findUnique({
      where: { id: Number(id) },
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
            group: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true
              }
            }
          }
        }
      }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Prüfen ob es sich um einen Admin-Benutzer handelt (nur PS Designers schützen)
    const isAdminUser = existingUser.groups.some(ug => 
      ug.group.name === 'PS Designers'
    );

    if (isAdminUser) {
      return res.status(403).json({ error: 'Admin-Benutzer können nicht gelöscht werden' });
    }

    // Alle UserGroup-Einträge für diesen Benutzer löschen
    await prisma.userGroup.deleteMany({
      where: { userId: Number(id) }
    });

    // Benutzer löschen
    await prisma.user.delete({
      where: { id: Number(id) }
    });

    // Admin-Logging
    await logAdminActionManually(req, 'Benutzer gelöscht', `Benutzer ${existingUser.firstName} ${existingUser.lastName}`, `Benutzer ${existingUser.firstName} ${existingUser.lastName} (${existingUser.username}) wurde gelöscht`);

    res.json({ message: 'Benutzer erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Benutzers:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Benutzers' });
  }
});

// Neue Route für Staff-Benutzer
router.get('/staff', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        groups: {
          some: {
            group: {
              category: 'STAFF'
            }
          }
        }
      },
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
            group: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                permissions: true,
                isActive: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ users })
  } catch (error) {
    console.error('Fehler beim Laden der Staff-Benutzer:', error)
    res.status(500).json({ error: 'Fehler beim Laden der Staff-Benutzer' })
  }
})

// Neue Route für Inmate-Benutzer
router.get('/inmates', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        groups: {
          some: {
            group: {
              category: 'INMATE'
            }
          }
        }
      },
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
            group: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                permissions: true,
                isActive: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ users })
  } catch (error) {
    console.error('Fehler beim Laden der Inmate-Benutzer:', error)
    res.status(500).json({ error: 'Fehler beim Laden der Inmate-Benutzer' })
  }
})

export default router;
