import bcrypt from 'bcryptjs';
import { Router, type Response } from 'express';
import db, { sanitizeStudent, type StudentRow } from '../db.ts';
import {
  clearAuthCookie,
  requireAuth,
  setAuthCookie,
  signAuthToken,
  type AuthenticatedRequest,
} from '../middleware/auth.ts';
import { cleanString, isValidEmail, validatePasswordStrength } from '../utils/validation.ts';

const router = Router();

router.post('/register', async (req, res: Response) => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      role,
      college,
      degree,
      department,
      rollNumber,
      graduationYear,
    } = req.body ?? {};

    const cleanRole =
      role === undefined || role === null || role === ''
        ? 'student'
        : String(role).trim().toLowerCase();

    if (cleanRole !== 'student' && cleanRole !== 'admin') {
      res.status(400).json({ error: 'Role must be either student or admin.' });
      return;
    }

    const cleanName = cleanString(fullName, 120);
    const cleanEmail = cleanString(email, 254).toLowerCase();
    const cleanCollege = cleanString(college, 180);
    const cleanDegree = cleanString(degree, 120) || (cleanRole === 'admin' ? 'Administration' : '');
    const cleanDepartment = cleanString(department, 120) || (cleanRole === 'admin' ? 'Administration' : '');
    const cleanRoll = cleanString(rollNumber, 60) || (cleanRole === 'admin' ? 'ADMIN' : '');
    const parsedGradYear = Number(graduationYear);
    const gradYearNum =
      cleanRole === 'admin' && (!graduationYear || Number.isNaN(parsedGradYear))
        ? new Date().getFullYear()
        : parsedGradYear;

    if (!cleanName || cleanName.length < 2) {
      res.status(400).json({ error: 'Full name is required (minimum 2 characters).' });
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    const passwordErr = validatePasswordStrength(password);
    if (passwordErr) {
      res.status(400).json({ error: passwordErr });
      return;
    }
    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Password and confirm password do not match.' });
      return;
    }
    if (!cleanCollege) {
      res.status(400).json({ error: 'College name is required.' });
      return;
    }
    if (cleanRole === 'student') {
      if (!cleanDegree) {
        res.status(400).json({ error: 'Course / Degree is required.' });
        return;
      }
      if (!cleanDepartment) {
        res.status(400).json({ error: 'Branch / Department is required.' });
        return;
      }
      if (!cleanRoll) {
        res.status(400).json({ error: 'Roll number is required.' });
        return;
      }
    }
    if (!Number.isInteger(gradYearNum) || gradYearNum < 2000 || gradYearNum > 2040) {
      res.status(400).json({ error: 'Please enter a valid graduation year (2000–2040).' });
      return;
    }

    const existing = db.prepare('SELECT id FROM students WHERE LOWER(email) = ?').get(cleanEmail);
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const result = db
      .prepare(
        `INSERT INTO students (
          fullName, email, passwordHash, role, college, degree, department, rollNumber, graduationYear, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        cleanName,
        cleanEmail,
        passwordHash,
        cleanRole,
        cleanCollege,
        cleanDegree,
        cleanDepartment,
        cleanRoll,
        gradYearNum,
        now,
        now
      );

    const created = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid) as StudentRow;
    res.status(201).json({
      message: 'Registration successful. You can now log in.',
      student: sanitizeStudent(created),
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Unable to complete registration right now. Please try again.' });
  }
});

router.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    const cleanEmail = cleanString(email, 254).toLowerCase();

    if (!isValidEmail(cleanEmail) || typeof password !== 'string' || password.length === 0) {
      res.status(400).json({ error: 'Please enter both a valid email address and your password.' });
      return;
    }

    const student = db.prepare('SELECT * FROM students WHERE LOWER(email) = ?').get(cleanEmail) as StudentRow | undefined;
    if (!student) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, student.passwordHash);
    if (!passwordMatches) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signAuthToken({
      studentId: student.id,
      email: student.email,
      role: student.role,
    });

    setAuthCookie(req, res, token);

    res.json({
      message: 'Login successful.',
      token,
      student: sanitizeStudent(student),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Unable to log in right now. Please try again.' });
  }
});

router.post('/logout', (req, res: Response) => {
  clearAuthCookie(req, res);
  res.json({ message: 'Logged out successfully.' });
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.student) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }
  const token = signAuthToken({
    studentId: req.student.id,
    email: req.student.email,
    role: req.student.role,
  });
  res.json({
    token,
    student: sanitizeStudent(req.student),
  });
});

router.put('/password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const student = req.student!;
    const { currentPassword, newPassword, confirmNewPassword } = req.body ?? {};

    if (typeof currentPassword !== 'string' || !currentPassword) {
      res.status(400).json({ error: 'Current password is required.' });
      return;
    }

    const matches = await bcrypt.compare(currentPassword, student.passwordHash);
    if (!matches) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    const passwordErr = validatePasswordStrength(newPassword);
    if (passwordErr) {
      res.status(400).json({ error: passwordErr });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      res.status(400).json({ error: 'New password and confirmation do not match.' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const now = new Date().toISOString();
    db.prepare('UPDATE students SET passwordHash = ?, updatedAt = ? WHERE id = ?').run(newHash, now, student.id);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ error: 'Unable to update password.' });
  }
});

export default router;
