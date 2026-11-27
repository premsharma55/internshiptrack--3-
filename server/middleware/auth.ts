import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import db, { type StudentRow } from '../db.ts';

const RUNTIME_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

export function getJwtSecret(): string {
  const envSecret = process.env.JWT_SECRET?.trim();
  return envSecret && envSecret.length >= 16 ? envSecret : RUNTIME_FALLBACK_SECRET;
}

export interface AuthPayload {
  studentId: number;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  student?: StudentRow;
  authSource?: 'bearer' | 'cookie';
}

export const AUTH_COOKIE_NAME = 'sit_token';

export function signAuthToken(payload: AuthPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function setAuthCookie(req: Request, res: Response, token: string): void {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const cookieOptions = {
    httpOnly: true,
    secure: isHttps,
    sameSite: (isHttps ? 'none' : 'lax') as 'none' | 'lax',
    partitioned: isHttps,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
  res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
}

export function clearAuthCookie(req: Request, res: Response): void {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isHttps,
    sameSite: (isHttps ? 'none' : 'lax') as 'none' | 'lax',
    partitioned: isHttps,
    path: '/',
  });
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token: string | undefined;
  let source: 'bearer' | 'cookie' | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
    source = 'bearer';
  } else if (req.cookies && typeof req.cookies[AUTH_COOKIE_NAME] === 'string') {
    token = req.cookies[AUTH_COOKIE_NAME];
    source = 'cookie';
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  // CSRF defense when relying on cookie auth for state-changing requests
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase());
  if (source === 'cookie' && isMutation) {
    const hasCustomHeader = req.headers['x-requested-with'] === 'XMLHttpRequest';
    const origin = req.headers.origin;
    const host = (req.headers['x-forwarded-host'] || req.headers.host || '') as string;
    let originMatchesHost = false;
    if (origin && host) {
      try {
        originMatchesHost = new URL(origin).host === host;
      } catch {
        originMatchesHost = false;
      }
    }
    if (!hasCustomHeader && !originMatchesHost) {
      res.status(403).json({ error: 'Forbidden: cross-origin mutation rejected.' });
      return;
    }
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthPayload;
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(decoded.studentId) as StudentRow | undefined;
    if (!student) {
      res.status(401).json({ error: 'Session is no longer valid. Please log in again.' });
      return;
    }
    req.student = student;
    req.authSource = source;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.student) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!allowedRoles.includes(req.student.role)) {
      res.status(403).json({ error: 'You do not have permission to perform this action.' });
      return;
    }
    next();
  };
}
