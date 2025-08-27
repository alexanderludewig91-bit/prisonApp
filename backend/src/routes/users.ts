import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { logAdminActionManually } from '../middleware/adminLogging';
import { AuthenticatedRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Neue Route für Insassen ohne Zuweisung (MUSS vor /inmates stehen!)
router.get('/inmates-unassigned', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        groups: {
          some: {
            group: {
              category: 'INMATE'
            }
          }
        },
        // Nur Insassen ohne Zellen-Zuweisung
        cellAssignments: {
          none: {}
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
    console.error('Fehler beim Laden der unzugewiesenen Insassen:', error)
    res.status(500).json({ error: 'Fehler beim Laden der unzugewiesenen Insassen' })
  }
})

// Neue Route für STAFF-Benutzer (MUSS vor /inmates stehen!)
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
    console.error('Fehler beim Laden der STAFF-Benutzer:', error)
    res.status(500).json({ error: 'Fehler beim Laden der STAFF-Benutzer' })
  }
})

// Neue Route für Inmate-Benutzer (MUSS vor /:id stehen!)
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

// Neue Route für das Erstellen von Insassen (MUSS vor /:id stehen!)
router.post('/inmates', [
  body('firstName').trim().isLength({ min: 1 }).withMessage('Vorname ist erforderlich'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Nachname ist erforderlich'),
  body('username').trim().isLength({ min: 3 }).withMessage('Benutzername muss mindestens 3 Zeichen lang sein'),
  body('email').isEmail().withMessage('Gültige E-Mail-Adresse ist erforderlich'),
  body('password').isLength({ min: 6 }).withMessage('Passwort muss mindestens 6 Zeichen lang sein'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwörter stimmen nicht überein');
    }
    return true;
  })
], async (req: Request, res: Response) => {
  try {
    // Validierung prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validierungsfehler', 
        details: errors.array() 
      });
    }

    const { firstName, lastName, username, email, password } = req.body;

    // Prüfen, ob Benutzername bereits existiert
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'Benutzername oder E-Mail-Adresse bereits vergeben' 
      });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // PS Inmates und PS All Users Gruppen finden
    const [inmatesGroup, allUsersGroup] = await Promise.all([
      prisma.group.findFirst({ where: { name: 'PS Inmates' } }),
      prisma.group.findFirst({ where: { name: 'PS All Users' } })
    ]);

    if (!inmatesGroup) {
      return res.status(500).json({ 
        error: 'PS Inmates Gruppe nicht gefunden' 
      });
    }

    if (!allUsersGroup) {
      return res.status(500).json({ 
        error: 'PS All Users Gruppe nicht gefunden' 
      });
    }

    // Benutzer erstellen
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        firstName,
        lastName,
        password: hashedPassword,
        isActive: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true
      }
    });

    // Benutzer zu beiden Gruppen hinzufügen
    await Promise.all([
      prisma.userGroup.create({
        data: {
          userId: newUser.id,
          groupId: inmatesGroup.id,
          role: 'MEMBER'
        }
      }),
      prisma.userGroup.create({
        data: {
          userId: newUser.id,
          groupId: allUsersGroup.id,
          role: 'MEMBER'
        }
      })
    ]);

    // Admin-Log erstellen
    await logAdminActionManually(
      req as AuthenticatedRequest,
      'CREATE_INMATE',
      'users',
      `Insasse erstellt: ${newUser.firstName} ${newUser.lastName} (${newUser.username})`
    );

    res.status(201).json({ 
      message: 'Insasse erfolgreich erstellt',
      user: newUser
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des Insassen:', error);
    res.status(500).json({ 
      error: 'Fehler beim Erstellen des Insassen',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

// Alle Benutzer abrufen
router.get('/', async (req: Request, res: Response) => {
  try {
    const { group } = req.query;
    
    const where: any = {};
    
    // Filter nach Gruppe
    if (group) {
      where.groups = {
        some: {
          group: {
            name: group
          }
        }
      };
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
    });

    res.json({ users });
  } catch (error) {
    console.error('Fehler beim Laden der Benutzer:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Benutzer' });
  }
});

// Benutzer nach ID abrufen
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Ungültige Benutzer-ID' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Fehler beim Laden des Benutzers:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Benutzers' });
  }
});

// Benutzer aktualisieren
router.put('/:id', [
  body('firstName').optional().trim().isLength({ min: 1 }).withMessage('Vorname ist erforderlich'),
  body('lastName').optional().trim().isLength({ min: 1 }).withMessage('Nachname ist erforderlich'),
  body('email').optional().isEmail().withMessage('Gültige E-Mail-Adresse ist erforderlich'),
  body('isActive').optional().isBoolean().withMessage('isActive muss ein Boolean sein')
], async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Ungültige Benutzer-ID' });
    }

    // Validierung prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validierungsfehler', 
        details: errors.array() 
      });
    }

    const { firstName, lastName, email, isActive } = req.body;

    // Prüfen, ob Benutzer existiert
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // E-Mail-Uniqueness prüfen (falls E-Mail geändert wird)
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: { 
          email,
          id: { not: userId }
        }
      });

      if (emailExists) {
        return res.status(400).json({ error: 'E-Mail-Adresse bereits vergeben' });
      }
    }

    // Benutzer aktualisieren
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName !== undefined ? firstName : undefined,
        lastName: lastName !== undefined ? lastName : undefined,
        email: email !== undefined ? email : undefined,
        isActive: isActive !== undefined ? isActive : undefined
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
      }
    });

    // Admin-Log erstellen
    await logAdminActionManually(
      req as AuthenticatedRequest,
      'UPDATE_USER',
      'users',
      `Benutzer aktualisiert: ${updatedUser.firstName} ${updatedUser.lastName} (${updatedUser.username})`
    );

    res.json({ 
      message: 'Benutzer erfolgreich aktualisiert',
      user: updatedUser
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Benutzers:', error);
    res.status(500).json({ 
      error: 'Fehler beim Aktualisieren des Benutzers',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

// Benutzer löschen
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Ungültige Benutzer-ID' });
    }

    // Prüfen, ob Benutzer existiert
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true
      }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Benutzer löschen (Cascade löscht auch UserGroup-Einträge)
    await prisma.user.delete({
      where: { id: userId }
    });

    // Admin-Log erstellen
    await logAdminActionManually(
      req as AuthenticatedRequest,
      'DELETE_USER',
      'users',
      `Benutzer gelöscht: ${existingUser.firstName} ${existingUser.lastName} (${existingUser.username})`
    );

    res.json({ 
      message: 'Benutzer erfolgreich gelöscht',
      deletedUser: existingUser
    });
  } catch (error) {
    console.error('Fehler beim Löschen des Benutzers:', error);
    res.status(500).json({ 
      error: 'Fehler beim Löschen des Benutzers',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

// Benutzer zu Gruppe hinzufügen
router.post('/:id/groups/:groupId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const groupId = parseInt(req.params.groupId);
    
    if (isNaN(userId) || isNaN(groupId)) {
      return res.status(400).json({ error: 'Ungültige ID' });
    }

    // Prüfen, ob Benutzer und Gruppe existieren
    const [user, group] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.group.findUnique({ where: { id: groupId } })
    ]);

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    if (!group) {
      return res.status(404).json({ error: 'Gruppe nicht gefunden' });
    }

    // Prüfen, ob Benutzer bereits in der Gruppe ist
    const existingMembership = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      }
    });

    if (existingMembership) {
      return res.status(400).json({ error: 'Benutzer ist bereits Mitglied dieser Gruppe' });
    }

    // Benutzer zur Gruppe hinzufügen
    const userGroup = await prisma.userGroup.create({
      data: {
        userId,
        groupId,
        role: 'MEMBER'
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
        group: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    // Admin-Log erstellen
    await logAdminActionManually(
      req as AuthenticatedRequest,
      'ADD_USER_TO_GROUP',
      'groups',
      `Benutzer ${userGroup.user.firstName} ${userGroup.user.lastName} zur Gruppe ${userGroup.group.name} hinzugefügt`
    );

    res.status(201).json({ 
      message: 'Benutzer erfolgreich zur Gruppe hinzugefügt',
      userGroup
    });
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Benutzers zur Gruppe:', error);
    res.status(500).json({ 
      error: 'Fehler beim Hinzufügen des Benutzers zur Gruppe',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

// Benutzer aus Gruppe entfernen
router.delete('/:id/groups/:groupId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const groupId = parseInt(req.params.groupId);
    
    if (isNaN(userId) || isNaN(groupId)) {
      return res.status(400).json({ error: 'Ungültige ID' });
    }

    // Prüfen, ob Mitgliedschaft existiert
    const existingMembership = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
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
        group: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    if (!existingMembership) {
      return res.status(404).json({ error: 'Mitgliedschaft nicht gefunden' });
    }

    // Benutzer aus Gruppe entfernen
    await prisma.userGroup.delete({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      }
    });

    // Admin-Log erstellen
    await logAdminActionManually(
      req as AuthenticatedRequest,
      'REMOVE_USER_FROM_GROUP',
      'groups',
      `Benutzer ${existingMembership.user.firstName} ${existingMembership.user.lastName} aus Gruppe ${existingMembership.group.name} entfernt`
    );

    res.json({ 
      message: 'Benutzer erfolgreich aus Gruppe entfernt',
      removedMembership: existingMembership
    });
  } catch (error) {
    console.error('Fehler beim Entfernen des Benutzers aus der Gruppe:', error);
    res.status(500).json({ 
      error: 'Fehler beim Entfernen des Benutzers aus der Gruppe',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

export default router;
