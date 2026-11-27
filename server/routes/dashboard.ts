import { Router, type Response } from 'express';
import db from '../db.ts';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.ts';
import { APPLICATION_STATUSES } from '../utils/validation.ts';

const router = Router();
router.use(requireAuth, requireRole(['student', 'admin']));

function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDaysIsoDate(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() + days);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

router.get('/stats', (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.student!.id;
    const alertDays = req.student!.deadlineAlertDays || 3;
    const today = todayIsoDate();
    const soonDate = addDaysIsoDate(alertDays);

    const statusRows = db
      .prepare('SELECT status, COUNT(*) as count FROM internships WHERE studentId = ? GROUP BY status')
      .all(studentId) as { status: string; count: number }[];

    const counts: Record<string, number> = {};
    for (const s of APPLICATION_STATUSES) {
      counts[s] = 0;
    }
    let total = 0;
    for (const row of statusRows) {
      counts[row.status] = row.count;
      total += row.count;
    }

    const statusBreakdown = APPLICATION_STATUSES.map((status) => ({
      status,
      count: counts[status] ?? 0,
    }));

    const monthlyTrend = db
      .prepare(
        `SELECT substr(applicationDate, 1, 7) as month, COUNT(*) as count
         FROM internships
         WHERE studentId = ?
         GROUP BY substr(applicationDate, 1, 7)
         ORDER BY month ASC
         LIMIT 12`
      )
      .all(studentId) as { month: string; count: number }[];

    const upcomingInterviews = db
      .prepare(
        `SELECT i.*, app.companyName, app.position
         FROM interviews i
         JOIN internships app ON i.internshipId = app.id
         WHERE i.studentId = ? AND i.status = 'Scheduled' AND i.interviewDate >= ?
         ORDER BY i.interviewDate ASC, i.interviewTime ASC
         LIMIT 5`
      )
      .all(studentId, today);

    const approachingDeadlines = db
      .prepare(
        `SELECT id, companyName, position, deadline, status
         FROM internships
         WHERE studentId = ?
           AND deadline != ''
           AND deadline >= ?
           AND deadline <= ?
           AND status NOT IN ('Selected', 'Rejected', 'Withdrawn')
         ORDER BY deadline ASC
         LIMIT 5`
      )
      .all(studentId, today, soonDate);

    const expiredDeadlines = db
      .prepare(
        `SELECT id, companyName, position, deadline, status
         FROM internships
         WHERE studentId = ?
           AND deadline != ''
           AND deadline < ?
           AND status NOT IN ('Selected', 'Rejected', 'Withdrawn')
         ORDER BY deadline DESC
         LIMIT 5`
      )
      .all(studentId, today);

    const recentActivities = db
      .prepare(
        `SELECT h.id, h.internshipId, h.previousStatus, h.newStatus, h.changedAt, h.notes,
                app.companyName, app.position
         FROM application_history h
         JOIN internships app ON h.internshipId = app.id
         WHERE h.studentId = ?
         ORDER BY h.changedAt DESC, h.id DESC
         LIMIT 8`
      )
      .all(studentId);

    res.json({
      stats: {
        total,
        applied: counts['Applied'],
        underReview: counts['Under Review'],
        shortlisted: counts['Shortlisted'],
        interviewScheduled: counts['Interview Scheduled'],
        selected: counts['Selected'],
        rejected: counts['Rejected'],
        withdrawn: counts['Withdrawn'],
      },
      statusBreakdown,
      monthlyTrend,
      upcomingInterviews,
      approachingDeadlines,
      expiredDeadlines,
      recentActivities,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to load dashboard statistics.' });
  }
});

router.get('/recent-applications', (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.student!.id;
    const rows = db
      .prepare(
        `SELECT * FROM internships
         WHERE studentId = ?
         ORDER BY applicationDate DESC, id DESC
         LIMIT 6`
      )
      .all(studentId);

    res.json({ applications: rows });
  } catch (err) {
    console.error('Recent applications error:', err);
    res.status(500).json({ error: 'Failed to load recent applications.' });
  }
});

router.get('/notifications', (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.student!.id;
    const alertDays = req.student!.deadlineAlertDays || 3;
    const today = todayIsoDate();
    const soonDate = addDaysIsoDate(alertDays);
    const interviewWindow = addDaysIsoDate(7);

    const interviews = db
      .prepare(
        `SELECT i.id, i.internshipId, i.interviewDate, i.interviewTime, i.interviewRound, i.interviewMode,
                app.companyName, app.position
         FROM interviews i
         JOIN internships app ON i.internshipId = app.id
         WHERE i.studentId = ? AND i.status = 'Scheduled'
           AND i.interviewDate >= ? AND i.interviewDate <= ?
         ORDER BY i.interviewDate ASC, i.interviewTime ASC`
      )
      .all(studentId, today, interviewWindow) as Array<{
      id: number;
      internshipId: number;
      interviewDate: string;
      interviewTime: string;
      interviewRound: string;
      interviewMode: string;
      companyName: string;
      position: string;
    }>;

    const approaching = db
      .prepare(
        `SELECT id, companyName, position, deadline, status
         FROM internships
         WHERE studentId = ? AND deadline != '' AND deadline >= ? AND deadline <= ?
           AND status NOT IN ('Selected', 'Rejected', 'Withdrawn')
         ORDER BY deadline ASC`
      )
      .all(studentId, today, soonDate) as Array<{
      id: number;
      companyName: string;
      position: string;
      deadline: string;
      status: string;
    }>;

    const expired = db
      .prepare(
        `SELECT id, companyName, position, deadline, status
         FROM internships
         WHERE studentId = ? AND deadline != '' AND deadline < ?
           AND status NOT IN ('Selected', 'Rejected', 'Withdrawn')
         ORDER BY deadline DESC`
      )
      .all(studentId, today) as Array<{
      id: number;
      companyName: string;
      position: string;
      deadline: string;
      status: string;
    }>;

    const items = [
      ...interviews.map((iv) => ({
        id: `interview-${iv.id}`,
        type: 'interview' as const,
        title: `${iv.companyName} — ${iv.interviewRound}`,
        subtitle: `${iv.position} · ${iv.interviewDate} at ${iv.interviewTime} (${iv.interviewMode})`,
        date: iv.interviewDate,
        link: '/interviews',
      })),
      ...approaching.map((app) => ({
        id: `deadline-${app.id}`,
        type: 'deadline' as const,
        title: `Deadline approaching: ${app.companyName}`,
        subtitle: `${app.position} · Due ${app.deadline}`,
        date: app.deadline,
        link: `/applications/${app.id}`,
      })),
      ...expired.map((app) => ({
        id: `expired-${app.id}`,
        type: 'expired' as const,
        title: `Deadline passed: ${app.companyName}`,
        subtitle: `${app.position} · Expired ${app.deadline}`,
        date: app.deadline,
        link: `/applications/${app.id}`,
      })),
    ];

    res.json({ notifications: items });
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ error: 'Failed to load reminders.' });
  }
});

export default router;
