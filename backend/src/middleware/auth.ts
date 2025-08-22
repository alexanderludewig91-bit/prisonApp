import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number
    username: string
    groups: string[]
    permissions: string[]
  }
}

// JWT Middleware
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
    
    // Benutzer mit Gruppen und Berechtigungen laden
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        groups: {
          include: {
            group: true
          }
        }
      }
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' })
    }

    // Gruppen und Berechtigungen extrahieren
    const groups = user.groups.map(ug => ug.group.name)
    const permissions = user.groups.flatMap(ug => {
      try {
        return JSON.parse(ug.group.permissions || '[]')
      } catch {
        return []
      }
    })

    req.user = {
      userId: user.id,
      username: user.username,
      groups,
      permissions: [...new Set(permissions)] // Duplikate entfernen
    }

    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' })
  }
}

// Berechtigungs-Check Middleware
export const checkPermission = (requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const hasPermission = requiredPermissions.some(permission => 
      req.user!.permissions.includes(permission) || 
      req.user!.permissions.includes('all_permissions')
    )

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}

// Gruppen-Check Middleware
export const checkGroup = (requiredGroups: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const hasGroup = requiredGroups.some(group => 
      req.user!.groups.includes(group)
    )

    if (!hasGroup) {
      return res.status(403).json({ error: 'Required group membership' })
    }

    next()
  }
}

// Admin-Check Middleware
export const checkAdmin = () => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const isAdmin = req.user.groups.includes('PS Designers')

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    next()
  }
}

// Kategorie-Check Middleware (INMATE, STAFF, ADMIN)
export const checkCategory = (requiredCategories: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    try {
      const userGroups = await prisma.userGroup.findMany({
        where: { userId: req.user.userId },
        include: { group: true }
      })

      const hasCategory = userGroups.some(ug => 
        requiredCategories.includes(ug.group.category || '')
      )

      if (!hasCategory) {
        return res.status(403).json({ error: 'Required category membership' })
      }

      next()
    } catch (error) {
      return res.status(500).json({ error: 'Error checking category' })
    }
  }
}

// Hilfsfunktionen für Berechtigungen
export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  return userPermissions.includes(requiredPermission) || userPermissions.includes('all_permissions')
}

export const hasGroup = (userGroups: string[], requiredGroup: string): boolean => {
  return userGroups.includes(requiredGroup)
}

export const isInmate = (userGroups: string[]): boolean => {
  return hasGroup(userGroups, 'PS Inmates')
}

export const isStaff = (userGroups: string[]): boolean => {
  return userGroups.some(group => 
    group.includes('PS Prison Administration') ||
    group.includes('PS General Enforcement Service') ||
    group.includes('PS Vollzugsabteilungsleitung') ||
    group.includes('PS Vollzugsleitung') ||
    group.includes('PS Anstaltsleitung') ||
    group.includes('PS Payments Office') ||
    group.includes('PS Medical Staff')
  )
}

export const isAdmin = (userGroups: string[]): boolean => {
  return hasGroup(userGroups, 'PS Designers')
}
