// Role-based password rules, enforced wherever a password is set (change
// password, admin create/edit user). Admins may use a short numeric PIN;
// every other role needs a full-length password.
export function passwordPolicyError(role, password) {
  const pw = String(password ?? '');
  if (role === 'admin') {
    if (/^\d{4}$/.test(pw) || /^\d{6}$/.test(pw) || pw.length >= 8) return null;
    return 'Admin password must be a 4-digit PIN, a 6-digit PIN, or at least 8 characters';
  }
  if (pw.length >= 8) return null;
  return 'Password must be at least 8 characters';
}
