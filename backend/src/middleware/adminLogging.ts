import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthenticatedRequest } from './auth'

const prisma = new PrismaClient()

export interface AdminLogData {
  action: string
  target?: string
  details?: string
}

// Admin-Logging Middleware
export const logAdminAction = (logData: AdminLogData) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Original Response-Methoden speichern
    const originalJson = res.json
    const originalStatus = res.status

    // Response-Methoden überschreiben um Logging nach erfolgreicher Aktion
    res.json = function(data: any) {
      // Nur loggen wenn es ein erfolgreicher Admin-Request ist
      if (req.user && req.user.groups.includes('PS Designers') && res.statusCode < 400) {
        logAdminActionToDatabase(req, logData)
      }
      return originalJson.call(this, data)
    }

    res.status = function(code: number) {
      // Status setzen
      const result = originalStatus.call(this, code)
      
      // Nur loggen wenn es ein erfolgreicher Admin-Request ist
      if (req.user && req.user.groups.includes('PS Designers') && code < 400) {
        logAdminActionToDatabase(req, logData)
      }
      
      return result
    }

    next()
  }
}

// Hilfsfunktion zum Loggen in die Datenbank
async function logAdminActionToDatabase(req: AuthenticatedRequest, logData: AdminLogData) {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string
    const userAgent = req.headers['user-agent'] || 'Unknown'

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user!.userId,
        adminUsername: req.user!.username,
        action: logData.action,
        target: logData.target,
        details: logData.details,
        ipAddress: ipAddress,
        userAgent: userAgent
      }
    })

    console.log(`🔍 Admin Action Logged: ${req.user!.username} - ${logData.action}`)
  } catch (error) {
    console.error('Error logging admin action:', error)
    // Logging-Fehler sollten die Hauptfunktionalität nicht beeinträchtigen
  }
}

// Hilfsfunktion für manuelles Logging
export const logAdminActionManually = async (
  req: AuthenticatedRequest, 
  action: string, 
  target?: string, 
  details?: string
) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string
    const userAgent = req.headers['user-agent'] || 'Unknown'

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user!.userId,
        adminUsername: req.user!.username,
        action,
        target,
        details,
        ipAddress,
        userAgent
      }
    })

    console.log(`🔍 Manual Admin Action Logged: ${req.user!.username} - ${action}`)
  } catch (error) {
    console.error('Error logging manual admin action:', error)
  }
}
