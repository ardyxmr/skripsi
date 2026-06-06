export const initialCatalogs = [
  {
    id: 1, name: 'Ubuntu Production', description: 'Standard Ubuntu 22.04 LTS for Prod',
    provider: 'Proxmox DC1', node: 'pve01', template: 'ubuntu-22-template', environments: ['Production', 'Development'],
    tiers: ['Bronze', 'Silver'], status: 'Active', lastUpdated: '20 Jun 2026 10:30',
    discoveryStatus: 'Success', lastSync: '10 mins ago', connectivity: 'Connected', origin: 'Proxmox', activeVMs: 24, totalRequests: 156
  },
  {
    id: 2, name: 'Windows Standard', description: 'Windows Server 2022',
    provider: 'Proxmox DC1', node: 'pve02', template: 'win-2022-template', environments: ['Production'],
    tiers: ['Gold'], status: 'Active', lastUpdated: '18 Jun 2026 09:15',
    discoveryStatus: 'Success', lastSync: '2 hours ago', connectivity: 'Connected', origin: 'Proxmox', activeVMs: 8, totalRequests: 42
  },
  {
    id: 3, name: 'Rocky Linux Base', description: 'Rocky 9 for Dev',
    provider: 'Proxmox LAB', node: 'pve01', template: 'rocky-9-template', environments: ['Development'],
    tiers: ['Bronze'], status: 'Offline / Missing', missingReason: 'Provider Disconnected', lastUpdated: '15 Jun 2026 14:20',
    discoveryStatus: 'Failed', lastSync: '1 day ago', connectivity: 'Disconnected', origin: 'Proxmox', activeVMs: 0, totalRequests: 12
  }
];
