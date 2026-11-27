import { Router, type Response } from 'express';
import db from '../db.ts';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.ts';
import {
  APPLICATION_SOURCES,
  APPLICATION_STATUSES,
  cleanString,
  EMPLOYMENT_TYPES,
  INTERNSHIP_TYPES,
  isValidDateString,
  isValidOptionalDate,
  validateSafeHttpUrl,
} from '../utils/validation.ts';

const router = Router();
router.use(requireAuth, requireRole(['student', 'admin']));

interface InternshipRow {
  id: number;
  studentId: number;
  companyName: string;
  companyWebsite: string;
  companyLocation: string;
  industry: string;
  position: string;
  internshipType: string;
  employmentType: string;
  duration: string;
  stipend: number;
  requiredSkills: string;
  applicationDate: string;
  deadline: string;
  applicationSource: string;
  status: string;
  jobDescription: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

function validateInternshipInput(body: Record<string, unknown>) {
  const companyName = cleanString(body.companyName, 160);
  const companyLocation = cleanString(body.companyLocation, 160);
  const industry = cleanString(body.industry, 120);
  const position = cleanString(body.position, 160);
  const internshipType = cleanString(body.internshipType, 40);
  const employmentType = cleanString(body.employmentType || 'Full-time', 40);
  const duration = cleanString(body.duration, 80);
  const stipendRaw = body.stipend === '' || body.stipend === undefined || body.stipend === null ? 0 : Number(body.stipend);
  const requiredSkills = cleanString(body.requiredSkills, 800);
  const applicationDate = cleanString(body.applicationDate, 20);
  const deadline = cleanString(body.deadline, 20);
  const applicationSource = cleanString(body.applicationSource || 'LinkedIn', 80);
  const status = cleanString(body.status || 'Applied', 40);
  const jobDescription = cleanString(body.jobDescription, 5000);
  const notes = cleanString(body.notes, 3000);
  const statusNotes = cleanString(body.statusNotes, 500);

  if (!companyName) return { error: 'Company name is required.' };
  if (!companyLocation) return { error: 'Company location is required.' };
  if (!position) return { error: 'Internship role / position is required.' };
  if (!INTERNSHIP_TYPES.includes(internshipType as (typeof INTERNSHIP_TYPES)[number])) {
    return { error: 'Internship type must be Remote, On-site, or Hybrid.' };
  }
  if (!EMPLOYMENT_TYPES.includes(employmentType as (typeof EMPLOYMENT_TYPES)[number])) {
    return { error: 'Employment type must be Full-time or Part-time.' };
  }
  if (!Number.isFinite(stipendRaw) || stipendRaw < 0) {
    return { error: 'Monthly stipend cannot be negative.' };
  }
  if (!isValidDateString(applicationDate)) {
    return { error: 'Please provide a valid application date (YYYY-MM-DD).' };
  }
  if (!isValidOptionalDate(deadline)) {
    return { error: 'Application deadline must be a valid date (YYYY-MM-DD).' };
  }
  if (!APPLICATION_SOURCES.includes(applicationSource as (typeof APPLICATION_SOURCES)[number])) {
    return { error: 'Invalid application source.' };
  }
  if (!APPLICATION_STATUSES.includes(status as (typeof APPLICATION_STATUSES)[number])) {
    return { error: 'Invalid application status.' };
  }

  const websiteCheck = validateSafeHttpUrl(body.companyWebsite, 'Company website');
  if (!websiteCheck.valid) {
    return { error: websiteCheck.error };
  }

  return {
    data: {
      companyName,
      companyWebsite: websiteCheck.normalized,
      companyLocation,
      industry,
      position,
      internshipType,
      employmentType,
      duration,
      stipend: Math.round(stipendRaw * 100) / 100,
      requiredSkills,
      applicationDate,
      deadline,
      applicationSource,
      status,
      jobDescription,
      notes,
      statusNotes,
    },
  };
}

router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.student!.id;
    const validation = validateInternshipInput(req.body ?? {});
    if ('error' in validation) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const d = validation.data;
    const now = new Date().toISOString();

    const insertTx = db.transaction(() => {
      const result = db
        .prepare(
          `INSERT INTO internships (
            studentId, companyName, companyWebsite, companyLocation, industry,
            position, internshipType, employmentType, duration, stipend,
            requiredSkills, applicationDate, deadline, applicationSource, status,
            jobDescription, notes, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          studentId,
          d.companyName,
          d.companyWebsite,
          d.companyLocation,
          d.industry,
          d.position,
          d.internshipType,
          d.employmentType,
          d.duration,
          d.stipend,
          d.requiredSkills,
          d.applicationDate,
          d.deadline,
          d.applicationSource,
          d.status,
          d.jobDescription,
          d.notes,
          now,
          now
        );

      const internshipId = Number(result.lastInsertRowid);
      db.prepare(
        `INSERT INTO application_history (internshipId, studentId, previousStatus, newStatus, changedAt, notes)
         VALUES (?, ?, NULL, ?, ?, ?)`
      ).run(
        internshipId,
        studentId,
        d.status,
        now,
        d.statusNotes || `Application recorded with status "${d.status}"`
      );

      return internshipId;
    });

    const internshipId = insertTx();
    const created = db
      .prepare('SELECT * FROM internships WHERE id = ? AND studentId = ?')
      .get(internshipId, studentId) as InternshipRow;

    res.status(201).json({
      message: 'Internship application added successfully.',
      internship: created,
    });
  } catch (err) {
    console.error('Create internship error:', err);
    res.status(500).json({ error: 'Failed to create internship application.' });
  }
});

router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.student!.id;
    const search = cleanString(req.query.search, 160);
    const status = cleanString(req.query.status, 40);
    const internshipType = cleanString(req.query.internshipType, 40);
    const location = cleanString(req.query.location, 120);
    const dateFrom = cleanString(req.query.dateFrom, 20);
    const dateTo = cleanString(req.query.dateTo, 20);
    const sortBy = cleanString(req.query.sortBy || 'newest', 30);
    const page = Math.max(1, Number.parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit || '10'), 10) || 10));

    const whereClauses: string[] = ['studentId = ?'];
    const params: unknown[] = [studentId];

    if (search) {
      whereClauses.push('(LOWER(companyName) LIKE ? OR LOWER(position) LIKE ? OR LOWER(requiredSkills) LIKE ?)');
      const pattern = `%${search.toLowerCase()}%`;
      params.push(pattern, pattern, pattern);
    }

    if (status && status !== 'All') {
      whereClauses.push('status = ?');
      params.push(status);
    }

    if (internshipType && internshipType !== 'All') {
      whereClauses.push('internshipType = ?');
      params.push(internshipType);
    }

    if (location) {
      whereClauses.push('LOWER(companyLocation) LIKE ?');
      params.push(`%${location.toLowerCase()}%`);
    }

    if (dateFrom && isValidDateString(dateFrom)) {
      whereClauses.push('applicationDate >= ?');
      params.push(dateFrom);
    }

    if (dateTo && isValidDateString(dateTo)) {
      whereClauses.push('applicationDate <= ?');
      params.push(dateTo);
    }

    let orderSql = 'applicationDate DESC, id DESC';
    switch (sortBy) {
      case 'oldest':
        orderSql = 'applicationDate ASC, id ASC';
        break;
      case 'company_asc':
        orderSql = 'LOWER(companyName) ASC, id DESC';
        break;
      case 'company_desc':
        orderSql = 'LOWER(companyName) DESC, id DESC';
        break;
      case 'deadline_asc':
        orderSql = "CASE WHEN deadline = '' THEN 1 ELSE 0 END ASC, deadline ASC, id DESC";
        break;
      case 'newest':
      default:
        orderSql = 'applicationDate DESC, id DESC';
        break;
    }

    const whereSql = whereClauses.join(' AND ');
    const countRow = db
      .prepare(`SELECT COUNT(*) as total FROM internships WHERE ${whereSql}`)
      .get(...params) as { total: number };

    const offset = (page - 1) * limit;
    const rows = db
      .prepare(`SELECT * FROM internships WHERE ${whereSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?`)
      .all(...params, limit, offset) as InternshipRow[];

    const locationsRows = db
      .prepare('SELECT DISTINCT companyLocation FROM internships WHERE studentId = ? ORDER BY companyLocation ASC')
      .all(studentId) as { companyLocation: string }[];

    res.json({
      internships: rows,
      pagination: {
        total: countRow.total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(countRow.total / limit)),
      },
      locations: locationsRows.map((r) => r.companyLocation),
    });
  } catch (err) {
    console.error('List internships error:', err);
    res.status(500).json({ error: 'Failed to load internship applications.' });
  }
});

router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid internship ID.' });
    return;
  }

  const studentId = req.student!.id;
  const internship = db
    .prepare('SELECT * FROM internships WHERE id = ? AND studentId = ?')
    .get(id, studentId) as InternshipRow | undefined;

  if (!internship) {
    res.status(404).json({ error: 'Internship application not found.' });
    return;
  }

  const history = db
    .prepare('SELECT * FROM application_history WHERE internshipId = ? AND studentId = ? ORDER BY changedAt DESC, id DESC')
    .all(id, studentId);

  const interviews = db
    .prepare('SELECT * FROM interviews WHERE internshipId = ? AND studentId = ? ORDER BY interviewDate ASC, interviewTime ASC')
    .all(id, studentId);

  res.json({ internship, history, interviews });
});

router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid internship ID.' });
      return;
    }

    const studentId = req.student!.id;
    const existing = db
      .prepare('SELECT * FROM internships WHERE id = ? AND studentId = ?')
      .get(id, studentId) as InternshipRow | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Internship application not found.' });
      return;
    }

    const validation = validateInternshipInput(req.body ?? {});
    if ('error' in validation) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const d = validation.data;
    const now = new Date().toISOString();

    const updateTx = db.transaction(() => {
      db.prepare(
        `UPDATE internships SET
          companyName = ?, companyWebsite = ?, companyLocation = ?, industry = ?,
          position = ?, internshipType = ?, employmentType = ?, duration = ?, stipend = ?,
          requiredSkills = ?, applicationDate = ?, deadline = ?, applicationSource = ?, status = ?,
          jobDescription = ?, notes = ?, updatedAt = ?
        WHERE id = ? AND studentId = ?`
      ).run(
        d.companyName,
        d.companyWebsite,
        d.companyLocation,
        d.industry,
        d.position,
        d.internshipType,
        d.employmentType,
        d.duration,
        d.stipend,
        d.requiredSkills,
        d.applicationDate,
        d.deadline,
        d.applicationSource,
        d.status,
        d.jobDescription,
        d.notes,
        now,
        id,
        studentId
      );

      if (existing.status !== d.status) {
        db.prepare(
          `INSERT INTO application_history (internshipId, studentId, previousStatus, newStatus, changedAt, notes)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(
          id,
          studentId,
          existing.status,
          d.status,
          now,
          d.statusNotes || `Status updated from "${existing.status}" to "${d.status}"`
        );
      }
    });

    updateTx();
    const updated = db
      .prepare('SELECT * FROM internships WHERE id = ? AND studentId = ?')
      .get(id, studentId) as InternshipRow;

    res.json({
      message: 'Internship application updated.',
      internship: updated,
    });
  } catch (err) {
    console.error('Update internship error:', err);
    res.status(500).json({ error: 'Failed to update internship application.' });
  }
});

router.patch('/:id/status', (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid internship ID.' });
      return;
    }

    const studentId = req.student!.id;
    const existing = db
      .prepare('SELECT * FROM internships WHERE id = ? AND studentId = ?')
      .get(id, studentId) as InternshipRow | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Internship application not found.' });
      return;
    }

    const status = cleanString(req.body?.status, 40);
    const notes = cleanString(req.body?.notes, 500);
    const changedAtRaw = cleanString(req.body?.changedAt, 30);

    if (!APPLICATION_STATUSES.includes(status as (typeof APPLICATION_STATUSES)[number])) {
      res.status(400).json({ error: 'Invalid application status.' });
      return;
    }

    let changedAt = new Date().toISOString();
    if (changedAtRaw && isValidDateString(changedAtRaw)) {
      changedAt = `${changedAtRaw}T12:00:00.000Z`;
    }

    const now = new Date().toISOString();
    const statusTx = db.transaction(() => {
      db.prepare('UPDATE internships SET status = ?, updatedAt = ? WHERE id = ? AND studentId = ?').run(
        status,
        now,
        id,
        studentId
      );

      if (existing.status !== status || notes) {
        db.prepare(
          `INSERT INTO application_history (internshipId, studentId, previousStatus, newStatus, changedAt, notes)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(
          id,
          studentId,
          existing.status,
          status,
          changedAt,
          notes || `Status updated from "${existing.status}" to "${status}"`
        );
      }
    });

    statusTx();
    const updated = db
      .prepare('SELECT * FROM internships WHERE id = ? AND studentId = ?')
      .get(id, studentId) as InternshipRow;

    const history = db
      .prepare('SELECT * FROM application_history WHERE internshipId = ? AND studentId = ? ORDER BY changedAt DESC, id DESC')
      .all(id, studentId);

    res.json({
      message: 'Application status updated.',
      internship: updated,
      history,
    });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid internship ID.' });
    return;
  }

  const studentId = req.student!.id;
  const result = db.prepare('DELETE FROM internships WHERE id = ? AND studentId = ?').run(id, studentId);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Internship application not found.' });
    return;
  }

  res.json({ message: 'Internship application deleted.' });
});

router.get('/:id/history', (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid internship ID.' });
    return;
  }

  const studentId = req.student!.id;
  const internship = db
    .prepare('SELECT id FROM internships WHERE id = ? AND studentId = ?')
    .get(id, studentId);

  if (!internship) {
    res.status(404).json({ error: 'Internship application not found.' });
    return;
  }

  const history = db
    .prepare('SELECT * FROM application_history WHERE internshipId = ? AND studentId = ? ORDER BY changedAt DESC, id DESC')
    .all(id, studentId);

  res.json({ history });
});

export default router;
