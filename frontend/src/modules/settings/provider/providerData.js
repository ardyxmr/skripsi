export const initialProviders = [
  { 
    id: 1, name: 'Proxmox DC1', type: 'Proxmox', cluster: 'Production', endpoint: 'pve01.company.local', 
    nodes: 4, templates: 12, networks: 3, datastores: 5, connectionStatus: 'Connected', discoveryStatus: 'Success', lastDiscovery: '2 minutes ago', nextDiscovery: '20 Jun 2026 11:00', discoveryResult: ['✓ Nodes Synced: 4', '✓ Templates Synced: 12', '✓ Networks Synced: 3', '✓ Datastores Synced: 5'], lastSync: '2 minutes ago', 
    lastTested: '2 minutes ago', createdAt: '2023-01-15', description: 'Main Production Datacenter',
    username: 'api-user', tokenId: 'provisioner', secret: 'secret-token-123',
    syncInterval: '30 Minutes', autoSync: true, node: 'pve'
  },
  { 
    id: 2, name: 'Proxmox LAB', type: 'Proxmox', cluster: 'Development', endpoint: 'pvelab.company.local', 
    nodes: 2, templates: 4, networks: 2, datastores: 2, connectionStatus: 'Disconnected', discoveryStatus: 'Failed', lastDiscovery: '3 hours ago', nextDiscovery: '20 Jun 2026 11:30', discoveryResult: ['✓ Nodes Synced: 2', '⚠ Templates Failed', '⚠ Networks Failed', '✓ Datastores Synced: 2'], lastSync: '3 hours ago', 
    lastTested: 'Never', createdAt: '2023-05-10', description: 'Development Lab Environment',
    username: 'dev-user', tokenId: 'lab-provisioner', secret: 'lab-secret-123',
    syncInterval: 'Manual', autoSync: false, node: 'pve-node02'
  }
];

export const mockDiscoveredNodes = [
  { name: 'pve01', status: 'Online', cpu: '12%', memory: '32 GB / 128 GB' },
  { name: 'pve02', status: 'Online', cpu: '8%', memory: '24 GB / 128 GB' },
  { name: 'pve03', status: 'Offline', cpu: 'N/A', memory: 'N/A' },
  { name: 'pve04', status: 'Online', cpu: '45%', memory: '64 GB / 128 GB' }
];

export const mockDiscoveredTemplates = [
  { name: 'ubuntu-22-template', node: 'pve01', status: 'Available' },
  { name: 'rocky-9-template', node: 'pve01', status: 'Available' },
  { name: 'windows-2022-template', node: 'pve02', status: 'Available' },
  { name: 'debian-11-template', node: 'pve03', status: 'Unavailable' }
];

export const mockDiscoveredNetworks = [
  { name: 'VM-NET-PROD', providerNetwork: 'vmbr0', cidr: '192.168.10.0/24', status: 'Available' },
  { name: 'VM-NET-DEV', providerNetwork: 'vmbr1', cidr: '192.168.20.0/24', status: 'Available' },
  { name: 'VM-NET-TEST', providerNetwork: 'vmbr2', cidr: '192.168.30.0/24', status: 'Disabled' }
];

export const mockDiscoveredDatastores = [
  { name: 'local-lvm', type: 'LVM', capacity: '2 TB', usage: '55%', status: 'Available' },
  { name: 'ceph-ssd', type: 'Ceph', capacity: '10 TB', usage: '32%', status: 'Available' },
  { name: 'tank-zfs', type: 'ZFS', capacity: '15 TB', usage: '45%', status: 'Available' },
  { name: 'backup-nfs', type: 'NFS', capacity: '20 TB', usage: '70%', status: 'Warning' },
  { name: 'archive-hdd', type: 'NFS', capacity: '50 TB', usage: '98%', status: 'Critical' }
];
