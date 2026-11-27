import crypto from 'crypto';
import { Router, type Response } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import db, { photosDir, resumesDir, sanitizeStudent, type StudentRow } from '../db.ts';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.ts';
import { cleanString, isValidOptionalDate, validateSafeHttpUrl } from '../utils/validation.ts';

const router = Router();

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';
    if (!isPdfMime || !isPdfExt) {
      cb(new Error('Only PDF files (.pdf) are allowed for resume upload.'));
      return;
    }
    cb(null, true);
  },
});

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error('Profile photo must be a JPG, PNG, or WebP image.'));
      return;
    }
    cb(null, true);
  },
});

function detectImageExtension(buffer: Buffer): '.jpg' | '.png' | '.webp' | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return '.jpg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return '.png';
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return '.webp';
  }
  return null;
}

function safeRemoveFile(baseDir: string, storedName: string) {
  if (!storedName) return;
  const resolved = path.resolve(baseDir, path.basename(storedName));
  if (resolved.startsWith(baseDir + path.sep) && fs.existsSync(resolved)) {
    fs.unlinkSync(resolved);
  }
}

router.get('/profile', requireAuth, requireRole(['student', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  res.json({ student: sanitizeStudent(req.student!) });
});

router.put('/profile', requireAuth, requireRole(['student', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const student = req.student!;
    const body = req.body ?? {};

    const fullName = cleanString(body.fullName ?? student.fullName, 120);
    const phone = cleanString(body.phone ?? student.phone, 30);
    const dob = cleanString(body.dob ?? student.dob, 20);
    const address = cleanString(body.address ?? student.address, 300);
    const college = cleanString(body.college ?? student.college, 180);
    const degree = cleanString(body.degree ?? student.degree, 120);
    const department = cleanString(body.department ?? student.department, 120);
    const rollNumber = cleanString(body.rollNumber ?? student.rollNumber, 60);
    const currentSemester = cleanString(body.currentSemester ?? student.currentSemester, 40);
    const graduationYear = Number(body.graduationYear ?? student.graduationYear);
    const cgpa = cleanString(body.cgpa ?? student.cgpa, 20);
    const skills = cleanString(body.skills ?? student.skills, 1000);
    const programmingLanguages = cleanString(body.programmingLanguages ?? student.programmingLanguages, 500);
    const projects = cleanString(body.projects ?? student.projects, 3000);
    const certifications = cleanString(body.certifications ?? student.certifications, 2000);
    const deadlineAlertDays = Number(body.deadlineAlertDays ?? student.deadlineAlertDays ?? 3);

    if (!fullName || fullName.length < 2) {
      res.status(400).json({ error: 'Full name is required.' });
      return;
    }
    if (!college || !degree || !department || !rollNumber) {
      res.status(400).json({ error: 'College, degree, department, and roll number are required.' });
      return;
    }
    if (!Number.isInteger(graduationYear) || graduationYear < 2000 || graduationYear > 2040) {
      res.status(400).json({ error: 'Please enter a valid graduation year.' });
      return;
    }
    if (!isValidOptionalDate(dob)) {
      res.status(400).json({ error: 'Date of birth must be a valid date (YYYY-MM-DD).' });
      return;
    }
    if (phone && !/^[+\d\s()-]{6,25}$/.test(phone)) {
      res.status(400).json({ error: 'Please enter a valid phone number.' });
      return;
    }
    if (!Number.isInteger(deadlineAlertDays) || deadlineAlertDays < 1 || deadlineAlertDays > 30) {
      res.status(400).json({ error: 'Deadline reminder window must be between 1 and 30 days.' });
      return;
    }

    const linkedinCheck = validateSafeHttpUrl(body.linkedinUrl ?? student.linkedinUrl, 'LinkedIn profile');
    if (!linkedinCheck.valid) {
      res.status(400).json({ error: linkedinCheck.error });
      return;
    }
    const githubCheck = validateSafeHttpUrl(body.githubUrl ?? student.githubUrl, 'GitHub profile');
    if (!githubCheck.valid) {
      res.status(400).json({ error: githubCheck.error });
      return;
    }
    const portfolioCheck = validateSafeHttpUrl(body.portfolioUrl ?? student.portfolioUrl, 'Portfolio website');
    if (!portfolioCheck.valid) {
      res.status(400).json({ error: portfolioCheck.error });
      return;
    }

    const now = new Date().toISOString();
    db.prepare(
      `UPDATE students SET
        fullName = ?, phone = ?, dob = ?, address = ?,
        college = ?, degree = ?, department = ?, rollNumber = ?,
        currentSemester = ?, graduationYear = ?, cgpa = ?,
        skills = ?, programmingLanguages = ?, projects = ?, certifications = ?,
        linkedinUrl = ?, githubUrl = ?, portfolioUrl = ?,
        deadlineAlertDays = ?, updatedAt = ?
      WHERE id = ?`
    ).run(
      fullName,
      phone,
      dob,
      address,
      college,
      degree,
      department,
      rollNumber,
      currentSemester,
      graduationYear,
      cgpa,
      skills,
      programmingLanguages,
      projects,
      certifications,
      linkedinCheck.normalized,
      githubCheck.normalized,
      portfolioCheck.normalized,
      deadlineAlertDays,
      now,
      student.id
    );

    const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(student.id) as StudentRow;
    res.json({
      message: 'Profile updated successfully.',
      student: sanitizeStudent(updated),
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Unable to update profile.' });
  }
});

router.post(
  '/resume',
  requireAuth,
  requireRole(['student', 'admin']),
  resumeUpload.single('resume'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const student = req.student!;
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'Please select a PDF resume file to upload.' });
        return;
      }

      if (file.buffer.length < 5 || file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
        res.status(400).json({ error: 'Invalid PDF file. Please upload a valid PDF document.' });
        return;
      }

      const storedName = `${crypto.randomUUID()}.pdf`;
      const targetPath = path.resolve(resumesDir, storedName);
      if (!targetPath.startsWith(resumesDir + path.sep)) {
        res.status(400).json({ error: 'Invalid file destination.' });
        return;
      }

      fs.writeFileSync(targetPath, file.buffer);
      safeRemoveFile(resumesDir, student.resumeStoredName);

      const safeOriginalName = path.basename(file.originalname).replace(/[^\w.\-\s()]/g, '_').slice(0, 160);
      const now = new Date().toISOString();

      db.prepare(
        `UPDATE students SET
          resumeFileName = ?, resumeStoredName = ?, resumeSize = ?, resumeUploadedAt = ?, updatedAt = ?
        WHERE id = ?`
      ).run(safeOriginalName || 'resume.pdf', storedName, file.size, now, now, student.id);

      const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(student.id) as StudentRow;
      res.json({
        message: 'Resume uploaded successfully.',
        student: sanitizeStudent(updated),
      });
    } catch (err) {
      console.error('Resume upload error:', err);
      res.status(500).json({ error: 'Failed to upload resume.' });
    }
  }
);

router.get(
  '/resume/download',
  requireAuth,
  requireRole(['student', 'admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const student = req.student!;
    if (!student.resumeStoredName) {
      res.status(404).json({ error: 'No resume has been uploaded yet.' });
      return;
    }

    const safeBase = path.basename(student.resumeStoredName);
    const resolved = path.resolve(resumesDir, safeBase);
    if (!resolved.startsWith(resumesDir + path.sep) || !fs.existsSync(resolved)) {
      res.status(404).json({ error: 'Resume file could not be found on the server.' });
      return;
    }

    const disposition = req.query.download === '1' ? 'attachment' : 'inline';
    const downloadName = (student.resumeFileName || 'resume.pdf').replace(/["\r\n]/g, '');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${downloadName}"`);
    res.sendFile(resolved);
  }
);

router.delete('/resume', requireAuth, requireRole(['student', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const student = req.student!;
  safeRemoveFile(resumesDir, student.resumeStoredName);
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE students SET resumeFileName = '', resumeStoredName = '', resumeSize = 0, resumeUploadedAt = '', updatedAt = ? WHERE id = ?`
  ).run(now, student.id);
  const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(student.id) as StudentRow;
  res.json({ message: 'Resume removed.', student: sanitizeStudent(updated) });
});

router.post(
  '/photo',
  requireAuth,
  requireRole(['student', 'admin']),
  photoUpload.single('photo'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const student = req.student!;
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'Please select an image file.' });
        return;
      }

      const ext = detectImageExtension(file.buffer);
      if (!ext) {
        res.status(400).json({ error: 'Invalid image file. Only JPG, PNG, and WebP images are supported.' });
        return;
      }

      const storedName = `${crypto.randomUUID()}${ext}`;
      const targetPath = path.resolve(photosDir, storedName);
      if (!targetPath.startsWith(photosDir + path.sep)) {
        res.status(400).json({ error: 'Invalid file destination.' });
        return;
      }

      fs.writeFileSync(targetPath, file.buffer);
      safeRemoveFile(photosDir, student.profilePhoto);

      const now = new Date().toISOString();
      db.prepare('UPDATE students SET profilePhoto = ?, updatedAt = ? WHERE id = ?').run(storedName, now, student.id);

      const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(student.id) as StudentRow;
      res.json({
        message: 'Profile photo updated.',
        student: sanitizeStudent(updated),
      });
    } catch (err) {
      console.error('Photo upload error:', err);
      res.status(500).json({ error: 'Failed to upload profile photo.' });
    }
  }
);

router.get('/photo/:filename', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const filename = String(req.params.filename || '');
  if (!/^[a-f0-9-]+\.(jpg|png|webp)$/i.test(filename) || req.student?.profilePhoto !== filename) {
    res.status(404).json({ error: 'Photo not found.' });
    return;
  }

  const resolved = path.resolve(photosDir, path.basename(filename));
  if (!resolved.startsWith(photosDir + path.sep) || !fs.existsSync(resolved)) {
    res.status(404).json({ error: 'Photo not found.' });
    return;
  }
  res.sendFile(resolved);
});

export default router;
