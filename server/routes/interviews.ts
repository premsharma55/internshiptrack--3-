import { Router, type Response } from 'express';
import db from '../db.ts';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.ts';
import {
  cleanString,
  INTERVIEW_MODES,
  INTERVIEW_STATUSES,
  isValidDateString,
  validateSafeHttpUrl,
} from '../utils/validation.ts';

const router = Router();
router.use(requireAuth, requireRole(['student', 'admin']));

function isValidTimeString(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.student!.id;
    const body = req.body ?? {};
    const internshipId = Number(body.internshipId);
    const interviewDate = cleanString(body.interviewDate, 20);
    const interviewTime = cleanString(body.interviewTime, 10);
    const interviewMode = cleanString(body.interviewMode, 20);
    const location = cleanString(body.location, 200);
    const interviewRound = cleanString(body.interviewRound, 100);
    const status = cleanString(body.status || 'Scheduled', 20);
    const notes = cleanString(body.notes, 2000);

    if (!Number.isInteger(internshipId) || internshipId <= 0) {
      res.status(400).json({ error: 'Please select an internship application.' });
      return;
    }

    const internship = db
      .prepare('SELECT id, companyName, position FROM internships WHERE id = ? AND studentId = ?')
      .get(internshipId, studentId) as { id: number; companyName: string; position: string } | undefined;

    if (!internship) {
      res.status(404).json({ error: 'Selected internship application was not found.' });
      return;
    }

    if (!isValidDateString(interviewDate)) {
      res.status(400).json({ error: 'Please provide a valid interview date (YYYY-MM-DD).' });
      return;
    }
    if (!isValidTimeString(interviewTime)) {
      res.status(400).json({ error: 'Please provide a valid interview time (HH:MM).' });
      return;
    }
    if (!INTERVIEW_MODES.includes(interviewMode as (typeof INTERVIEW_MODES)[number])) {
      res.status(400).json({ error: 'Interview mode must be Online or Offline.' });
      return;
    }
    if (!interviewRound) {
      res.status(400).json({ error: 'Interview round is required (e.g., Technical Round 1).' });
      return;
    }
    if (!INTERVIEW_STATUSES.includes(status as (typeof INTERVIEW_STATUSES)[number])) {
      res.status(400).json({ error: 'Invalid interview status.' });
      return;
    }

    const linkCheck = validateSafeHttpUrl(body.meetingLink, 'Meeting link');
    if (!linkCheck.valid) {
      res.status(400).json({ error: linkCheck.error });
      return;
    }

    if (interviewMode === 'Online' && !linkCheck.normalized) {
      res.status(400).json({ error: 'Please provide a meeting link for an online interview.' });
      return;
    }
    if (interviewMode === 'Offline' && !location) {
      res.status(400).json({ error: 'Please provide an interview location for an offline interview.' });
      return;
    }

    const now = new Date().toISOString();
    const result = db
      .prepare(
        `INSERT INTO interviews (
          studentId, internshipId, interviewDate, interviewTime, interviewMode,
          meetingLink, location, interviewRound, status, notes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        studentId,
        internshipId,
        interviewDate,
        interviewTime,
        interviewMode,
        linkCheck.normalized,
        location,
        interviewRound,
        status,
        notes,
        now,
        now
      );

    const created = db
      .prepare(
        `SELECT i.*, app.companyName, app.position, app.companyLocation
         FROM interviews i
         JOIN internships app ON i.internshipId = app.id
         WHERE i.id = ? AND i.studentId = ?`
      )
      .get(result.lastInsertRowid, studentId);

    res.status(201).json({
      message: 'Interview scheduled successfully.',
      interview: created,
    });
  } catch (err) {
    console.error('Create interview error:', err);
    res.status(500).json({ error: 'Failed to schedule interview.' });
  }
});

router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.student!.id;
    const rows = db
      .prepare(
        `SELECT i.*, app.companyName, app.position, app.companyLocation, app.status as applicationStatus
         FROM interviews i
         JOIN internships app ON i.internshipId = app.id
         WHERE i.studentId = ?
         ORDER BY i.interviewDate ASC, i.interviewTime ASC`
      )
      .all(studentId);

    res.json({ interviews: rows });
  } catch (err) {
    console.error('List interviews error:', err);
    res.status(500).json({ error: 'Failed to load interviews.' });
  }
});

router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid interview ID.' });
      return;
    }

    const studentId = req.student!.id;
    const existing = db
      .prepare('SELECT * FROM interviews WHERE id = ? AND studentId = ?')
      .get(id, studentId) as { id: number; internshipId: number } | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Interview schedule not found.' });
      return;
    }

    const body = req.body ?? {};
    const internshipId = Number(body.internshipId ?? existing.internshipId);
    const interviewDate = cleanString(body.interviewDate, 20);
    const interviewTime = cleanString(body.interviewTime, 10);
    const interviewMode = cleanString(body.interviewMode, 20);
    const location = cleanString(body.location, 200);
    const interviewRound = cleanString(body.interviewRound, 100);
    const status = cleanString(body.status || 'Scheduled', 20);
    const notes = cleanString(body.notes, 2000);

    const internship = db
      .prepare('SELECT id FROM internships WHERE id = ? AND studentId = ?')
      .get(internshipId, studentId);
    if (!internship) {
      res.status(404).json({ error: 'Selected internship application was not found.' });
      return;
    }

    if (!isValidDateString(interviewDate)) {
      res.status(400).json({ error: 'Please provide a valid interview date (YYYY-MM-DD).' });
      return;
    }
    if (!isValidTimeString(interviewTime)) {
      res.status(400).json({ error: 'Please provide a valid interview time (HH:MM).' });
      return;
    }
    if (!INTERVIEW_MODES.includes(interviewMode as (typeof INTERVIEW_MODES)[number])) {
      res.status(400).json({ error: 'Interview mode must be Online or Offline.' });
      return;
    }
    if (!interviewRound) {
      res.status(400).json({ error: 'Interview round is required.' });
      return;
    }
    if (!INTERVIEW_STATUSES.includes(status as (typeof INTERVIEW_STATUSES)[number])) {
      res.status(400).json({ error: 'Invalid interview status.' });
      return;
    }

    const linkCheck = validateSafeHttpUrl(body.meetingLink, 'Meeting link');
    if (!linkCheck.valid) {
      res.status(400).json({ error: linkCheck.error });
      return;
    }
    if (interviewMode === 'Online' && !linkCheck.normalized) {
      res.status(400).json({ error: 'Please provide a meeting link for an online interview.' });
      return;
    }
    if (interviewMode === 'Offline' && !location) {
      res.status(400).json({ error: 'Please provide an interview location for an offline interview.' });
      return;
    }

    const now = new Date().toISOString();
    db.prepare(
      `UPDATE interviews SET
        internshipId = ?, interviewDate = ?, interviewTime = ?, interviewMode = ?,
        meetingLink = ?, location = ?, interviewRound = ?, status = ?, notes = ?, updatedAt = ?
      WHERE id = ? AND studentId = ?`
    ).run(
      internshipId,
      interviewDate,
      interviewTime,
      interviewMode,
      linkCheck.normalized,
      location,
      interviewRound,
      status,
      notes,
      now,
      id,
      studentId
    );

    const updated = db
      .prepare(
        `SELECT i.*, app.companyName, app.position, app.companyLocation, app.status as applicationStatus
         FROM interviews i
         JOIN internships app ON i.internshipId = app.id
         WHERE i.id = ? AND i.studentId = ?`
      )
      .get(id, studentId);

    res.json({
      message: 'Interview schedule updated.',
      interview: updated,
    });
  } catch (err) {
    console.error('Update interview error:', err);
    res.status(500).json({ error: 'Failed to update interview.' });
  }
});

router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid interview ID.' });
    return;
  }

  const studentId = req.student!.id;
  const result = db.prepare('DELETE FROM interviews WHERE id = ? AND studentId = ?').run(id, studentId);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Interview schedule not found.' });
    return;
  }

  res.json({ message: 'Interview deleted.' });
});

export default router;
