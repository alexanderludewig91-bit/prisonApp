// Gemeinsame Hilfsfunktionen für Service-Routen
// Diese Datei enthält wiederverwendbare Funktionen, die von verschiedenen Service-Typen genutzt werden

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Workflow-Regeln Interface
interface WorkflowRule {
  fromStatus: string;
  toStatus: string;
  conditions: string[];
  serviceType?: string; // Optional: Nur für bestimmte Antragstypen
}

// Workflow-Regeln (aktuell leer, wird später gefüllt)
const workflowRules: WorkflowRule[] = [
  // Workflow-Regeln werden später gemeinsam definiert
];

// Hilfsfunktion für Status-Text-Übersetzung
export const getStatusText = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'Ausstehend'
    case 'IN_PROGRESS':
      return 'In Bearbeitung'
    case 'COMPLETED':
      return 'Abgeschlossen'
    case 'REJECTED':
      return 'Abgelehnt'
    default:
      return status
  }
}

// Middleware für Rollenprüfung (Legacy - wird durch checkPermission ersetzt)
export const checkRole = (allowedRoles: string[]) => {
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
export const checkWorkflowRules = async (serviceId: number, newStatus: string, reason?: string) => {
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
    const workflowDetails = `Der Status wurde auf ${getStatusText(newStatus)} gesetzt. ${reason ? `Grund: ${reason}` : ''}`;

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
