import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, checkAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Alle Admin-Logs abrufen (nur Admin)
router.get('/', authenticateToken, checkAdmin(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, action, adminUsername, startDate, endDate } = req.query;
    
    console.log('Admin logs filter query:', { page, limit, action, adminUsername, startDate, endDate }); // Debug-Log
    
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Filter-Bedingungen erstellen
    const where: any = {};
    
    if (action) {
      where.action = { contains: action as string };
    }
    
    if (adminUsername) {
      where.adminUsername = { contains: adminUsername as string };
    }
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate as string);
      }
    }

    console.log('Where clause:', JSON.stringify(where, null, 2)); // Debug-Log für Where-Klausel

    // Logs mit Pagination abrufen
    const [logs, totalCount] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limitNumber,
        include: {
          admin: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.adminLog.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.json({
      logs,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalCount,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1
      }
    });
  } catch (error: any) {
    console.error('Get admin logs error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Fehler beim Abrufen der Admin-Logs',
      details: error.message 
    });
  }
});

// Admin-Log Statistiken abrufen
router.get('/statistics', authenticateToken, checkAdmin(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where: any = {};
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate as string);
      }
    }

    // Verschiedene Statistiken abrufen
    const [
      totalLogs,
      uniqueAdmins,
      actionCounts,
      recentActivity
    ] = await Promise.all([
      // Gesamte Anzahl der Logs
      prisma.adminLog.count({ where }),
      
      // Anzahl einzigartiger Admins
      prisma.adminLog.groupBy({
        by: ['adminUsername'],
        where,
        _count: { adminUsername: true }
      }),
      
      // Häufigste Aktionen
      prisma.adminLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10
      }),
      
      // Letzte Aktivitäten (letzte 10)
      prisma.adminLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: {
          admin: {
            select: {
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      })
    ]);

    res.json({
      totalLogs,
      uniqueAdmins: uniqueAdmins.length,
      actionCounts,
      recentActivity
    });
  } catch (error: any) {
    console.error('Get admin logs statistics error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Admin-Log Statistiken' });
  }
});

// Spezifischen Admin-Log abrufen
router.get('/:id', authenticateToken, checkAdmin(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const log = await prisma.adminLog.findUnique({
      where: { id: Number(id) },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!log) {
      return res.status(404).json({ error: 'Admin-Log nicht gefunden' });
    }

    res.json({ log });
  } catch (error: any) {
    console.error('Get admin log error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Admin-Logs' });
  }
});

export default router;
