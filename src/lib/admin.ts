/**
 * Utility functions for admin authentication
 */

export function getAdminEmails(): string[] {
  const adminEmails = process.env.ADMIN_EMAILS || '';
  return adminEmails.split(',').map(email => email.trim()).filter(email => email.length > 0);
}

export function isAdminEmail(email: string): boolean {
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email);
}

export function getAdminEmailsForClient(): string[] {
  // For client-side use, we need to expose this via NEXT_PUBLIC_
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  const emails = adminEmails.split(',').map(email => email.trim()).filter(email => email.length > 0);
  
  // Fallback for when environment variable is not available
  if (emails.length === 0) {
    return ['devwithandrei@gmail.com'];
  }
  
  return emails;
} 