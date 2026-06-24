// Mirrors the server rule in routes/entries.js: admins can edit every area,
// other users only the areas assigned to them.
export function canEditArea(user, area) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return (user.assignedAreas || []).includes(area);
}
