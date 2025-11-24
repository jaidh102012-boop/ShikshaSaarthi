import React, { useState, useEffect } from 'react';
import { X, Bell, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import SettingsService from '../services/settingsService';
import { SystemNotification } from '../types/settings';
import { useAuth } from '../context/AuthContext';

export default function NotificationBanner() {
  const { user } = useAuth();
  const [settingsService] = useState(() => SettingsService.getInstance());
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);

  useEffect(() => {
    const activeNotifications = settingsService.getActiveNotifications();
    const userRole = user?.role;
    
    // Filter notifications based on user role
    const relevantNotifications = activeNotifications.filter(notification => {
      if (notification.recipients.includes('all')) return true;
      if (userRole && notification.recipients.includes(userRole as any)) return true;
      return false;
    });

    setNotifications(relevantNotifications);

    // Load dismissed notifications from localStorage
    const dismissed = localStorage.getItem('dismissed_notifications');
    if (dismissed) {
      setDismissedNotifications(JSON.parse(dismissed));
    }
  }, [settingsService, user]);

  const dismissNotification = (notificationId: string) => {
    const newDismissed = [...dismissedNotifications, notificationId];
    setDismissedNotifications(newDismissed);
    localStorage.setItem('dismissed_notifications', JSON.stringify(newDismissed));
  };

  const getIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getColorClasses = (type: SystemNotification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const visibleNotifications = notifications.filter(
    notification => !dismissedNotifications.includes(notification.id)
  );

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`border rounded-lg p-4 ${getColorClasses(notification.type)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {getIcon(notification.type)}
              <div>
                <h4 className="font-medium">{notification.title}</h4>
                <p className="text-sm mt-1">{notification.message}</p>
                <p className="text-xs mt-2 opacity-75">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => dismissNotification(notification.id)}
              className="text-current hover:opacity-75"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
