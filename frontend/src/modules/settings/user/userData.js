export const initialRoles = [
  { id: 1, name: 'Admin', description: 'Full access to all features', createdAt: '2023-01-15', userCount: 1, status: 'Active', permissions: ['Provision VM', 'Inventory', 'Approval', 'Settings'] },
  { id: 2, name: 'Manager', description: 'Can approve provisioning requests', createdAt: '2023-02-20', userCount: 3, status: 'Active', permissions: ['Provision VM', 'Inventory', 'Approval'] },
  { id: 3, name: 'User', description: 'Standard user access', createdAt: '2023-03-10', userCount: 12, status: 'Active', permissions: ['Inventory'] }
];

export const initialGroups = [
  { id: 1, name: 'RTGS Team', room: 'Floor 15', managerId: 2, description: 'RTGS Operations Team', createdAt: '2023-01-20', memberCount: 5 },
  { id: 2, name: 'Network Admin', room: 'Floor 12', managerId: 1, description: 'Network Management', createdAt: '2023-02-05', memberCount: 2 }
];

export const initialUsers = [
  { id: 1, name: 'Admin User', email: 'admin@co.com', roleId: 1, groupId: 2, status: 'Active', lastLogin: '2026-05-30', createdAt: '2023-01-15' },
  { id: 2, name: 'John Doe', email: 'john@co.com', roleId: 2, groupId: 1, status: 'Active', lastLogin: '2026-05-28', createdAt: '2023-02-21' },
  { id: 3, name: 'Alice Chen', email: 'alice@co.com', roleId: 3, groupId: 1, status: 'Disabled', lastLogin: '2026-05-01', createdAt: '2023-03-12' }
];