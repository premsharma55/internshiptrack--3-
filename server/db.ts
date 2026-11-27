import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const uploadsBaseDir = path.resolve(process.cwd(), 'uploads');
export const resumesDir = path.resolve(uploadsBaseDir, 'resumes');
export const photosDir = path.resolve(uploadsBaseDir, 'photos');

for (const dir of [uploadsBaseDir, resumesDir, photosDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const dbPath = path.resolve(dataDir, 'internships.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    phone TEXT NOT NULL DEFAULT '',
    dob TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    profilePhoto TEXT NOT NULL DEFAULT '',
    college TEXT NOT NULL,
    degree TEXT NOT NULL,
    department TEXT NOT NULL,
    rollNumber TEXT NOT NULL,
    currentSemester TEXT NOT NULL DEFAULT '',
    graduationYear INTEGER NOT NULL,
    cgpa TEXT NOT NULL DEFAULT '',
    skills TEXT NOT NULL DEFAULT '',
    programmingLanguages TEXT NOT NULL DEFAULT '',
    projects TEXT NOT NULL DEFAULT '',
    certifications TEXT NOT NULL DEFAULT '',
    linkedinUrl TEXT NOT NULL DEFAULT '',
    githubUrl TEXT NOT NULL DEFAULT '',
    portfolioUrl TEXT NOT NULL DEFAULT '',
    resumeFileName TEXT NOT NULL DEFAULT '',
    resumeStoredName TEXT NOT NULL DEFAULT '',
    resumeSize INTEGER NOT NULL DEFAULT 0,
    resumeUploadedAt TEXT NOT NULL DEFAULT '',
    deadlineAlertDays INTEGER NOT NULL DEFAULT 3,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS internships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    companyName TEXT NOT NULL,
    companyWebsite TEXT NOT NULL DEFAULT '',
    companyLocation TEXT NOT NULL,
    industry TEXT NOT NULL DEFAULT '',
    position TEXT NOT NULL,
    internshipType TEXT NOT NULL CHECK(internshipType IN ('Remote', 'On-site', 'Hybrid')),
    employmentType TEXT NOT NULL DEFAULT 'Full-time' CHECK(employmentType IN ('Full-time', 'Part-time')),
    duration TEXT NOT NULL DEFAULT '',
    stipend REAL NOT NULL DEFAULT 0 CHECK(stipend >= 0),
    requiredSkills TEXT NOT NULL DEFAULT '',
    applicationDate TEXT NOT NULL,
    deadline TEXT NOT NULL DEFAULT '',
    applicationSource TEXT NOT NULL DEFAULT 'LinkedIn',
    status TEXT NOT NULL DEFAULT 'Applied' CHECK(status IN ('Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected', 'Withdrawn')),
    jobDescription TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS interviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    internshipId INTEGER NOT NULL,
    interviewDate TEXT NOT NULL,
    interviewTime TEXT NOT NULL,
    interviewMode TEXT NOT NULL CHECK(interviewMode IN ('Online', 'Offline')),
    meetingLink TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    interviewRound TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Scheduled' CHECK(status IN ('Scheduled', 'Completed', 'Cancelled')),
    notes TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (internshipId) REFERENCES internships(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS application_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    internshipId INTEGER NOT NULL,
    studentId INTEGER NOT NULL,
    previousStatus TEXT,
    newStatus TEXT NOT NULL,
    changedAt TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (internshipId) REFERENCES internships(id) ON DELETE CASCADE,
    FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_internships_studentId ON internships(studentId);
  CREATE INDEX IF NOT EXISTS idx_internships_status ON internships(studentId, status);
  CREATE INDEX IF NOT EXISTS idx_internships_deadline ON internships(studentId, deadline);
  CREATE INDEX IF NOT EXISTS idx_interviews_studentId ON interviews(studentId);
  CREATE INDEX IF NOT EXISTS idx_interviews_internshipId ON interviews(internshipId);
  CREATE INDEX IF NOT EXISTS idx_history_internshipId ON application_history(internshipId);
`);

export interface StudentRow {
  id: number;
  fullName: string;
  email: string;
  passwordHash: string;
  role: string;
  phone: string;
  dob: string;
  address: string;
  profilePhoto: string;
  college: string;
  degree: string;
  department: string;
  rollNumber: string;
  currentSemester: string;
  graduationYear: number;
  cgpa: string;
  skills: string;
  programmingLanguages: string;
  projects: string;
  certifications: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  resumeFileName: string;
  resumeStoredName: string;
  resumeSize: number;
  resumeUploadedAt: string;
  deadlineAlertDays: number;
  createdAt: string;
  updatedAt: string;
}

export function sanitizeStudent(row: StudentRow) {
  const { passwordHash: _removed, ...safe } = row;
  return {
    ...safe,
    profileCompletion: calculateProfileCompletion(row),
  };
}

export function calculateProfileCompletion(row: StudentRow): number {
  const checks = [
    Boolean(row.fullName.trim()),
    Boolean(row.email.trim()),
    Boolean(row.phone.trim()),
    Boolean(row.address.trim()),
    Boolean(row.college.trim()),
    Boolean(row.degree.trim()),
    Boolean(row.department.trim()),
    Boolean(row.rollNumber.trim()),
    Boolean(row.currentSemester.trim()),
    Boolean(row.graduationYear),
    Boolean(row.cgpa.trim()),
    Boolean(row.skills.trim()),
    Boolean(row.programmingLanguages.trim()),
    Boolean(row.projects.trim()),
    Boolean(row.linkedinUrl.trim() || row.githubUrl.trim() || row.portfolioUrl.trim()),
    Boolean(row.resumeStoredName.trim()),
  ];
  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

export default db;
