import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { logAdminActionManually } from '../middleware/adminLogging';
import { AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// ===== HAUS ROUTES =====

// Alle Häuser abrufen
router.get('/', async (req: Request, res: Response) => {
  try {
    const houses = await prisma.house.findMany({
      where: { isActive: true },
      include: {
        stations: {
          where: { isActive: true },
          include: {
            cells: {
              where: { isActive: true },
              select: {
                id: true,
                number: true,
                capacity: true,
                description: true,
                assignments: {
                  where: { isActive: true },
                  select: {
                    id: true,
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true
                      }
                    }
                  }
                }
              }
            },
            _count: {
              select: { cells: true }
            }
          }
        },
        _count: {
          select: { stations: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ houses });
  } catch (error) {
    console.error('Fehler beim Laden der Häuser:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Häuser' });
  }
});

// Haus nach ID abrufen
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const house = await prisma.house.findUnique({
      where: { id: Number(id) },
      include: {
        stations: {
          where: { isActive: true },
          include: {
            cells: {
              where: { isActive: true },
              include: {
                assignments: {
                  where: { isActive: true },
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!house) {
      return res.status(404).json({ error: 'Haus nicht gefunden' });
    }

    res.json({ house });
  } catch (error) {
    console.error('Fehler beim Laden des Hauses:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Hauses' });
  }
});

// Haus erstellen
router.post('/', [
  body('name').trim().isLength({ min: 1 }).withMessage('Hausname ist erforderlich'),
  body('description').optional().trim()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validierungsfehler', 
        details: errors.array() 
      });
    }

    const { name, description } = req.body;

    // Prüfen, ob Hausname bereits existiert
    const existingHouse = await prisma.house.findFirst({
      where: { name }
    });

    if (existingHouse) {
      return res.status(400).json({ 
        error: 'Hausname bereits vergeben' 
      });
    }

    const house = await prisma.house.create({
      data: {
        name,
        description,
        isActive: true
      }
    });

    // Admin-Aktion loggen
    const authReq = req as AuthenticatedRequest;
    if (authReq.user) {
      await logAdminActionManually(
        authReq,
        'HOUSE_CREATED',
        'HOUSE',
        `Neues Haus erstellt: ${name}`
      );
    }

    res.status(201).json({ 
      message: 'Haus erfolgreich erstellt',
      house 
    });

  } catch (error) {
    console.error('Fehler beim Erstellen des Hauses:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Hauses' });
  }
});

// Haus aktualisieren
router.put('/:id', [
  body('name').trim().isLength({ min: 1 }).withMessage('Hausname ist erforderlich'),
  body('description').optional().trim()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validierungsfehler', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { name, description } = req.body;

    // Prüfen, ob Hausname bereits existiert (außer bei diesem Haus)
    const existingHouse = await prisma.house.findFirst({
      where: { 
        name,
        id: { not: Number(id) }
      }
    });

    if (existingHouse) {
      return res.status(400).json({ 
        error: 'Hausname bereits vergeben' 
      });
    }

    const house = await prisma.house.update({
      where: { id: Number(id) },
      data: {
        name,
        description
      }
    });

    // Admin-Aktion loggen
    const authReq = req as AuthenticatedRequest;
    if (authReq.user) {
      await logAdminActionManually(
        authReq,
        'HOUSE_UPDATED',
        'HOUSE',
        `Haus aktualisiert: ${name}`
      );
    }

    res.json({ 
      message: 'Haus erfolgreich aktualisiert',
      house 
    });

  } catch (error) {
    console.error('Fehler beim Aktualisieren des Hauses:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Hauses' });
  }
});

// Haus deaktivieren (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const house = await prisma.house.update({
      where: { id: Number(id) },
      data: { isActive: false }
    });

    // Admin-Aktion loggen
    const authReq = req as AuthenticatedRequest;
    if (authReq.user) {
      await logAdminActionManually(
        authReq,
        'HOUSE_DELETED',
        'HOUSE',
        `Haus deaktiviert: ${house.name}`
      );
    }

    res.json({ 
      message: 'Haus erfolgreich deaktiviert',
      house 
    });

  } catch (error) {
    console.error('Fehler beim Deaktivieren des Hauses:', error);
    res.status(500).json({ error: 'Fehler beim Deaktivieren des Hauses' });
  }
});

// ===== STATION ROUTES =====

// Stationen eines Hauses abrufen
router.get('/:houseId/stations', async (req: Request, res: Response) => {
  try {
    const { houseId } = req.params;
    const stations = await prisma.station.findMany({
      where: { 
        houseId: Number(houseId),
        isActive: true 
      },
      include: {
        cells: {
          where: { isActive: true },
          include: {
            assignments: {
              where: { isActive: true },
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: { cells: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ stations });
  } catch (error) {
    console.error('Fehler beim Laden der Stationen:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Stationen' });
  }
});

// Station erstellen
router.post('/:houseId/stations', [
  body('name').trim().isLength({ min: 1 }).withMessage('Stationsname ist erforderlich'),
  body('description').optional().trim()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validierungsfehler', 
        details: errors.array() 
      });
    }

    const { houseId } = req.params;
    const { name, description } = req.body;

    // Prüfen, ob Haus existiert
    const house = await prisma.house.findUnique({
      where: { id: Number(houseId) }
    });

    if (!house) {
      return res.status(404).json({ error: 'Haus nicht gefunden' });
    }

    // Prüfen, ob Stationsname bereits in diesem Haus existiert
    const existingStation = await prisma.station.findFirst({
      where: { 
        name,
        houseId: Number(houseId)
      }
    });

    if (existingStation) {
      return res.status(400).json({ 
        error: 'Stationsname bereits in diesem Haus vergeben' 
      });
    }

    const station = await prisma.station.create({
      data: {
        name,
        description,
        houseId: Number(houseId),
        isActive: true
      }
    });

    // Admin-Aktion loggen
    const authReq = req as AuthenticatedRequest;
    if (authReq.user) {
      await logAdminActionManually(
        authReq,
        'STATION_CREATED',
        'STATION',
        `Neue Station erstellt: ${name} in Haus ${house.name}`
      );
    }

    res.status(201).json({ 
      message: 'Station erfolgreich erstellt',
      station 
    });

  } catch (error) {
    console.error('Fehler beim Erstellen der Station:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Station' });
  }
});

// Station aktualisieren
router.put('/stations/:id', [
  body('name').trim().isLength({ min: 1 }).withMessage('Stationsname ist erforderlich'),
  body('description').optional().trim()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validierungsfehler', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { name, description } = req.body;

    // Prüfen, ob Stationsname bereits existiert (außer bei dieser Station)
    const existingStation = await prisma.station.findFirst({
      where: { 
        name,
        id: { not: Number(id) }
      }
    });

    if (existingStation) {
      return res.status(400).json({ 
        error: 'Stationsname bereits vergeben' 
      });
    }

    const station = await prisma.station.update({
      where: { id: Number(id) },
      data: {
        name,
        description
      }
    });

    // Admin-Aktion loggen
    const authReq = req as AuthenticatedRequest;
    if (authReq.user) {
      await logAdminActionManually(
        authReq,
        'STATION_UPDATED',
        'STATION',
        `Station aktualisiert: ${name}`
      );
    }

    res.json({ 
      message: 'Station erfolgreich aktualisiert',
      station 
    });

  } catch (error) {
    console.error('Fehler beim Aktualisieren der Station:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Station' });
  }
});

// Station deaktivieren
router.delete('/stations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const station = await prisma.station.update({
      where: { id: Number(id) },
      data: { isActive: false }
    });

    // Admin-Aktion loggen
    const authReq = req as AuthenticatedRequest;
    if (authReq.user) {
      await logAdminActionManually(
        authReq,
        'STATION_DELETED',
        'STATION',
        `Station deaktiviert: ${station.name}`
      );
    }

    res.json({ 
      message: 'Station erfolgreich deaktiviert',
      station 
    });

  } catch (error) {
    console.error('Fehler beim Deaktivieren der Station:', error);
    res.status(500).json({ error: 'Fehler beim Deaktivieren der Station' });
  }
});

// ===== ZELLEN ROUTES =====

// Zellen einer Station abrufen
router.get('/stations/:stationId/cells', async (req: Request, res: Response) => {
  try {
    const { stationId } = req.params;
    const cells = await prisma.cell.findMany({
      where: { 
        stationId: Number(stationId),
        isActive: true 
      },
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: { number: 'asc' }
    });

    res.json({ cells });
  } catch (error) {
    console.error('Fehler beim Laden der Zellen:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Zellen' });
  }
});

// Zelle erstellen
router.post('/stations/:stationId/cells', [
  body('number').trim().isLength({ min: 1 }).withMessage('Zellennummer ist erforderlich'),
  body('description').optional().trim(),
  body('capacity').isInt({ min: 1 }).withMessage('Kapazität muss mindestens 1 sein')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validierungsfehler', 
        details: errors.array() 
      });
    }

    const { stationId } = req.params;
    const { number, description, capacity } = req.body;

    // Prüfen, ob Station existiert
    const station = await prisma.station.findUnique({
      where: { id: Number(stationId) }
    });

    if (!station) {
      return res.status(404).json({ error: 'Station nicht gefunden' });
    }

    // Prüfen, ob Zellennummer bereits in dieser Station existiert
    const existingCell = await prisma.cell.findFirst({
      where: { 
        number,
        stationId: Number(stationId)
      }
    });

    if (existingCell) {
      return res.status(400).json({ 
        error: 'Zellennummer bereits in dieser Station vergeben' 
      });
    }

    const cell = await prisma.cell.create({
      data: {
        number,
        description,
        capacity: Number(capacity),
        stationId: Number(stationId),
        isActive: true
      }
    });

    // Admin-Aktion loggen
    const authReq = req as AuthenticatedRequest;
    if (authReq.user) {
      await logAdminActionManually(
        authReq,
        'CELL_CREATED',
        'CELL',
        `Neue Zelle erstellt: ${number} in Station ${station.name}`
      );
    }

    res.status(201).json({ 
      message: 'Zelle erfolgreich erstellt',
      cell 
    });

  } catch (error) {
    console.error('Fehler beim Erstellen der Zelle:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Zelle' });
  }
});

// Zelle aktualisieren
router.put('/cells/:id', [
  body('number').trim().isLength({ min: 1 }).withMessage('Zellennummer ist erforderlich'),
  body('description').optional().trim(),
  body('capacity').isInt({ min: 1 }).withMessage('Kapazität muss mindestens 1 sein')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validierungsfehler', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { number, description, capacity } = req.body;

    // Prüfen, ob Zellennummer bereits existiert (außer bei dieser Zelle)
    const existingCell = await prisma.cell.findFirst({
      where: { 
        number,
        id: { not: Number(id) }
      }
    });

    if (existingCell) {
      return res.status(400).json({ 
        error: 'Zellennummer bereits vergeben' 
      });
    }

    const cell = await prisma.cell.update({
      where: { id: Number(id) },
      data: {
        number,
        description,
        capacity: Number(capacity)
      }
    });

    // Admin-Aktion loggen
    const authReq = req as AuthenticatedRequest;
    if (authReq.user) {
      await logAdminActionManually(
        authReq,
        'CELL_UPDATED',
        'CELL',
        `Zelle aktualisiert: ${number}`
      );
    }

    res.json({ 
      message: 'Zelle erfolgreich aktualisiert',
      cell 
    });

  } catch (error) {
    console.error('Fehler beim Aktualisieren der Zelle:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Zelle' });
  }
});

// Zelle deaktivieren
router.delete('/cells/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const cell = await prisma.cell.update({
      where: { id: Number(id) },
      data: { isActive: false }
    });

    // Admin-Aktion loggen
    const authReq = req as AuthenticatedRequest;
    if (authReq.user) {
      await logAdminActionManually(
        authReq,
        'CELL_DELETED',
        'CELL',
        `Zelle deaktiviert: ${cell.number}`
      );
    }

    res.json({ 
      message: 'Zelle erfolgreich deaktiviert',
      cell 
    });

  } catch (error) {
    console.error('Fehler beim Deaktivieren der Zelle:', error);
    res.status(500).json({ error: 'Fehler beim Deaktivieren der Zelle' });
  }
});

// ===== ZELLEN-ZUWEISUNGEN ROUTES =====

// Zellen-Zuweisungen abrufen
router.get('/cells/:cellId/assignments', async (req: Request, res: Response) => {
  try {
    const { cellId } = req.params;
    const assignments = await prisma.cellAssignment.findMany({
      where: { 
        cellId: Number(cellId),
        isActive: true 
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        assignedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });

    res.json({ assignments });
  } catch (error) {
    console.error('Fehler beim Laden der Zellen-Zuweisungen:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Zellen-Zuweisungen' });
  }
});

// Test-Route für Zellen-Zuweisung (Debug)
router.get('/cells/:cellId/test', async (req: Request, res: Response) => {
  try {
    const { cellId } = req.params;
    
    // Prüfen, ob Zelle existiert
    const cell = await prisma.cell.findUnique({
      where: { id: Number(cellId) },
      include: {
        station: {
          include: {
            house: true
          }
        }
      }
    });

    if (!cell) {
      return res.status(404).json({ error: 'Zelle nicht gefunden' });
    }

    res.json({ 
      message: 'Zelle gefunden',
      cell: {
        id: cell.id,
        number: cell.number,
        capacity: cell.capacity,
        station: cell.station.name,
        house: cell.station.house.name
      }
    });

  } catch (error) {
    console.error('Test-Route Fehler:', error);
    res.status(500).json({ 
      error: 'Test-Route Fehler',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

// Insasse zu Zelle zuweisen
router.post('/cells/:cellId/assignments', [
  body('userId').isInt().withMessage('Benutzer-ID ist erforderlich'),
  body('notes').optional().trim()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validierungsfehler', 
        details: errors.array() 
      });
    }

    const { cellId } = req.params;
    const { userId, notes } = req.body;
    const authReq = req as AuthenticatedRequest;

    // Prüfen, ob Zelle existiert
    const cell = await prisma.cell.findUnique({
      where: { id: Number(cellId) }
    });

    if (!cell) {
      return res.status(404).json({ error: 'Zelle nicht gefunden' });
    }

    // Prüfen, ob Benutzer existiert
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Prüfen, ob Benutzer bereits einer Zelle zugewiesen ist
    const existingAssignment = await prisma.cellAssignment.findFirst({
      where: { 
        userId: Number(userId),
        isActive: true 
      }
    });

    if (existingAssignment) {
      return res.status(400).json({ 
        error: 'Benutzer ist bereits einer Zelle zugewiesen' 
      });
    }

    // Prüfen, ob Zelle bereits voll ist
    const currentAssignments = await prisma.cellAssignment.count({
      where: { 
        cellId: Number(cellId),
        isActive: true 
      }
    });

    if (currentAssignments >= cell.capacity) {
      return res.status(400).json({ 
        error: 'Zelle ist bereits voll' 
      });
    }

         const assignment = await prisma.cellAssignment.create({
       data: {
         cellId: Number(cellId),
         userId: Number(userId),
         assignedBy: authReq.user?.userId || null,
         notes,
         isActive: true
       },
       include: {
         user: {
           select: {
             id: true,
             firstName: true,
             lastName: true,
             username: true
           }
         }
       }
     });

    // Admin-Aktion loggen
    if (authReq.user) {
      await logAdminActionManually(
        authReq,
        'CELL_ASSIGNMENT_CREATED',
        'CELL_ASSIGNMENT',
        `Insasse ${user.firstName} ${user.lastName} zu Zelle ${cell.number} zugewiesen`
      );
    }

    res.status(201).json({ 
      message: 'Zellen-Zuweisung erfolgreich erstellt',
      assignment 
    });

  } catch (error) {
    console.error('Fehler beim Erstellen der Zellen-Zuweisung:', error);
    
    // Detaillierte Fehlerausgabe für Debugging
    if (error instanceof Error) {
      console.error('Fehlerdetails:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    res.status(500).json({ 
      error: 'Fehler beim Erstellen der Zellen-Zuweisung',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

// Zellen-Zuweisung entfernen
router.delete('/assignments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    
         // Erst die Zuweisung laden, um die Daten für das Logging zu haben
     const existingAssignment = await prisma.cellAssignment.findUnique({
       where: { id: Number(id) },
       include: {
         user: {
           select: {
             id: true,
             firstName: true,
             lastName: true,
             username: true
           }
         },
         cell: {
           select: {
             id: true,
             number: true
           }
         }
       }
     });

     if (!existingAssignment) {
       return res.status(404).json({ error: 'Zellen-Zuweisung nicht gefunden' });
     }

     // Zuweisung komplett löschen
     await prisma.cellAssignment.delete({
       where: { id: Number(id) }
     });

     const assignment = existingAssignment;

    // Admin-Aktion loggen
    if (authReq.user) {
      await logAdminActionManually(
        authReq,
        'CELL_ASSIGNMENT_REMOVED',
        'CELL_ASSIGNMENT',
        `Insasse ${assignment.user.firstName} ${assignment.user.lastName} von Zelle ${assignment.cell.number} entfernt`
      );
    }

    res.json({ 
      message: 'Zellen-Zuweisung erfolgreich entfernt',
      assignment 
    });

  } catch (error) {
    console.error('Fehler beim Entfernen der Zellen-Zuweisung:', error);
    
    // Detaillierte Fehlerausgabe für Debugging
    if (error instanceof Error) {
      console.error('Fehlerdetails:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    res.status(500).json({ 
      error: 'Fehler beim Entfernen der Zellen-Zuweisung',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

export default router;

