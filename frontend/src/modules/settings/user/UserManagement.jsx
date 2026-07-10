import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, Shield, Users, User, Search, Plus, Edit2, Trash2, X, AlertTriangle, Loader2, MoreVertical, RefreshCw } from 'lucide-react';
import TableActionMenu from '../../../components/common/TableActionMenu';
import DataTable from '../../../components/common/DataTable';
import { useDebouncedValue } from '../../../lib/useDebouncedValue';
import { useUserContext } from '../../../contexts/UserContext';
import UserForm from './UserForm';
import RoleForm from './RoleForm';
import GroupForm from './GroupForm';
import UserActionModal from './UserActionModal';
import { useUI } from '../../../stores/uiStore';

export default function UserManagement() {
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef(null);

  const {
    roles, groups, users,
    createUser, updateUser, deleteUser,
    createRole, updateRole, deleteRole,
    createGroup, updateGroup, deleteGroup,
  } = useUserContext();
  const pushToast = useUI((s) => s.pushToast);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All Roles');
  const [userGroupFilter, setUserGroupFilter] = useState('All Groups');
  const [userStatusFilter, setUserStatusFilter] = useState('All Status');
  const [isRefreshingUser, setIsRefreshingUser] = useState(false);

  const [modal, setModal] = useState({ isOpen: false, type: null, mode: 'add', data: null });
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, data: null, isWarning: false, assignedUsers: [] });

  const getRoleName = (id) => roles.find(r => r.id === id)?.name || 'Unknown';
  const getGroupName = (id) => groups.find(g => g.id === id)?.name || 'Unknown';

  const debouncedUserSearch = useDebouncedValue(userSearch, 250);
  // Filter only — the shared <DataTable> owns sorting + pagination internally.
  const filteredUsers = useMemo(() => {
    let filtered = users.filter(u => !u.deletedAt);
    if (debouncedUserSearch) {
      const q = debouncedUserSearch.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    if (userRoleFilter !== 'All Roles') {
      filtered = filtered.filter(u => getRoleName(u.roleId) === userRoleFilter);
    }
    if (userGroupFilter !== 'All Groups') {
      filtered = filtered.filter(u => getGroupName(u.groupId) === userGroupFilter);
    }
    if (userStatusFilter !== 'All Status') {
      filtered = filtered.filter(u => u.status === userStatusFilter);
    }
    return filtered;
  }, [users, debouncedUserSearch, userRoleFilter, userGroupFilter, userStatusFilter, roles, groups]);

  const openModal = (type, mode, data = null) => {
    setModal({ isOpen: true, type, mode, data });
    setHasUnsavedChanges(false);
  };

  const closeModal = (force = false) => {
    if (hasUnsavedChanges && !force) {
      setShowUnsavedWarning(true);
    } else {
      setModal({ isOpen: false, type: null, mode: 'add', data: null });
      setShowUnsavedWarning(false);
      setHasUnsavedChanges(false);
    }
  };

  const confirmCloseModal = () => {
    closeModal(true);
  };

  // Esc closes the warning first if it's up, otherwise the open form (through the guard).
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (showUnsavedWarning) setShowUnsavedWarning(false);
      else if (modal.isOpen) closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showUnsavedWarning, modal.isOpen, hasUnsavedChanges]);





  const handleDeleteClick = (type, data) => {
    if (type === 'role') {
      const assigned = users.filter(u => u.roleId === data.id && !u.deletedAt);
      if (assigned.length > 0) {
        setDeleteModal({ isOpen: true, type, data, isWarning: true, assignedUsers: assigned });
        return;
      }
    }
    if (type === 'group') {
      const assigned = users.filter(u => u.groupId === data.id && !u.deletedAt);
      if (assigned.length > 0) {
        setDeleteModal({ isOpen: true, type, data, isWarning: true, assignedUsers: assigned });
        return;
      }
    }
    if (type === 'user') {
      const managedGroups = groups.filter(g => g.managerId === data.id && !g.deletedAt);
      if (managedGroups.length > 0) {
        setDeleteModal({ isOpen: true, type: 'user_manager', data, isWarning: true, assignedUsers: managedGroups });
        return;
      }
    }
    setDeleteModal({ isOpen: true, type, data, isWarning: false, assignedUsers: [] });
  };

  const confirmDelete = async () => {
    const { type, data } = deleteModal;
    try {
      if (type === 'role') await deleteRole(data.id);
      else if (type === 'group') await deleteGroup(data.id);
      else if (type === 'user') await deleteUser(data.id);
    } catch (e) {
      // Surface 409 delete-protection (e.g. user manages a group) inline.
      pushToast({ kind: 'error', message: e.message || 'Delete failed.' });
    }
    setDeleteModal({ isOpen: false, type: null, data: null, isWarning: false, assignedUsers: [] });
  };

  const handleRoleSubmit = async (data) => {
    const payload = { roleName: data.name, description: data.description, permissions: data.permissions || [] };
    try {
      if (modal.mode === 'add') await createRole(payload);
      else await updateRole(modal.data.id, payload);
      closeModal(true);
    } catch (e) {
      pushToast({ kind: 'error', message: e.message || 'Save failed.' });
    }
  };

  const handleGroupSubmit = async (data) => {
    const payload = {
      groupName: data.name,
      roomFloor: data.room,
      managerUserId: data.managerId ? Number(data.managerId) : null,
      description: data.description,
    };
    try {
      if (modal.mode === 'add') await createGroup(payload);
      else await updateGroup(modal.data.id, payload);
      closeModal(true);
    } catch (e) {
      pushToast({ kind: 'error', message: e.message || 'Save failed.' });
    }
  };

  const handleUserSubmit = async (data) => {
    const payload = {
      name: data.name,
      email: data.email,
      roleId: parseInt(data.roleId, 10),
      groupId: parseInt(data.groupId, 10),
      status: data.status,
    };
    if (modal.mode === 'add' && data.password) payload.password = data.password;
    try {
      if (modal.mode === 'add') await createUser(payload);
      else await updateUser(modal.data.id, payload);
      closeModal(true);
    } catch (e) {
      pushToast({ kind: 'error', message: e.message || 'Save failed.' });
    }
  };

  const filteredRoles = [...roles].filter(r => !r.deletedAt);
  const filteredGroups = [...groups].filter(g => !g.deletedAt);

  const totalRoles = roles.filter(r => !r.deletedAt).length;
  const totalGroups = groups.filter(g => !g.deletedAt).length;
  const totalUsers = users.filter(u => !u.deletedAt).length;
  const activeUsers = users.filter(u => u.status === 'Active' && !u.deletedAt).length;
  const disabledUsers = users.filter(u => u.status === 'Disabled' && !u.deletedAt).length;
  const groupsWithManager = groups.filter(g => !g.deletedAt && g.managerId != null).length;
  const groupsWithoutManager = groups.filter(g => !g.deletedAt && g.managerId == null).length;


  const handleDropdownClick = (e, id) => {
    e.stopPropagation();
    if (openDropdownId === id) {
      setOpenDropdownId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom, right: window.innerWidth - rect.right });
      setOpenDropdownId(id);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-dropdown-container') && !e.target.closest('.action-dropdown-portal')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Column defs for the shared <DataTable>: `weight` = fit-mode share of the width, `render` = cell.
  const roleColumns = [
    { key: 'name', header: 'Role Name', weight: 1.4, sortable: true, sortAccessor: (r) => (r.name || '').toLowerCase(),
      headerClassName: 'px-3 py-3', cellClassName: 'p-3 font-medium text-slate-800 dark:text-zinc-200',
      render: (role) => role.name },
    { key: 'perms', header: 'Role / Permission', weight: 2.0, headerClassName: 'px-3 py-3', cellClassName: 'p-3',
      render: (role) => role.permissions && role.permissions.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {role.permissions.map(p => (
            <span key={p} className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium border border-blue-100 dark:border-blue-500/20">
              {p}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-[11px] text-slate-400 italic">None</span>
      ) },
    { key: 'created', header: 'Created', weight: 1.1, sortable: true, sortAccessor: (r) => new Date(r.createdAt).getTime() || 0,
      headerClassName: 'px-3 py-3', cellClassName: 'p-3 text-slate-500 dark:text-zinc-400 text-[12px]',
      render: (role) => role.createdAt },
    { key: 'userCount', header: 'User Count', weight: 1.0, headerClassName: 'px-3 py-3', cellClassName: 'p-3',
      render: (role) => (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-surface text-slate-600 dark:text-zinc-300 text-[11px] font-medium min-w-[24px]">
          {role.userCount}
        </span>
      ) },
    { key: 'status', header: 'Status', weight: 1.0, headerClassName: 'px-3 py-3', cellClassName: 'p-3',
      render: (role) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium border border-emerald-200 dark:border-emerald-500/20">
          {role.status}
        </span>
      ) },
    { key: 'action', header: 'Action', weight: 0.7, align: 'center', resizable: false, headerClassName: 'px-3 py-3', cellClassName: 'p-3',
      render: (role) => (
        <TableActionMenu isOpen={openDropdownId === `role-${role.id}`} onToggle={(e) => handleDropdownClick(e, `role-${role.id}`)} dropdownPos={dropdownPos}>
          <button onClick={() => { openModal('role', 'edit', role); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200">
            <Edit2 size={14} /> Edit Role
          </button>
          <div className="h-px bg-slate-100 dark:bg-zinc-700 my-1"></div>
          <button onClick={() => { handleDeleteClick('role', role); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Trash2 size={14} /> Delete Role
          </button>
        </TableActionMenu>
      ) },
  ];

  const groupColumns = [
    { key: 'name', header: 'Group Name', weight: 1.5, sortable: true, sortAccessor: (g) => (g.name || '').toLowerCase(),
      headerClassName: 'px-3 py-3', cellClassName: 'p-3 font-medium text-slate-800 dark:text-zinc-200',
      render: (group) => group.name },
    { key: 'manager', header: 'Manager', weight: 1.8, headerClassName: 'px-3 py-3', cellClassName: 'p-3 text-[12px] text-slate-600 dark:text-zinc-300',
      render: (group) => group.managerId ? (
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-medium text-slate-600 dark:text-zinc-300">
            {(users.find(u => u.id === group.managerId)?.name || '?').charAt(0).toUpperCase()}
          </div>
          {users.find(u => u.id === group.managerId)?.name || 'Unknown'}
        </div>
      ) : (
        <span className="text-slate-400 italic">Not Assigned</span>
      ) },
    { key: 'room', header: 'Room / Floor', weight: 1.3, headerClassName: 'px-3 py-3', cellClassName: 'p-3 text-slate-500 dark:text-zinc-400 text-[12px]',
      render: (group) => group.room },
    { key: 'created', header: 'Created', weight: 1.1, sortable: true, sortAccessor: (g) => new Date(g.createdAt).getTime() || 0,
      headerClassName: 'px-3 py-3', cellClassName: 'p-3 text-slate-500 dark:text-zinc-400 text-[12px]',
      render: (group) => group.createdAt },
    { key: 'members', header: 'Members', weight: 1.0, headerClassName: 'px-3 py-3', cellClassName: 'p-3',
      render: (group) => (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-surface text-slate-600 dark:text-zinc-300 text-[11px] font-medium min-w-[24px]">
          {group.memberCount}
        </span>
      ) },
    { key: 'action', header: 'Action', weight: 0.7, align: 'center', resizable: false, headerClassName: 'px-3 py-3', cellClassName: 'p-3',
      render: (group) => (
        <TableActionMenu isOpen={openDropdownId === `group-${group.id}`} onToggle={(e) => handleDropdownClick(e, `group-${group.id}`)} dropdownPos={dropdownPos}>
          <button onClick={() => { openModal('group', 'edit', group); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200">
            <Edit2 size={14} /> Edit Group
          </button>
          <div className="h-px bg-slate-100 dark:bg-zinc-700 my-1"></div>
          <button onClick={() => { handleDeleteClick('group', group); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Trash2 size={14} /> Delete Group
          </button>
        </TableActionMenu>
      ) },
  ];

  const userColumns = [
    { key: 'name', header: 'Full Name', weight: 1.9, sortable: true, sortAccessor: (u) => (u.name || '').toLowerCase(),
      headerClassName: 'px-5 py-3', cellClassName: 'px-5 py-3 font-medium text-slate-800 dark:text-zinc-200',
      render: (user) => user.name },
    { key: 'email', header: 'Email', weight: 2.3, sortable: true, sortAccessor: (u) => (u.email || '').toLowerCase(),
      headerClassName: 'px-5 py-3', cellClassName: 'px-5 py-3 text-slate-500 dark:text-zinc-400 text-[12px]',
      render: (user) => user.email },
    { key: 'role', header: 'Role', weight: 1.2, headerClassName: 'px-5 py-3', cellClassName: 'px-5 py-3',
      render: (user) => (
        <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border ${
          user.roleId === 1 ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' :
          user.roleId === 2 ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20' :
          'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
        }`}>
          {getRoleName(user.roleId)}
        </span>
      ) },
    { key: 'group', header: 'Group', weight: 1.5, headerClassName: 'px-5 py-3', cellClassName: 'px-5 py-3 text-slate-600 dark:text-zinc-400 text-[12px]',
      render: (user) => getGroupName(user.groupId) },
    { key: 'status', header: 'Status', weight: 1.0, headerClassName: 'px-5 py-3', cellClassName: 'px-5 py-3',
      render: (user) => (
        <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border ${
          user.status === 'Active'
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
            : 'bg-slate-100 dark:bg-surface text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-theme'
        }`}>
          {user.status}
        </span>
      ) },
    { key: 'created', header: 'Created', weight: 1.3, sortable: true, sortAccessor: (u) => new Date(u.createdAt).getTime() || 0,
      headerClassName: 'px-5 py-3', cellClassName: 'px-5 py-3 text-slate-400 dark:text-zinc-500 text-[12px]',
      render: (user) => user.createdAt },
    { key: 'lastLogin', header: 'Last Login', weight: 1.3, headerClassName: 'px-5 py-3', cellClassName: 'px-5 py-3 text-slate-400 dark:text-zinc-500 text-[12px]',
      render: (user) => user.lastLogin },
    { key: 'action', header: 'Action', weight: 0.7, align: 'center', resizable: false, headerClassName: 'px-5 py-3', cellClassName: 'px-5 py-3',
      render: (user) => (
        <TableActionMenu isOpen={openDropdownId === `user-${user.id}`} onToggle={(e) => handleDropdownClick(e, `user-${user.id}`)} dropdownPos={dropdownPos}>
          <button onClick={() => { openModal('user', 'edit', user); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200">
            <Edit2 size={14} /> Edit User
          </button>
          <div className="h-px bg-slate-100 dark:bg-zinc-700 my-1"></div>
          <button onClick={() => { handleDeleteClick('user', user); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Trash2 size={14} /> Delete User
          </button>
        </TableActionMenu>
      ) },
  ];

  return (
    <>
      
            <div className="flex flex-col gap-6 h-full animate-in slide-in-from-right-8 fade-in duration-300 fill-mode-both items-start w-full">
              
              {/* Stats Badge */}
              <div className="shrink-0 w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card p-4 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h1 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Access Management Statistics</h1>
                  <p className="text-[13px] text-slate-500 dark:text-zinc-400 mt-1">Overview of system roles, organizational groups, and user accounts.</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                    <div className="text-2xl font-bold text-slate-800 dark:text-zinc-200">{totalRoles}</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Roles</div>
                  </div>
                  <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                    <div className="text-2xl font-bold text-slate-800 dark:text-zinc-200">{totalGroups}</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Groups</div>
                  </div>
                  <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                    <div className="text-2xl font-bold text-slate-800 dark:text-zinc-200">{groupsWithManager}</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Grps w/ Mgr</div>
                  </div>
                  <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                    <div className="text-2xl font-bold text-slate-800 dark:text-zinc-200">{groupsWithoutManager}</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Grps w/o Mgr</div>
                  </div>
                  <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalUsers}</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Users</div>
                  </div>
                  <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeUsers}</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Active</div>
                  </div>
                  <div className="text-center pl-4">
                    <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{disabledUsers}</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Disabled</div>
                  </div>
                </div>
              </div>

              {/* Scrollable Container for Tables Only */}
              <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col gap-6 pr-1 pb-1">
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 shrink-0">
                  {/* Role Management Panel */}
                  <div className="bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card shadow-card flex flex-col max-h-[420px]">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme bg-transparent dark:bg-transparent rounded-t-card shrink-0">
                      <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200 font-semibold text-sm">
                        <Shield size={18} className="text-blue-600 dark:text-blue-500" />
                        Role Management
                      </div>
                      <button onClick={() => openModal('role', 'add')} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-md text-[12px] font-medium transition-colors shadow-sm">
                        <Plus size={14} /> Add Role
                      </button>
                    </div>

                    {/* Desktop-only table (phone out of scope): shared <DataTable> owns resize/sort/pagination */}
                    <div className="hidden md:flex flex-auto min-h-0 flex-col">
                      <DataTable
                        columns={roleColumns}
                        rows={filteredRoles}
                        rowKey={(r) => r.id}
                        noun="Roles"
                        defaultSort={{ key: 'created', dir: 'asc' }}
                        emptyState={{
                          icon: Shield,
                          title: 'No Roles Found',
                          message: 'Create your first role to get started.',
                          action: (
                            <button onClick={() => openModal('role', 'add')} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-[12px]">
                              + Add Role
                            </button>
                          ),
                        }}
                      />
                    </div>
                  </div>

                  {/* Group / Division Management Panel */}
                  <div className="bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card shadow-card flex flex-col max-h-[420px]">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme bg-transparent dark:bg-transparent rounded-t-card shrink-0">
                      <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200 font-semibold text-sm">
                        <Users size={18} className="text-purple-600 dark:text-purple-400" />
                        Group / Division
                      </div>
                      <button onClick={() => openModal('group', 'add')} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-md text-[12px] font-medium transition-colors shadow-sm">
                        <Plus size={14} /> Add Group
                      </button>
                    </div>

                    <div className="hidden md:flex flex-auto min-h-0 flex-col">
                      <DataTable
                        columns={groupColumns}
                        rows={filteredGroups}
                        rowKey={(g) => g.id}
                        noun="Groups"
                        defaultSort={{ key: 'created', dir: 'asc' }}
                        emptyState={{
                          icon: Users,
                          title: 'No Groups Found',
                          message: 'Create your first group to organize users.',
                          action: (
                            <button onClick={() => openModal('group', 'add')} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-[12px]">
                              + Add Group
                            </button>
                          ),
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* User Management Panel */}
                <div className="flex flex-col w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card shadow-card min-h-0">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center justify-between shrink-0">
                    <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100">User Overview</h3>
                    <div className="flex items-center gap-2 relative">
                      <button 
                        onClick={() => { setIsRefreshingUser(true); setTimeout(() => setIsRefreshingUser(false), 1000); }}
                        disabled={isRefreshingUser}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-md disabled:opacity-50"
                        title="Refresh"
                      >
                        <RefreshCw size={16} className={isRefreshingUser ? 'animate-spin' : ''} />
                      </button>
                      <button onClick={() => openModal('user', 'add')} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20">
                        <Plus size={14} /> Add User
                      </button>
                    </div>
                  </div>
                  
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex flex-wrap items-center gap-3 shrink-0">
                    <div className="relative w-[300px]">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search User..." 
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface border border-gray-200 dark:border-theme rounded-lg text-[13px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:text-gray-100"
                      />
                    </div>
                    <select 
                      value={userRoleFilter}
                      onChange={e => setUserRoleFilter(e.target.value)}
                      className="bg-white dark:bg-surface border border-gray-200 dark:border-theme text-gray-700 dark:text-gray-200 text-[13px] font-medium rounded-lg px-3 py-2 outline-none cursor-pointer min-w-[140px]"
                    >
                      <option value="All Roles">All Roles</option>
                      {roles.filter(r => !r.deletedAt).map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                    <select 
                      value={userGroupFilter}
                      onChange={e => setUserGroupFilter(e.target.value)}
                      className="bg-white dark:bg-surface border border-gray-200 dark:border-theme text-gray-700 dark:text-gray-200 text-[13px] font-medium rounded-lg px-3 py-2 outline-none cursor-pointer min-w-[140px]"
                    >
                      <option value="All Groups">All Groups</option>
                      {groups.filter(g => !g.deletedAt).map(g => (
                        <option key={g.id} value={g.name}>{g.name}</option>
                      ))}
                    </select>
                    <select 
                      value={userStatusFilter}
                      onChange={e => setUserStatusFilter(e.target.value)}
                      className="bg-white dark:bg-surface border border-gray-200 dark:border-theme text-gray-700 dark:text-gray-200 text-[13px] font-medium rounded-lg px-3 py-2 outline-none cursor-pointer min-w-[140px]"
                    >
                      <option value="All Status">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Disabled">Disabled</option>
                    </select>
                  </div>

                  <DataTable
                    columns={userColumns}
                    rows={filteredUsers}
                    rowKey={(u) => u.id}
                    noun="Users"
                    defaultSort={{ key: 'created', dir: 'asc' }}
                    emptyState={{
                      icon: User,
                      title: 'No Users Found',
                      message: 'Add your first user or adjust the filters.',
                      action: (
                        <button onClick={() => openModal('user', 'add')} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-[12px]">
                          + Add User
                        </button>
                      ),
                    }}
                  />
                </div>
              </div>
            </div>

      {modal.isOpen && modal.type === 'user' && (
        <UserForm mode={modal.mode} data={modal.data} onClose={() => closeModal()} onSubmit={handleUserSubmit} onChange={() => setHasUnsavedChanges(true)} groups={groups} roles={roles} />
      )}
      {modal.isOpen && modal.type === 'role' && (
        <RoleForm mode={modal.mode} data={modal.data} onClose={() => closeModal()} onSubmit={handleRoleSubmit} onChange={() => setHasUnsavedChanges(true)} />
      )}
      {modal.isOpen && modal.type === 'group' && (
        <GroupForm 
          mode={modal.mode} 
          data={modal.data} 
          onClose={() => closeModal()} 
          onSubmit={handleGroupSubmit} 
          onChange={() => setHasUnsavedChanges(true)} 
          users={users.filter(u => {
            if (u.deletedAt) return false;
            const role = roles.find(r => r.id === u.roleId);
            const rn = role?.roleName ?? role?.name;
            return rn === 'Administrator' || rn === 'Manager';
          })} 
        />
      )}

      <UserActionModal 
        isOpen={deleteModal.isOpen} 
        type={deleteModal.type} 
        data={deleteModal.data} 
        isWarning={deleteModal.isWarning} 
        assignedUsers={deleteModal.assignedUsers} 
        onConfirm={confirmDelete} 
        onClose={() => setDeleteModal({ isOpen: false, type: null, data: null, isWarning: false, assignedUsers: [] })} 
      />


      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-[400px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-1">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-100 leading-tight">Unsaved Changes</h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400">You have unsaved changes in the form. Are you sure you want to close it? Your changes will be lost.</p>
              <div className="flex justify-center gap-3 mt-4 w-full">
                <button onClick={() => setShowUnsavedWarning(false)} className="flex-1 px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors">Cancel</button>
                <button onClick={confirmCloseModal} className="flex-1 px-4 py-2 text-[13px] font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-input transition-colors shadow-sm">Discard Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
