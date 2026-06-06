export const initialNetworks = [
  {
    id: 1,
    name: 'Production VM Network',
    description: 'Main network for production workloads',
    provider: 'Proxmox DC1',
    node: 'pve01',
    providerNetwork: 'vmbr0',
    cidr: '192.168.10.0/24',
    environment: ['Production'],
    tiers: ['Gold', 'Silver'],
    status: 'Active',
    lastUpdated: '24 Oct 2023, 14:30',
    activeVMs: 42
  },
  {
    id: 2,
    name: 'Development Network',
    description: 'Isolated network for dev environments',
    provider: 'Proxmox DC1',
    node: 'pve01',
    providerNetwork: 'vmbr1',
    cidr: '10.0.0.0/24',
    environment: ['Development', 'Testing'],
    tiers: ['Bronze'],
    status: 'Active',
    lastUpdated: '24 Oct 2023, 10:15',
    activeVMs: 15
  },
  {
    id: 3,
    name: 'Staging DMZ',
    description: 'Externally facing staging network',
    provider: 'Proxmox DC1',
    node: 'pve02',
    providerNetwork: 'vmbr3',
    cidr: '172.16.5.0/24',
    environment: ['Staging'],
    tiers: ['Silver'],
    status: 'Disabled',
    lastUpdated: '23 Oct 2023, 16:45',
    activeVMs: 0
  },
  {
    id: 4,
    name: 'Legacy App Network',
    description: 'Network for retiring applications',
    provider: 'Proxmox LAB',
    node: 'pve-lab1',
    providerNetwork: 'vmbr0',
    cidr: '192.168.100.0/24',
    environment: ['Production'],
    tiers: ['Bronze'],
    status: 'Offline / Missing',
    missingReason: 'Provider offline',
    lastUpdated: '20 Oct 2023, 09:00',
    activeVMs: 5
  }
];
