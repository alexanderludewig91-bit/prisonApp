import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateToken, checkPermission, checkGroup, checkAdmin, AuthenticatedRequest } from '../middleware/auth';
import { logAdminAction, logAdminActionManually } from '../middleware/adminLogging';

const router = express.Router();
const prisma = new PrismaClient();

// Alle Gruppen abrufen (nur Admin)
router.get('/', authenticateToken, checkAdmin(), logAdminAction({
  action: 'VIEW_ALL_GROUPS',
  target: 'groups',
  details: 'Admin viewed all groups'
}), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const groups = await prisma.group.findMany({
      where: { isActive: true },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Transformiere die Datenstruktur für das Frontend
    const transformedGroups = groups.map(group => ({
      ...group,
      users: group.users.map(userGroup => ({
        id: userGroup.user.id,
        username: userGroup.user.username,
        firstName: userGroup.user.firstName,
        lastName: userGroup.user.lastName,
        role: userGroup.role
      }))
    }));

    res.json({ groups: transformedGroups });
  } catch (error: any) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Gruppen' });
  }
});

// Gruppe nach ID abrufen
router.get('/:id', authenticateToken, checkPermission(['read']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const group = await prisma.group.findUnique({
      where: { id: Number(id) },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Gruppe nicht gefunden' });
    }

    // Transformiere die Datenstruktur für das Frontend
    const transformedGroup = {
      ...group,
      users: group.users.map(userGroup => ({
        id: userGroup.user.id,
        username: userGroup.user.username,
        firstName: userGroup.user.firstName,
        lastName: userGroup.user.lastName,
        role: userGroup.role
      }))
    };

    res.json({ group: transformedGroup });
  } catch (error: any) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Gruppe' });
  }
});

// Neue Gruppe erstellen (nur Admin)
router.post('/', [
  authenticateToken,
  checkPermission(['all_permissions']),
  body('name').notEmpty().withMessage('Gruppenname ist erforderlich'),
  body('description').optional(),
  body('category').optional(),
  body('permissions').optional()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, category, permissions } = req.body;

    // Prüfen ob Gruppe bereits existiert
    const existingGroup = await prisma.group.findUnique({
      where: { name }
    });

    if (existingGroup) {
      return res.status(400).json({ error: 'Gruppe mit diesem Namen existiert bereits' });
    }

    const group = await prisma.group.create({
      data: {
        name,
        description,
        category,
        permissions: permissions ? JSON.stringify(permissions) : null
      }
    });

    res.status(201).json({ 
      message: 'Gruppe erfolgreich erstellt',
      group 
    });
  } catch (error: any) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Gruppe' });
  }
});

// Gruppe aktualisieren (nur Admin)
router.put('/:id', [
  authenticateToken,
  checkPermission(['all_permissions']),
  body('name').optional(),
  body('description').optional(),
  body('category').optional(),
  body('permissions').optional()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, category, permissions } = req.body;

    const group = await prisma.group.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        category,
        permissions: permissions ? JSON.stringify(permissions) : undefined
      }
    });

    res.json({ 
      message: 'Gruppe erfolgreich aktualisiert',
      group 
    });
  } catch (error: any) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Gruppe' });
  }
});

// Benutzer zu Gruppe hinzufügen
router.post('/:id/users', [
  authenticateToken,
  checkPermission(['all_permissions']),
  body('userId').isInt().withMessage('Benutzer-ID ist erforderlich'),
  body('role').optional().isIn(['ADMIN', 'MEMBER', 'VIEWER']).withMessage('Ungültige Rolle')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { userId, role = 'MEMBER' } = req.body;

    // Prüfen ob Benutzer bereits in der Gruppe ist
    const existingMembership = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId: Number(userId),
          groupId: Number(id)
        }
      }
    });

    if (existingMembership) {
      return res.status(400).json({ error: 'Benutzer ist bereits Mitglied dieser Gruppe' });
    }

    const userGroup = await prisma.userGroup.create({
      data: {
        userId: Number(userId),
        groupId: Number(id),
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

    // Admin-Aktion loggen
    await logAdminActionManually(req, 'ADD_USER_TO_GROUP', 'groups', 
      `Added user ${userGroup.user.username} to group ${userGroup.group.name} with role ${role}`);

    res.status(201).json({ 
      message: 'Benutzer erfolgreich zur Gruppe hinzugefügt',
      userGroup 
    });
  } catch (error: any) {
    console.error('Add user to group error:', error);
    res.status(500).json({ error: 'Fehler beim Hinzufügen des Benutzers zur Gruppe' });
  }
});

// Benutzer aus Gruppe entfernen
router.delete('/:id/users/:userId', [
  authenticateToken,
  checkPermission(['all_permissions'])
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, userId } = req.params;

    // Benutzer und Gruppe vor dem Löschen abrufen für Logging
    const userGroup = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId: Number(userId),
          groupId: Number(id)
        }
      },
      include: {
        user: { select: { username: true } },
        group: { select: { name: true } }
      }
    });

    await prisma.userGroup.delete({
      where: {
        userId_groupId: {
          userId: Number(userId),
          groupId: Number(id)
        }
      }
    });

    // Admin-Aktion loggen
    if (userGroup) {
      await logAdminActionManually(req, 'REMOVE_USER_FROM_GROUP', 'groups',
        `Removed user ${userGroup.user.username} from group ${userGroup.group.name}`);
    }

    res.json({ message: 'Benutzer erfolgreich aus Gruppe entfernt' });
  } catch (error: any) {
    console.error('Remove user from group error:', error);
    res.status(500).json({ error: 'Fehler beim Entfernen des Benutzers aus der Gruppe' });
  }
});

// Benutzer-Gruppen abrufen
router.get('/user/:userId', authenticateToken, checkPermission(['read']), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const userGroups = await prisma.userGroup.findMany({
      where: { userId: Number(userId) },
      include: {
        group: true
      }
    });

    res.json({ userGroups });
  } catch (error: any) {
    console.error('Get user groups error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Benutzer-Gruppen' });
  }
});

// Gruppenmitglieder mit Pagination, Suche, Filter und Sortierung abrufen
router.get('/:id/members', authenticateToken, checkAdmin(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      page = 1, 
      pageSize = 25, 
      search = '', 
      sortField = 'firstName', 
      sortDirection = 'asc',
      role = '',
      status = ''
    } = req.query;

    const pageNum = Number(page);
    const pageSizeNum = Number(pageSize);
    const skip = (pageNum - 1) * pageSizeNum;

    // Basis-Where-Klausel
    let whereClause: any = {
      groupId: Number(id)
    };

    // Suchfilter
    if (search) {
      whereClause.OR = [
        {
          user: {
            OR: [
              { firstName: { contains: search as string } },
              { lastName: { contains: search as string } },
              { username: { contains: search as string } }
            ]
          }
        }
      ];
    }

    // Rollenfilter
    if (role) {
      whereClause.role = role;
    }

    // Statusfilter (vereinfacht - alle Benutzer sind aktiv)
    // In einer echten Anwendung würde hier ein Status-Feld verwendet werden
    if (status) {
      // Für jetzt ignorieren wir den Status-Filter, da wir kein Status-Feld haben
      // whereClause.user.status = status;
    }

    // Sortierung
    let orderBy: any = {};
    if (sortField === 'firstName' || sortField === 'lastName' || sortField === 'username') {
      orderBy.user = { [sortField]: sortDirection };
    } else if (sortField === 'role') {
      orderBy.role = sortDirection;
    } else {
      orderBy.user = { firstName: 'asc' }; // Standard-Sortierung
    }

    // Gesamtanzahl abrufen
    const total = await prisma.userGroup.count({
      where: whereClause
    });

    // Mitglieder mit Pagination abrufen
    const members = await prisma.userGroup.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy,
      skip,
      take: pageSizeNum
    });

    // Daten für Frontend transformieren
    const transformedMembers = members.map(member => ({
      id: member.user.id,
      username: member.user.username,
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      role: member.role,
      status: 'active' // Standard-Status, da wir kein Status-Feld haben
    }));

    res.json({
      members: transformedMembers,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum)
    });

  } catch (error: any) {
    console.error('Get group members error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Gruppenmitglieder' });
  }
});

export default router;
