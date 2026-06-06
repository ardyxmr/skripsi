import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle, Clock, AlertTriangle, Shield, PlusCircle, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'PROVISION_REQUEST', message: 'New Provision Request for VM-App-Prod', isRead: false, link: '/approvals', time: '10 mins ago' },
  { id: 2, type: 'APPROVAL_DECISION', message: 'Your VM-Dev-01 request has been APPROVED', isRead: false, link: '/inventory', time: '1 hour ago' },
  { id: 3, type: 'RENEWAL_REQUEST', message: 'Renewal Request for VM-Test-05 is pending', isRead: true, link: '/approvals', time: '2 hours ago' },
  { id: 4, type: 'PERMANENT_REQUEST', message: 'Permanent Request for VM-DB-Prod is pending', isRead: true, link: '/approvals', time: '1 day ago' },
  { id: 5, type: 'EXPIRY_WARNING', message: 'VM-Dev-Temp will expire in 3 days', isRead: true, link: '/inventory', time: '2 days ago' }
];

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const popoverRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverRef]);

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (id, link) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    setIsOpen(false);
    if (link) {
      navigate(link);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'PROVISION_REQUEST': return <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-500"><PlusCircle size={16} /></div>;
      case 'APPROVAL_DECISION': return <div className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500"><CheckCircle size={16} /></div>;
      case 'RENEWAL_REQUEST': return <div className="p-2 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-500"><Clock size={16} /></div>;
      case 'PERMANENT_REQUEST': return <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500"><Shield size={16} /></div>;
      case 'EXPIRY_WARNING': return <div className="p-2 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-500"><AlertTriangle size={16} /></div>;
      default: return <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-500"><Bell size={16} /></div>;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-opacity"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-card"></span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[380px] bg-white dark:bg-card rounded-modal shadow-modal border border-gray-100 dark:border-theme z-[100] animate-in slide-in-from-top-2 duration-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-theme flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/20">
            <h3 className="text-[14px] font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 transition-opacity"
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar flex flex-col divide-y divide-gray-50 dark:divide-theme">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-gray-500 dark:text-gray-400">
                You have no notifications.
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id, n.link)}
                  className={`px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-opacity flex gap-3 ${!n.isRead ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : ''}`}
                >
                  <div className="shrink-0 pt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <p className={`text-[13px] leading-snug ${!n.isRead ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                      {n.message}
                    </p>
                    <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                      {n.time}
                    </span>
                  </div>
                  {!n.isRead && (
                    <div className="shrink-0 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5"></div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-theme bg-slate-50/50 dark:bg-slate-800/20 text-center shrink-0">
            <button className="text-[12px] font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-opacity">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
