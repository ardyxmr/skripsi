export const initialEnvironments = [
  {
    id: 1,
    name: 'Development',
    description: 'Sandbox for active feature development and testing.',
    type: 'Default',
    expiryType: 'days',
    expiryValue: 30,
    approvalRequired: false,
    status: 'Active',
    lastUpdated: '10 Jun 2026 10:00'
  },
  {
    id: 2,
    name: 'Staging',
    description: 'Pre-production environment replicating production constraints.',
    type: 'Default',
    expiryType: 'days',
    expiryValue: 60,
    approvalRequired: true,
    status: 'Active',
    lastUpdated: '12 Jun 2026 14:30'
  },
  {
    id: 3,
    name: 'Production',
    description: 'Live production environment with strict SLAs and approvals.',
    type: 'Default',
    expiryType: 'lifetime',
    expiryValue: null,
    approvalRequired: true,
    status: 'Active',
    lastUpdated: '15 Jun 2026 09:00'
  },
  {
    id: 4,
    name: 'Sandbox',
    description: 'Temporary sandbox for training and experiments.',
    type: 'Custom',
    expiryType: 'hours',
    expiryValue: 48,
    approvalRequired: false,
    status: 'Active',
    lastUpdated: '20 Jun 2026 11:15'
  },
  {
    id: 5,
    name: 'UAT',
    description: 'User Acceptance Testing environment.',
    type: 'Custom',
    expiryType: 'days',
    expiryValue: 14,
    approvalRequired: true,
    status: 'Inactive',
    lastUpdated: '22 Jun 2026 16:45'
  }
];
