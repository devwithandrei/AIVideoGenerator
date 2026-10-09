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

/**
 * Evaluates admin access from a Clerk session shape.
 * Rule order:
 *  1. role === 'admin' on user.publicMetadata (authoritative)
 *  2. email ∈ ADMIN_EMAILS (process.env.ADMIN_EMAILS comma-separated)
 *  3. primaryEmail === 'devwithandrei@gmail.com' (break-glass fallback)
 * Returns: { ok, adminEmail, reason }
 */
export function evaluateAdminAccess(input: {
  publicMetadataRole?: any;
  primaryEmail?: string;
  sessionClaimsRole?: any;
  sessionClaimsEmail?: string;
}): { ok: boolean; adminEmail: string; reason: string } {
  const primaryEmail = (input.primaryEmail || input.sessionClaimsEmail || '').trim().toLowerCase();
  const role = input.publicMetadataRole ?? input.sessionClaimsRole;

  if (role && String(role).toLowerCase() === 'admin') {
    return { ok: true, adminEmail: primaryEmail, reason: 'publicMetadata/sessionClaims role === admin' };
  }
  if (primaryEmail) {
    const envEmails = getAdminEmails().map((s) => s.trim().toLowerCase());
    if (envEmails.includes(primaryEmail)) {
      return { ok: true, adminEmail: primaryEmail, reason: `email listed in ADMIN_EMAILS` };
    }
    if (primaryEmail === 'devwithandrei@gmail.com') {
      return { ok: true, adminEmail: primaryEmail, reason: `break-glass developer email` };
    }
  }
  return { ok: false, adminEmail: primaryEmail, reason: `role not admin & email not in ADMIN_EMAILS list (primaryEmail=${primaryEmail || 'none'})` };
}