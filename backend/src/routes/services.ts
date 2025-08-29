import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateToken, checkPermission, checkGroup, AuthenticatedRequest } from '../middleware/auth';
import { logAdminActionManually } from '../middleware/adminLogging';

// Workflow-Regeln mit Antragstyp-Unterstützung
interface WorkflowRule {
  fromStatus: string;
  toStatus: string;
  conditions: string[];
  serviceType?: string; // Optional: Nur für bestimmte Antragstypen
}

const workflowRules: WorkflowRule[] = [
  // Freitextantrag - flexible Workflows
  {
    fromStatus: 'PENDING',
    toStatus: 'IN_PROGRESS',
    conditions: ['manual_review'],
    serviceType: 'FREETEXT'
  },
  {
    fromStatus: 'PENDING',
    toStatus: 'COMPLETED',
    conditions: ['direct_approval'],
    serviceType: 'FREETEXT'
  },
  {
    fromStatus: 'IN_PROGRESS',
    toStatus: 'COMPLETED',
    conditions: ['all_requirements_met'],
    serviceType: 'FREETEXT'
  },
  {
    fromStatus: 'IN_PROGRESS',
    toStatus: 'REJECTED',
    conditions: ['requirements_not_met'],
    serviceType: 'FREETEXT'
  }
  // Hier können später spezielle Antragstypen hinzugefügt werden
  // z.B. MEDICAL_APPOINTMENT mit strengeren Workflows
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

// Workflow-Funktionen mit Antragstyp-Unterstützung
const checkWorkflowRules = async (serviceId: number, newStatus: string, reason?: string) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { createdByUser: true }
    });

    if (!service) return null;

    // Workflow-Regel für den neuen Status und Antragstyp finden
    const rule = workflowRules.find(r => 
      r.fromStatus === service.status && 
      r.toStatus === newStatus &&
      (!r.serviceType || r.serviceType === (service as any).serviceType)
    );
    
    if (!rule) return null;

    // Aktivität für Workflow-Übergang loggen
    const workflowDetails = `Status zu "${newStatus}" geändert. ${reason ? `Grund: ${reason}` : ''}`;

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



// Kommentar zu einem Service hinzufügen
router.post('/:id/comments', [
  authenticateToken,
  body('content').notEmpty().withMessage('Kommentar-Inhalt ist erforderlich')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content } = req.body;

    // Service finden
    const service = await prisma.service.findUnique({
      where: { id: Number(id) },
      include: { createdByUser: true }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service nicht gefunden' });
    }

    // Aktuellen Benutzer aus dem Request holen
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: 'Benutzer nicht authentifiziert' });
    }

    // Vollständige Benutzerdaten aus der Datenbank abrufen
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Benutzername für Aktivität erstellen
    const who = `${user.firstName} ${user.lastName} (${user.username})`;

    // Kommentar als Aktivität speichern
    await prisma.activity.create({
      data: {
        recordId: service.id,
        who: who,
        action: 'comment',
        details: content,
        userId: user.id
      }
    });

    res.json({ message: 'Kommentar erfolgreich gespeichert' });
  } catch (error: any) {
    console.error('Kommentar hinzufügen error:', error);
    res.status(500).json({ error: 'Fehler beim Speichern des Kommentars' });
  }
});

// Rückfrage an Insassen zu einem Service hinzufügen
router.post('/:id/inquiries', [
  authenticateToken,
  body('content').notEmpty().withMessage('Rückfrage-Inhalt ist erforderlich')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content } = req.body;

    // Service finden
    const service = await prisma.service.findUnique({
      where: { id: Number(id) },
      include: { createdByUser: true }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service nicht gefunden' });
    }

    // Aktuellen Benutzer aus dem Request holen
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: 'Benutzer nicht authentifiziert' });
    }

    // Vollständige Benutzerdaten aus der Datenbank abrufen
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Benutzername für Aktivität erstellen
    const who = `${user.firstName} ${user.lastName} (${user.username})`;

    // Rückfrage als Aktivität speichern
    const activity = await prisma.activity.create({
      data: {
        recordId: service.id,
        who: who,
        action: 'inquiry',
        details: content,
        userId: user.id
      }
    });

    console.log('Rückfrage gespeichert:', activity);

    res.json({ message: 'Rückfrage erfolgreich gespeichert' });
  } catch (error: any) {
    console.error('Rückfrage hinzufügen error:', error);
    res.status(500).json({ error: 'Fehler beim Speichern der Rückfrage' });
  }
});

// Service an eine Gruppe weiterleiten
router.post('/:id/forward', [
  authenticateToken,
  body('groupId').isInt().withMessage('Gruppen-ID ist erforderlich'),
  body('comment').notEmpty().withMessage('Kommentar ist erforderlich')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { groupId, comment } = req.body;

    // Service finden
    const service = await prisma.service.findUnique({
      where: { id: Number(id) },
      include: { createdByUser: true }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service nicht gefunden' });
    }

    // Gruppe finden
    const group = await prisma.group.findUnique({
      where: { id: Number(groupId) }
    });

    if (!group) {
      return res.status(404).json({ error: 'Gruppe nicht gefunden' });
    }

    // Aktuellen Benutzer aus dem Request holen
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: 'Benutzer nicht authentifiziert' });
    }

    // Vollständige Benutzerdaten aus der Datenbank abrufen
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Benutzername für Aktivität erstellen
    const who = `${user.firstName} ${user.lastName} (${user.username})`;

    // Service an Gruppe zuweisen
    await prisma.service.update({
      where: { id: Number(id) },
      data: {
        assignedToGroup: Number(groupId),
        assignedTo: null // Personen-Zuweisung entfernen
      } as any
    });

    // Weiterleitung als Aktivität speichern
    const activity = await prisma.activity.create({
      data: {
        recordId: service.id,
        who: who,
        action: 'forward',
        details: `Weitergeleitet an ${group.description || group.name}. Kommentar: ${comment}`,
        userId: user.id,
        groupId: Number(groupId)
      } as any
    });

    console.log('Service weitergeleitet:', activity);

    res.json({ message: 'Service erfolgreich weitergeleitet' });
  } catch (error: any) {
    console.error('Weiterleitung error:', error);
    res.status(500).json({ error: 'Fehler beim Weiterleiten des Services' });
  }
});

// Antworten auf Rückfragen zu einem Service hinzufügen
router.post('/:id/answers', [
  authenticateToken,
  body('content').notEmpty().withMessage('Antwort-Inhalt ist erforderlich')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content } = req.body;

    // Service finden
    const service = await prisma.service.findUnique({
      where: { id: Number(id) },
      include: { createdByUser: true }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service nicht gefunden' });
    }

    // Aktuellen Benutzer aus dem Request holen
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: 'Benutzer nicht authentifiziert' });
    }

    // Vollständige Benutzerdaten aus der Datenbank abrufen
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Benutzername für Aktivität erstellen
    const who = `${user.firstName} ${user.lastName} (${user.username})`;

    // Antwort als Aktivität speichern
    const activity = await prisma.activity.create({
      data: {
        recordId: service.id,
        who: who,
        action: 'answer',
        details: content,
        userId: user.id
      }
    });

    // Die zugehörige Rückfrage auf inaktiv setzen
    await prisma.activity.updateMany({
      where: {
        recordId: service.id,
        action: 'inquiry',
        isActive: true
      } as any,
      data: {
        isActive: false
      } as any
    });

    console.log('Antwort gespeichert und Rückfrage deaktiviert:', activity);

    res.json({ message: 'Antwort erfolgreich gespeichert' });
  } catch (error: any) {
    console.error('Antwort hinzufügen error:', error);
    res.status(500).json({ error: 'Fehler beim Speichern der Antwort' });
  }
});

// Verfügbare Staff-Gruppen für Weiterleitung abrufen
router.get('/staff-groups', [
  authenticateToken
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Nur Staff-Gruppen abrufen (nicht Inmates, Admins, etc.)
    const staffGroups = await prisma.group.findMany({
      where: {
        category: 'STAFF',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({ groups: staffGroups });
  } catch (error: any) {
    console.error('Staff-Gruppen abrufen error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Staff-Gruppen' });
  }
});

// Rückfragen für einen Insassen abrufen
router.get('/inquiries/:userId', [
  authenticateToken
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    console.log('Suche Rückfragen für Benutzer:', userId);

    // Services des Insassen mit aktiven Rückfragen finden
    const servicesWithInquiries = await prisma.service.findMany({
      where: {
        createdBy: Number(userId),
        activities: {
          some: {
            action: 'inquiry',
            isActive: true
          } as any
        }
      },
      include: {
        activities: {
          where: {
            action: 'inquiry',
            isActive: true
          } as any,
          orderBy: { when: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('Gefundene Services mit Rückfragen:', servicesWithInquiries.length);
    console.log('Services:', servicesWithInquiries);

    res.json({ services: servicesWithInquiries });
  } catch (error: any) {
    console.error('Rückfragen abrufen error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Rückfragen' });
  }
});

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
        assignedToGroupRef: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        activities: {
          orderBy: { when: 'desc' },
          take: 5
        }
      } as any, // Bypass TypeScript until Prisma client is regenerated
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
        assignedToGroupRef: {
          select: {
            id: true,
            name: true,
            description: true
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
      } as any // Bypass TypeScript until Prisma client is regenerated
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
        who: `${service.createdByUser.firstName} ${service.createdByUser.lastName} (${service.createdByUser.username})`,
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

    // Validierung der gültigen Status
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Ungültiger Status. Gültige Werte: PENDING, IN_PROGRESS, COMPLETED' });
    }

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

// Entscheidung treffen
router.patch('/:id/decision', [
  body('decision').notEmpty().withMessage('Entscheidung ist erforderlich'),
  body('reason').optional()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { decision, reason } = req.body;

    // Validierung der gültigen Entscheidungen
    const validDecisions = ['APPROVED', 'REJECTED', 'RETURNED'];
    if (!validDecisions.includes(decision)) {
      return res.status(400).json({ error: 'Ungültige Entscheidung. Gültige Werte: APPROVED, REJECTED, RETURNED' });
    }

    const service = await prisma.service.update({
      where: { id: Number(id) },
      data: { decision: decision as any }
    });

    // Aktivität loggen
    const activityDetails = reason 
      ? `Entscheidung "${decision}" getroffen. Grund: ${reason}`
      : `Entscheidung "${decision}" getroffen`;

    await prisma.activity.create({
      data: {
        recordId: service.id,
        who: 'System', // Temporär, da createdByUser nicht verfügbar
        action: 'decision_made',
        details: activityDetails,
        userId: service.createdBy
      }
    });

    res.json(service);

  } catch (error: any) {
    console.error('Update decision error:', error);
    res.status(500).json({ error: 'Fehler beim Treffen der Entscheidung' });
  }
});

// Status und Entscheidung gleichzeitig aktualisieren
router.patch('/:id/update', [
  body('status').optional(),
  body('decision').optional(),
  body('reason').optional()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, decision, reason } = req.body;

    // Validierung der gültigen Werte
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
    const validDecisions = ['APPROVED', 'REJECTED', 'RETURNED'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Ungültiger Status. Gültige Werte: PENDING, IN_PROGRESS, COMPLETED' });
    }

    if (decision && !validDecisions.includes(decision)) {
      return res.status(400).json({ error: 'Ungültige Entscheidung. Gültige Werte: APPROVED, REJECTED' });
    }

    // Update-Daten vorbereiten
    const updateData: any = {};
    if (status) updateData.status = status;
    if (decision) updateData.decision = decision as any;

    const service = await prisma.service.update({
      where: { id: Number(id) },
      data: updateData
    });

    // Aktivität loggen
    let activityDetails = '';
    if (status && decision) {
      activityDetails = `Status zu "${status}" und Entscheidung "${decision}" geändert. ${reason ? `Grund: ${reason}` : ''}`;
    } else if (status) {
      activityDetails = `Status zu "${status}" geändert. ${reason ? `Grund: ${reason}` : ''}`;
    } else if (decision) {
      activityDetails = `Entscheidung "${decision}" getroffen. ${reason ? `Grund: ${reason}` : ''}`;
    }

    if (activityDetails) {
      await prisma.activity.create({
        data: {
          recordId: service.id,
          who: 'System', // Temporär, da createdByUser nicht verfügbar
          action: 'status_and_decision_updated',
          details: activityDetails,
          userId: service.createdBy
        }
      });
    }

    res.json(service);

  } catch (error: any) {
    console.error('Update status and decision error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren von Status und Entscheidung' });
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

    // Benutzerdaten aus der Datenbank abrufen
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
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
        who: `${user.firstName} ${user.lastName} (${user.username})`,
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



    // Workflow-Übergänge heute
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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
        workflowTransitionsToday
      }
    });

  } catch (error: any) {
    console.error('Get workflow stats error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Workflow-Statistiken' });
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
