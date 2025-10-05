'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { 
  BellIcon,
  XMarkIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Notification {
  _id: string;
  subject: string;
  message: string;
  type: string;
  priority: string;
  fromAgency: {
    _id: string;
    name: string;
  };
  toAgency: {
    _id: string;
    name: string;
  };
  projectId?: {
    _id: string;
    name: string;
  };
  status: string;
  responseRequired: boolean;
  createdAt: string;
}

interface NotificationCenterProps {
  agencyId?: string;
}

export default function NotificationCenter({ agencyId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (agencyId) {
      fetchNotifications();
      // Set up polling for real-time updates
      const interval = setInterval(fetchNotifications, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [agencyId]);

  const fetchNotifications = async () => {
    if (!agencyId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/communications?toAgency=${agencyId}&limit=20`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data);
        const unread = data.data.filter((n: Notification) => n.status === 'Sent').length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Set empty notifications on error to prevent UI issues
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/communications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Read' })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n._id === notificationId ? { ...n, status: 'Read' } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => n.status === 'Sent');
      
      await Promise.all(
        unreadNotifications.map(n => markAsRead(n._id))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-300 bg-red-500/20 border-red-500/30';
      case 'High': return 'text-orange-300 bg-orange-500/20 border-orange-500/30';
      case 'Medium': return 'text-blue-300 bg-blue-500/20 border-blue-500/30';
      default: return 'text-gray-300 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Approval Request': return <ExclamationTriangleIcon className="w-5 h-5 text-orange-400" />;
      case 'Coordination': return <BellIcon className="w-5 h-5 text-blue-400" />;
      case 'Update': return <CheckIcon className="w-5 h-5 text-green-400" />;
      default: return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  if (!agencyId) return null;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-white/10 hover:bg-white/20 text-white border border-white/20 p-2 rounded-full"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-gray-900/95 backdrop-blur-md rounded-lg shadow-xl border border-white/20 z-50">
          {/* Header */}
          <div className="p-4 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Notifications ({unreadCount} unread)
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    onClick={markAllAsRead}
                    className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 px-3 py-1"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-200 p-1 bg-transparent border-0"
                >
                  <XMarkIcon className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-300">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <BellIcon className="w-12 h-12 mx-auto mb-2 text-gray-500" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-white/5 cursor-pointer transition-colors ${
                      notification.status === 'Sent' ? 'bg-blue-500/10 border-l-4 border-l-blue-400' : ''
                    }`}
                    onClick={() => markAsRead(notification._id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-white truncate">
                            {notification.subject}
                          </p>
                          <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>From: {notification.fromAgency.name}</span>
                          <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        {notification.projectId && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-700 text-gray-200">
                              📋 {notification.projectId.name}
                            </span>
                          </div>
                        )}
                        
                        {notification.responseRequired && notification.status === 'Sent' && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-500/20 text-orange-300">
                              ⚡ Response Required
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/20 bg-gray-800/50">
            <Button
              onClick={() => {
                setIsOpen(false);
                // Navigate to communications page
                window.location.href = '/communications';
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
            >
              View All Communications
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}