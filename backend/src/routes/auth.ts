import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';

const router = express.Router();
const prisma = new PrismaClient();

// TEMPORÄRER ENDPUNKT - Nur für Entwicklung!
router.get('/hash-password/:password', async (req: Request, res: Response) => {
  try {
    const { password } = req.params;
    const hashedPassword = await bcrypt.hash(password, 12);
    res.json({ 
      original: password, 
      hashed: hashedPassword,
      message: 'Kopieren Sie den gehashten Wert in die Datenbank'
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Fehler beim Hashen des Passworts' });
  }
});

// Login Route
router.post('/login', [
  body('username').notEmpty().withMessage('Benutzername ist erforderlich'),
  body('password').notEmpty().withMessage('Passwort ist erforderlich')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Benutzer finden
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        groups: {
          include: {
            group: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    // Passwort überprüfen
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    // Gruppen und Berechtigungen extrahieren
    const groups = user.groups.map((ug: any) => ug.group.name)
    const permissions = user.groups.flatMap((ug: any) => {
      try {
        return JSON.parse(ug.group.permissions || '[]')
      } catch {
        return []
      }
    })

    // JWT Token erstellen
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        groups,
        permissions: [...new Set(permissions)]
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Erfolgreich angemeldet',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        groups: user.groups.map((ug: any) => ({ 
          id: ug.group.id, 
          name: ug.group.name, 
          category: ug.group.category,
          role: ug.role 
        })),
        permissions: [...new Set(permissions)]
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Anmeldung fehlgeschlagen' });
  }
});

// Registrierung Route
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Benutzername muss mindestens 3 Zeichen lang sein'),
  body('email').isEmail().withMessage('Gültige E-Mail-Adresse erforderlich'),
  body('password').isLength({ min: 6 }).withMessage('Passwort muss mindestens 6 Zeichen lang sein'),
  body('firstName').notEmpty().withMessage('Vorname ist erforderlich'),
  body('lastName').notEmpty().withMessage('Nachname ist erforderlich')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Prüfen ob Benutzer bereits existiert
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Benutzer oder E-Mail bereits vorhanden' });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 12);

    // Benutzer erstellen
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName
      }
    });

    res.status(201).json({
      message: 'Benutzer erfolgreich erstellt',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registrierung fehlgeschlagen' });
  }
});

// Verify Token Route
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token fehlt' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        groups: {
          include: {
            group: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Ungültiger Token' });
    }

    // Gruppen und Berechtigungen extrahieren
    const groups = user.groups.map((ug: any) => ug.group.name)
    const permissions = user.groups.flatMap((ug: any) => {
      try {
        return JSON.parse(ug.group.permissions || '[]')
      } catch {
        return []
      }
    })

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        groups: user.groups.map((ug: any) => ({ 
          id: ug.group.id, 
          name: ug.group.name, 
          category: ug.group.category,
          role: ug.role 
        })),
        permissions: [...new Set(permissions)]
      }
    });

  } catch (error: any) {
    res.status(401).json({ error: 'Ungültiger Token' });
  }
});

export default router;
