import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware für Admin-Berechtigung
const checkAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const isAdmin = req.user?.groups.some(group => 
    group.includes('PS Designers') || group.includes('PS Anstaltsleitung')
  );
  
  if (!isAdmin) {
    return res.status(403).json({ error: 'Nur Administratoren können Prozesse verwalten' });
  }
  
  next();
};

// Alle Prozessdefinitionen abrufen
router.get('/', checkAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const processes = await prisma.processDefinition.findMany({
      where: { isActive: true },
      include: {
        steps: {
          where: { isActive: true },
          include: {
            assignments: {
              include: {
                group: {
                  select: {
                    id: true,
                    name: true,
                    description: true
                  }
                }
              }
            }
          },
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ processes });
  } catch (error: any) {
    console.error('Get processes error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Prozesse' });
  }
});

// Prozessdefinition erstellen
router.post('/', checkAdmin, [
  body('name').notEmpty().withMessage('Name ist erforderlich'),
  body('description').optional()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    // Prüfen ob Name bereits existiert
    const existingProcess = await prisma.processDefinition.findFirst({
      where: { name }
    });

    if (existingProcess) {
      return res.status(400).json({ error: 'Ein Prozess mit diesem Namen existiert bereits' });
    }

    const process = await prisma.processDefinition.create({
      data: {
        name,
        description
      },
      include: {
        steps: {
          include: {
            assignments: {
              include: {
                group: {
                  select: {
                    id: true,
                    name: true,
                    description: true
                  }
                }
              }
            }
          },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    res.status(201).json({
      message: 'Prozess erfolgreich erstellt',
      process
    });
  } catch (error: any) {
    console.error('Create process error:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Prozesses' });
  }
});

// Prozessdefinition aktualisieren
router.put('/:id', checkAdmin, [
  body('name').notEmpty().withMessage('Name ist erforderlich'),
  body('description').optional()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const processId = parseInt(req.params.id);
    const { name, description } = req.body;

    // Prüfen ob Name bereits existiert (außer bei diesem Prozess)
    const existingProcess = await prisma.processDefinition.findFirst({
      where: { 
        name,
        id: { not: processId }
      }
    });

    if (existingProcess) {
      return res.status(400).json({ error: 'Ein Prozess mit diesem Namen existiert bereits' });
    }

    const process = await prisma.processDefinition.update({
      where: { id: processId },
      data: {
        name,
        description
      },
      include: {
        steps: {
          include: {
            assignments: {
              include: {
                group: {
                  select: {
                    id: true,
                    name: true,
                    description: true
                  }
                }
              }
            }
          },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    res.json({
      message: 'Prozess erfolgreich aktualisiert',
      process
    });
  } catch (error: any) {
    console.error('Update process error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Prozesses' });
  }
});

// Prozessschritt erstellen
router.post('/:processId/steps', checkAdmin, [
  body('title').notEmpty().withMessage('Titel ist erforderlich'),
  body('statusName').notEmpty().withMessage('Status-Name ist erforderlich'),
  body('description').optional(),
  body('isDecision').isBoolean().withMessage('isDecision muss ein Boolean sein'),
  body('orderIndex').isInt({ min: 0 }).withMessage('orderIndex muss eine positive Zahl sein'),
  body('groupIds').isArray().withMessage('groupIds muss ein Array sein')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const processId = parseInt(req.params.processId);
    const { title, statusName, description, isDecision, orderIndex, groupIds } = req.body;

    // Prüfen ob Prozess existiert
    const process = await prisma.processDefinition.findUnique({
      where: { id: processId }
    });

    if (!process) {
      return res.status(404).json({ error: 'Prozess nicht gefunden' });
    }

    // Prüfen ob Status-Name bereits in diesem Prozess existiert
    const existingStep = await prisma.processStep.findFirst({
      where: {
        processId,
        statusName
      }
    });

    if (existingStep) {
      return res.status(400).json({ error: 'Ein Schritt mit diesem Status-Namen existiert bereits in diesem Prozess' });
    }

    // Schritt erstellen
    const step = await prisma.processStep.create({
      data: {
        processId,
        title,
        statusName,
        description,
        isDecision,
        orderIndex
      },
      include: {
        assignments: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });

    // Gruppen-Zuweisungen erstellen
    if (groupIds && groupIds.length > 0) {
      const assignments = await Promise.all(
        groupIds.map((groupId: number) =>
          prisma.processStepAssignment.create({
            data: {
              stepId: step.id,
              groupId
            },
            include: {
              group: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              }
            }
          })
        )
      );

      step.assignments = assignments;
    }

    res.status(201).json({
      message: 'Prozessschritt erfolgreich erstellt',
      step
    });
  } catch (error: any) {
    console.error('Create process step error:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Prozessschritts' });
  }
});

// Prozessschritt aktualisieren
router.put('/steps/:stepId', checkAdmin, [
  body('title').notEmpty().withMessage('Titel ist erforderlich'),
  body('statusName').notEmpty().withMessage('Status-Name ist erforderlich'),
  body('description').optional(),
  body('isDecision').isBoolean().withMessage('isDecision muss ein Boolean sein'),
  body('orderIndex').isInt({ min: 0 }).withMessage('orderIndex muss eine positive Zahl sein'),
  body('groupIds').isArray().withMessage('groupIds muss ein Array sein')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const stepId = parseInt(req.params.stepId);
    const { title, statusName, description, isDecision, orderIndex, groupIds } = req.body;

    // Prüfen ob Schritt existiert
    const existingStep = await prisma.processStep.findUnique({
      where: { id: stepId },
      include: { process: true }
    });

    if (!existingStep) {
      return res.status(404).json({ error: 'Prozessschritt nicht gefunden' });
    }

    // Prüfen ob Status-Name bereits in diesem Prozess existiert (außer bei diesem Schritt)
    const duplicateStep = await prisma.processStep.findFirst({
      where: {
        processId: existingStep.processId,
        statusName,
        id: { not: stepId }
      }
    });

    if (duplicateStep) {
      return res.status(400).json({ error: 'Ein Schritt mit diesem Status-Namen existiert bereits in diesem Prozess' });
    }

    // Schritt aktualisieren
    const step = await prisma.processStep.update({
      where: { id: stepId },
      data: {
        title,
        statusName,
        description,
        isDecision,
        orderIndex
      },
      include: {
        assignments: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });

    // Bestehende Zuweisungen löschen
    await prisma.processStepAssignment.deleteMany({
      where: { stepId }
    });

    // Neue Gruppen-Zuweisungen erstellen
    if (groupIds && groupIds.length > 0) {
      const assignments = await Promise.all(
        groupIds.map((groupId: number) =>
          prisma.processStepAssignment.create({
            data: {
              stepId: step.id,
              groupId
            },
            include: {
              group: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              }
            }
          })
        )
      );

      step.assignments = assignments;
    }

    res.json({
      message: 'Prozessschritt erfolgreich aktualisiert',
      step
    });
  } catch (error: any) {
    console.error('Update process step error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Prozessschritts' });
  }
});

// Prozessschritt löschen
router.delete('/steps/:stepId', checkAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stepId = parseInt(req.params.stepId);

    // Prüfen ob Schritt existiert
    const step = await prisma.processStep.findUnique({
      where: { id: stepId }
    });

    if (!step) {
      return res.status(404).json({ error: 'Prozessschritt nicht gefunden' });
    }

    // Schritt als inaktiv markieren (soft delete)
    await prisma.processStep.update({
      where: { id: stepId },
      data: { isActive: false }
    });

    res.json({
      message: 'Prozessschritt erfolgreich gelöscht'
    });
  } catch (error: any) {
    console.error('Delete process step error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Prozessschritts' });
  }
});

// Alle verfügbaren Gruppen abrufen (für Dropdown)
router.get('/groups', checkAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const groups = await prisma.group.findMany({
      where: { 
        isActive: true,
        category: { in: ['STAFF', 'ADMIN'] } // Nur Mitarbeiter- und Admin-Gruppen
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({ groups });
  } catch (error: any) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Gruppen' });
  }
});

export default router;

