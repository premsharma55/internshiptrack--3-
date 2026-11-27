export const APPLICATION_STATUSES = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Selected',
  'Rejected',
  'Withdrawn',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const INTERNSHIP_TYPES = ['Remote', 'On-site', 'Hybrid'] as const;
export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time'] as const;
export const APPLICATION_SOURCES = [
  'LinkedIn',
  'Company Website',
  'Referral',
  'College Placement',
  'Other',
] as const;

export const INTERVIEW_MODES = ['Online', 'Offline'] as const;
export const INTERVIEW_STATUSES = ['Scheduled', 'Completed', 'Cancelled'] as const;

export function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed) && trimmed.length <= 254;
}

export function validatePasswordStrength(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number.';
  }
  return null;
}

export function isValidDateString(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isValidOptionalDate(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  return isValidDateString(value);
}

export function validateSafeHttpUrl(value: unknown, fieldName: string): { valid: boolean; normalized: string; error?: string } {
  if (value === undefined || value === null || String(value).trim() === '') {
    return { valid: true, normalized: '' };
  }
  const raw = String(value).trim();
  const candidate = /^https?:\/\//i.test(raw) ? raw : raw.includes('.') && !raw.includes(':') ? `https://${raw}` : raw;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, normalized: '', error: `${fieldName} must use http:// or https://.` };
    }
    return { valid: true, normalized: parsed.toString() };
  } catch {
    return { valid: false, normalized: '', error: `${fieldName} must be a valid web URL.` };
  }
}

export function cleanString(value: unknown, maxLength = 2000): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}
