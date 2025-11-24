'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check, Trash2, Eye, MessageSquare, CreditCard, FileText, UserPlus, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: 'payment' | 'document' | 'follow-up' | 'enrollment' | 'appointment' | 'alert' | 'Info' | 'Success' | 'Warning' | 'Error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: apiClient.notifications.list,
  });

  const markAsReadMutation = useMutation({
    mutationFn: apiClient.notifications.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const markAllRead = () => {
    notifications.forEach((n: Notification) => {
      if (!n.read) markAsReadMutation.mutate(n.id);
    });
  };

  const deleteMutation = useMutation({
    mutationFn: apiClient.notifications.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotification = (id: string) => {
    if (confirm('Delete this notification?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-500">Loading notifications...</div>
      </div>
    );
  }

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment': return <CreditCard size={20} className="text-green-600" />;
      case 'document': return <FileText size={20} className="text-blue-600" />;
      case 'follow-up': return <Bell size={20} className="text-yellow-600" />;
      case 'enrollment': return <UserPlus size={20} className="text-purple-600" />;
      case 'appointment': return <Calendar size={20} className="text-teal-600" />;
      case 'Info': return <Bell size={20} className="text-teal-600" />;
      case 'Success': return <Check size={20} className="text-green-600" />;
      case 'Warning': return <AlertCircle size={20} className="text-yellow-600" />;
      case 'Error': return <AlertCircle size={20} className="text-red-600" />;
      default: return <AlertCircle size={20} className="text-slate-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">Notifications</h1>
          <p className="text-sm text-slate-600 mt-1 font-body">Stay updated with important events</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="h-9 font-body" onClick={markAllRead}>
            <Check className="mr-2 h-4 w-4" /> Mark All Read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-4">
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
          className={`h-9 font-body ${filter === 'all' ? 'bg-teal-600' : ''}`}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('unread')}
          className={`h-9 font-body ${filter === 'unread' ? 'bg-teal-600' : ''}`}
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map(notification => (
          <Card key={notification.id} className={`border-2 transition-all cursor-pointer ${!notification.read ? 'border-teal-200 bg-teal-50/30' : 'border-slate-200 bg-white'
            } hover:shadow-md`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${!notification.read ? 'bg-teal-100' : 'bg-slate-50'
                  }`}>
                  {getIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-base font-bold text-slate-900 font-heading">{notification.title}</h3>
                    <span className="text-xs text-slate-500 font-body whitespace-nowrap">
                      {format(new Date(notification.timestamp), 'HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 font-body mb-3">{notification.message}</p>

                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs font-body hover:bg-teal-100 hover:text-teal-700" onClick={() => markAsRead(notification.id)}>
                        <Check size={12} className="mr-1" /> Mark Read
                      </Button>
                    )}
                    {notification.actionUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs font-body hover:bg-blue-100 hover:text-blue-700"
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead(notification.id);
                          }
                          router.push(notification.actionUrl!);
                        }}
                      >
                        <Eye size={12} className="mr-1" /> View
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 text-xs font-body hover:bg-red-100 hover:text-red-700" onClick={() => deleteNotification(notification.id)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredNotifications.length === 0 && (
          <Card className="border-slate-200">
            <CardContent className="p-12 text-center">
              <Bell size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 font-medium font-body">No notifications</p>
              <p className="text-sm text-slate-400 mt-1 font-body">You're all caught up!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
