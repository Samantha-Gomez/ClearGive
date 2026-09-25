export function getDashboardPath(role) {
  return role ? `/${role}` : '/login'
}

export const roleLabels = {
  donor: 'Donor',
  partner: 'Partner',
  admin: 'Administrator',
}