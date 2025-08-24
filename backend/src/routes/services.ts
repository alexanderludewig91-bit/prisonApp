import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateToken, checkPermission, checkGroup, AuthenticatedRequest } from '../middleware/auth';
import { logAdminActionManually } from '../middleware/adminLogging';

// Workflow-Regeln für automatische Status-Übergänge
interface WorkflowRule {
  fromStatus: string;
  toStatus: string;
  conditions: string[];
  autoAssign?: boolean;
  assignToRole?: string;
}

const workflowRules: WorkflowRule[] = [
  {
    fromStatus: 'PENDING',
    toStatus: 'IN_PROGRESS',
    conditions: ['manual_review'],
    autoAssign: true,
    assignToRole: 'STAFF'
  },
  {
    fromStatus: 'PENDING',
    toStatus: 'COMPLETED',
    conditions: ['direct_approval'],
    autoAssign: true,
    assignToRole: 'STAFF'
  },
  {
    fromStatus: 'IN_PROGRESS',
    toStatus: 'COMPLETED',
    conditions: ['all_requirements_met'],
    autoAssign: false
  },
  {
    fromStatus: 'IN_PROGRESS',
    toStatus: 'REJECTED',
    conditions: ['requirements_not_met'],
    autoAssign: false
  }
];

const router = express.Router();
const prisma = new PrismaClient();

// Middleware für Rollenprüfung (Legacy - wird durch checkPermission ersetzt)
const checkRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Prüfe ob Benutzer in entsprechenden Gruppen ist
    const hasRole = req.user?.groups.some(group => 
      allowedRoles.includes(group) || 
      (group.includes('PS Designers') && allowedRoles.includes('ADMIN')) ||
      (group.includes('PS Inmates') && allowedRoles.includes('INMATE')) ||
      (group.includes('PS General Enforcement Service') && allowedRoles.includes('STAFF'))
    );
    
    if (!hasRole) {
      return res.status(403).json({ error: 'Keine Berechtigung für diese Aktion' });
    }
    next();
  };
};

// Workflow-Funktionen
const checkWorkflowRules = async (serviceId: number, newStatus: string, reason?: string) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { createdByUser: true }
    });

    if (!service) return null;

    // Workflow-Regel für den neuen Status finden
    const rule = workflowRules.find(r => r.fromStatus === service.status && r.toStatus === newStatus);
    
    if (!rule) return null;

    // Automatische Aufgaben-Zuweisung
    if (rule.autoAssign && rule.assignToRole) {
      await assignServiceToAvailableStaff(serviceId, rule.assignToRole);
    }

    // Aktivität für Workflow-Übergang loggen
    const workflowDetails = rule.autoAssign 
      ? `Automatischer Status-Übergang zu "${newStatus}". ${reason ? `Grund: ${reason}` : ''}`
      : `Status zu "${newStatus}" geändert. ${reason ? `Grund: ${reason}` : ''}`;

    await prisma.activity.create({
      data: {
        recordId: serviceId,
        who: service.createdByUser.username,
        action: 'workflow_transition',
        details: workflowDetails,
        userId: service.createdBy
      }
    });

    return rule;
  } catch (error) {
    console.error('Workflow rule check error:', error);
    return null;
  }
};

// Zusätzliche Funktion: Automatische Zuweisung für PENDING Anträge
const assignPendingServices = async () => {
  try {
    // Alle PENDING Anträge ohne Zuweisung finden
    const pendingServices = await prisma.service.findMany({
      where: {
        status: 'PENDING',
        assignedTo: null
      }
    });

    for (const service of pendingServices) {
      await assignServiceToAvailableStaff(service.id, 'STAFF');
    }

    console.log(`Automatisch ${pendingServices.length} PENDING Anträge zugewiesen`);
  } catch (error) {
    console.error('Error assigning pending services:', error);
  }
};

const assignServiceToAvailableStaff = async (serviceId: number, role: string) => {
  try {
    // Verfügbaren Mitarbeiter mit der geringsten Arbeitslast finden
    const availableStaff = await prisma.user.findFirst({
      where: {
        isActive: true,
        groups: {
          some: {
            group: {
              category: role
            }
          }
        }
      },
      include: {
        assignedServices: true
      },
      orderBy: {
        assignedServices: {
          _count: 'asc'
        }
      }
    });

    if (availableStaff) {
      // Service dem Mitarbeiter zuweisen (wir erweitern das Service-Model später)
      await prisma.service.update({
        where: { id: serviceId },
        data: {
          assignedTo: availableStaff.id
        }
      });

      // Aktivität für Zuweisung loggen
      await prisma.activity.create({
        data: {
          recordId: serviceId,
          who: availableStaff.username,
          action: 'assigned',
          details: `Antrag automatisch zugewiesen an ${availableStaff.firstName} ${availableStaff.lastName}`,
          userId: availableStaff.id
        }
      });
    }
  } catch (error) {
    console.error('Service assignment error:', error);
  }
};

// Alle Services abrufen
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, priority, search, userId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (userId) where.createdBy = Number(userId);
    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { description: { contains: String(search) } }
      ];
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        createdByUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        activities: {
          orderBy: { when: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    });

    const total = await prisma.service.count({ where });

    res.json({
      services,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error: any) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Services' });
  }
});

// Alle Anträge löschen
router.delete('/all', authenticateToken, checkPermission(['all_permissions']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Anzahl der Services vor dem Löschen abrufen für Logging
    const serviceCount = await prisma.service.count()
    
    // Zuerst alle Aktivitäten löschen (wegen Foreign Key Constraints)
    await prisma.activity.deleteMany({})
    
    // Dann alle Anträge löschen
    const deletedServices = await prisma.service.deleteMany({})
    
    // Admin-Aktion loggen
    await logAdminActionManually(req, 'DELETE_ALL_SERVICES', 'services',
      `Deleted all ${serviceCount} services and their activities`)
    
    res.json({ 
      message: `${deletedServices.count} Anträge wurden erfolgreich gelöscht`,
      deletedCount: deletedServices.count 
    })
  } catch (error: any) {
    console.error('Fehler beim Löschen aller Anträge:', error)
    res.status(500).json({ error: 'Fehler beim Löschen aller Anträge' })
  }
})

// Service nach ID abrufen
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id: Number(id) },
      include: {
        createdByUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        activities: {
          orderBy: { when: 'desc' },
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

    if (!service) {
      return res.status(404).json({ error: 'Service nicht gefunden' });
    }

    res.json(service);

  } catch (error: any) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Services' });
  }
});

// Neuen Service erstellen
router.post('/', [
  body('title').notEmpty().withMessage('Titel ist erforderlich'),
  body('description').optional(),
  body('status').optional(),
  body('priority').optional(),
  body('number').optional().isNumeric().withMessage('Nummer muss eine Zahl sein')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, status, priority, number } = req.body;
    
    // TODO: Benutzer-ID aus JWT Token extrahieren
    const createdBy = 1; // Temporär

    const service = await prisma.service.create({
      data: {
        title,
        description,
        status: status || 'PENDING',
        priority: priority || 'MEDIUM',
        number: number ? Number(number) : null,
        createdBy
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Aktivität loggen
    await prisma.activity.create({
      data: {
        recordId: service.id,
        who: service.createdByUser.username,
        action: 'created',
        details: `Service "${title}" erstellt`,
        userId: createdBy
      }
    });

    res.status(201).json(service);

  } catch (error: any) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Services' });
  }
});

// Service aktualisieren
router.put('/:id', [
  body('title').optional(),
  body('description').optional(),
  body('status').optional(),
  body('priority').optional(),
  body('number').optional().isNumeric().withMessage('Nummer muss eine Zahl sein')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, status, priority, number } = req.body;

    const existingService = await prisma.service.findUnique({
      where: { id: Number(id) },
      include: { createdByUser: true }
    });

    if (!existingService) {
      return res.status(404).json({ error: 'Service nicht gefunden' });
    }

    const service = await prisma.service.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        status,
        priority,
        number: number ? Number(number) : null
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Aktivität loggen
    await prisma.activity.create({
      data: {
        recordId: service.id,
        who: existingService.createdByUser.username,
        action: 'updated',
        details: `Service "${service.title}" aktualisiert`,
        userId: existingService.createdBy
      }
    });

    res.json(service);

  } catch (error: any) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Services' });
  }
});

// Service löschen
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id: Number(id) },
      include: { createdByUser: true }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service nicht gefunden' });
    }

    // Aktivitäten zuerst löschen
    await prisma.activity.deleteMany({
      where: { recordId: Number(id) }
    });

    // Service löschen
    await prisma.service.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Service erfolgreich gelöscht' });

  } catch (error: any) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Services' });
  }
});

// Status-Änderung
router.patch('/:id/status', [
  body('status').notEmpty().withMessage('Status ist erforderlich')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    const service = await prisma.service.update({
      where: { id: Number(id) },
      data: { status },
      include: {
        createdByUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Aktivität loggen
    await prisma.activity.create({
      data: {
        recordId: service.id,
        who: service.createdByUser.username,
        action: 'status_changed',
        details: `Status zu "${status}" geändert`,
        userId: service.createdBy
      }
    });

    res.json(service);

  } catch (error: any) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Status' });
  }
});

// Insassen-spezifische Endpunkte

// Eigene Services abrufen (nur für Insassen)
router.get('/my/services', checkRole(['INMATE']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Benutzer nicht authentifiziert' });
    }

    const services = await prisma.service.findMany({
      where: { createdBy: userId },
      include: {
        activities: {
          orderBy: { when: 'desc' },
          take: 3
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ services });

  } catch (error: any) {
    console.error('Get my services error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der eigenen Services' });
  }
});

// Neuen Service erstellen (nur für Insassen)
router.post('/my/services', checkRole(['INMATE']), [
  body('title').notEmpty().withMessage('Titel ist erforderlich'),
  body('description').notEmpty().withMessage('Beschreibung ist erforderlich'),
  body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Ungültige Priorität')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.userId;
    const { title, description, priority } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Benutzer nicht authentifiziert' });
    }

    const service = await prisma.service.create({
      data: {
        title,
        description,
        priority,
        createdBy: userId
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Aktivität erstellen
    await prisma.activity.create({
      data: {
        recordId: service.id,
        who: req.user?.username,
        action: 'created',
        details: 'Antrag erstellt',
        userId: userId
      }
    });

    res.status(201).json({
      message: 'Antrag erfolgreich erstellt',
      service
    });

  } catch (error: any) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Antrags' });
  }
});

// Mitarbeiter-spezifische Endpunkte

// Alle Services für Mitarbeiter abrufen (mit erweiterten Filtern)
router.get('/staff/all', checkRole(['STAFF', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, status, priority, search, dateFrom, dateTo } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { description: { contains: String(search) } },
        { createdByUser: { 
          OR: [
            { firstName: { contains: String(search) } },
            { lastName: { contains: String(search) } }
          ]
        }}
      ];
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(String(dateFrom));
      if (dateTo) where.createdAt.lte = new Date(String(dateTo));
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        createdByUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        assignedToUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        activities: {
          orderBy: { when: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    });

    const total = await prisma.service.count({ where });

    res.json({
      services,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error: any) {
    console.error('Get staff services error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Services' });
  }
});

// Service-Statistiken für Mitarbeiter
router.get('/staff/statistics', checkRole(['STAFF', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [pending, inProgress, completed, rejected] = await Promise.all([
      prisma.service.count({ where: { status: 'PENDING' } }),
      prisma.service.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.service.count({ where: { status: 'COMPLETED' } }),
      prisma.service.count({ where: { status: 'REJECTED' } })
    ]);

    res.json({
      statistics: {
        pending,
        inProgress,
        completed,
        rejected,
        total: pending + inProgress + completed + rejected
      }
    });

  } catch (error: any) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Statistiken' });
  }
});

// Workflow-Statistiken für Mitarbeiter
router.get('/staff/workflow-stats', checkRole(['STAFF', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    // Anträge des eingeloggten Mitarbeiters
    const myAssignedServices = await prisma.service.count({
      where: { 
        assignedTo: userId,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      }
    });

    // Automatische Zuweisungen heute
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const autoAssignmentsToday = await prisma.activity.count({
      where: {
        action: 'assigned',
        when: {
          gte: today
        }
      }
    });

    // Workflow-Übergänge heute
    const workflowTransitionsToday = await prisma.activity.count({
      where: {
        action: 'workflow_transition',
        when: {
          gte: today
        }
      }
    });

    res.json({
      workflowStats: {
        myAssignedServices,
        autoAssignmentsToday,
        workflowTransitionsToday
      }
    });

  } catch (error: any) {
    console.error('Get workflow stats error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Workflow-Statistiken' });
  }
});

// Endpunkt zum Zuweisen bestehender PENDING Anträge
router.post('/staff/assign-pending', checkRole(['STAFF', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    await assignPendingServices();
    
    res.json({
      message: 'Bestehende PENDING Anträge wurden automatisch zugewiesen',
      success: true
    });

  } catch (error: any) {
    console.error('Assign pending services error:', error);
    res.status(500).json({ error: 'Fehler beim Zuweisen der PENDING Anträge' });
  }
});

// Kommentar-Funktionalität

// Kommentare zu einem Service abrufen
router.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const comments = await prisma.activity.findMany({
      where: { 
        recordId: Number(id),
        action: 'comment'
      },
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
      orderBy: { when: 'desc' }
    });

    // Kommentare mit korrekten User-Informationen zurückgeben
    const commentsWithUser = comments.map((comment: any) => ({
      ...comment,
      user: comment.user || {
        id: 0,
        username: comment.who,
        firstName: comment.who,
        lastName: ''
      }
    }));

    res.json({ comments: commentsWithUser });

  } catch (error: any) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Kommentare' });
  }
});

// Kommentar zu einem Service hinzufügen
router.post('/:id/comments', checkRole(['STAFF', 'ADMIN']), [
  body('content').notEmpty().withMessage('Kommentar ist erforderlich')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Benutzer nicht authentifiziert' });
    }

    const comment = await prisma.activity.create({
      data: {
        recordId: Number(id),
        who: req.user?.username,
        action: 'comment',
        details: content,
        userId: userId
      },
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
    });

    res.status(201).json({ comment });

  } catch (error: any) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Fehler beim Hinzufügen des Kommentars' });
  }
});

// Status-Änderung mit Workflow-Unterstützung
router.patch('/:id/status', [
  body('status').notEmpty().withMessage('Status ist erforderlich'),
  body('reason').optional()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    const service = await prisma.service.update({
      where: { id: Number(id) },
      data: { status },
      include: {
        createdByUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        assignedToUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Workflow-Regeln prüfen und anwenden
    const workflowRule = await checkWorkflowRules(Number(id), status, reason);

    // Wenn keine Workflow-Regel gefunden wurde, normale Aktivität loggen
    if (!workflowRule) {
      const activityDetails = reason 
        ? `Status zu "${status}" geändert. Grund: ${reason}`
        : `Status zu "${status}" geändert`;

      await prisma.activity.create({
        data: {
          recordId: service.id,
          who: service.createdByUser.username,
          action: 'status_changed',
          details: activityDetails,
          userId: service.createdBy
        }
      });
    }

    res.json(service);

  } catch (error: any) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Status' });
  }
});

export default router;
