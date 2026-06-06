export const initialDatastores = [
  {
    id: 1, name: 'VM-STORAGE-PROD', description: 'Production NVMe Storage',
    provider: 'Proxmox DC1', node: 'pve01', providerDatastore: 'local-lvm', type: 'LVM-Thin',
    capacity: { total: '2 TB', used: '1.2 TB', available: '800 GB', percentage: 60 },
    environment: ['Production'], tiers: ['Gold'],
    status: 'Active', lastUpdated: '24 Jun 2026 10:05', activeVMs: 42
  },
  {
    id: 2, name: 'VM-STORAGE-DEV', description: 'Development Storage',
    provider: 'Proxmox LAB', node: 'pve02', providerDatastore: 'local-zfs', type: 'ZFS',
    capacity: { total: '4 TB', used: '1.5 TB', available: '2.5 TB', percentage: 37.5 },
    environment: ['Development', 'Testing'], tiers: ['Silver', 'Bronze'],
    status: 'Disabled', lastUpdated: '20 Jun 2026 11:30', activeVMs: 0
  },
  {
    id: 3, name: 'VM-STORAGE-ISOLATED', description: 'Testing isolated datastore',
    provider: 'Proxmox LAB', node: 'pve03', providerDatastore: 'nfs-backup', type: 'NFS',
    capacity: { total: '10 TB', used: '8 TB', available: '2 TB', percentage: 80 },
    environment: ['Testing'], tiers: ['Bronze'],
    status: 'Offline / Missing', missingReason: 'Provider Disconnected', lastUpdated: '10 Jun 2026 15:45', activeVMs: 0
  },
  {
    id: 4, name: 'VM-STORAGE-BACKUP', description: 'Critical Backup Storage',
    provider: 'Proxmox DC1', node: 'pve02', providerDatastore: 'ceph-pool', type: 'CephFS',
    capacity: { total: '2 TB', used: '1.95 TB', available: '50 GB', percentage: 97.5 },
    environment: ['Production'], tiers: ['Gold'],
    status: 'Low Capacity', missingReason: 'Capacity Threshold Reached', lastUpdated: '25 Jun 2026 09:15', activeVMs: 15
  }
];
