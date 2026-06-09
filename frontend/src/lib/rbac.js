export const ROLES = { ADMIN: 'Administrator', MANAGER: 'Manager', USER: 'User' };

export const isAdmin = (u) => u?.role === ROLES.ADMIN;
export const isManager = (u) => u?.role === ROLES.MANAGER || isAdmin(u);
export const canApprove = isManager;
export const canManageSettings = isAdmin;
