import { Router, type Response } from 'express';
import db from '../db.ts';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.ts';
import { APPLICATION_STATUSES, cleanString } from '../utils/validation.ts';

const router = Router();
router.use(requireAuth, requireRole(['admin']));

interface AdminApplicationRow {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  rollNumber: string;
  department: string;
  degree: string;
  college: string;
  companyName: string;
  companyLocation: string;
  position: string;
  internshipType: string;
  stipend: number;
  applicationDate: string;
  deadline: string;
  applicationSource: string;
  status: string;
}

router.get('/applications', (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = cleanString(req.query.status, 40);
    const search = cleanString(req.query.search, 160);

    const whereClauses: string[] = [];
    const params: unknown[] = [];

    if (status && status !== 'All') {
      if (!APPLICATION_STATUSES.includes(status as (typeof APPLICATION_STATUSES)[number])) {
        res.status(400).json({ error: 'Invalid status filter.' });
        return;
      }
      whereClauses.push('i.status = ?');
      params.push(status);
    }

    if (search) {
      const pattern = `%${search.toLowerCase()}%`;
      whereClauses.push(
        '(LOWER(s.fullName) LIKE ? OR LOWER(s.rollNumber) LIKE ? OR LOWER(i.companyName) LIKE ? OR LOWER(i.position) LIKE ?)'
      );
      params.push(pattern, pattern, pattern, pattern);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const applications = db
      .prepare(
        `SELECT
           i.id,
           i.studentId,
           s.fullName AS studentName,
           s.email AS studentEmail,
           s.rollNumber,
           s.department,
           s.degree,
           s.college,
           i.companyName,
           i.companyLocation,
           i.position,
           i.internshipType,
           i.stipend,
           i.applicationDate,
           i.deadline,
           i.applicationSource,
           i.status
         FROM internships i
         JOIN students s ON i.studentId = s.id
         ${whereSql}
         ORDER BY i.applicationDate DESC, i.id DESC`
      )
      .all(...params) as AdminApplicationRow[];

    res.json({
      applications,
      total: applications.length,
    });
  } catch (err) {
    console.error('Admin applications fetch error:', err);
    res.status(500).json({ error: 'Failed to load student applications.' });
  }
});

export default router;
