'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bell,
  Check,
  Trash2,
  Eye,
  MessageSquare,
  CreditCard,
  FileText,
  UserPlus,
  Calendar,
  AlertCircle,
  Search,
  Filter,
  CheckCircle2,
  Loader2,
  BellOff,
  ChevronRight,
  Clock,
  Inbox
} from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from '@/store/toastStore';

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
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const deleteMutation = useMutation({
    mutationFn: apiClient.notifications.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    },
  });

  const markAllRead = () => {
    notifications.forEach((n: Notification) => {
      if (!n.read) markAsReadMutation.mutate(n.id);
    });
    toast.success('All notifications marked as read');
  };

  const handleView = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  // Filter and search
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchesFilter = filter === 'all' ||
        (filter === 'unread' && !n.read) ||
        (filter === 'read' && n.read);

      const matchesSearch = !searchQuery ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [notifications, filter, searchQuery]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {};

    filteredNotifications.forEach(n => {
      const date = new Date(n.timestamp);
      let key = format(date, 'yyyy-MM-dd');

      if (isToday(date)) key = 'Today';
      else if (isYesterday(date)) key = 'Yesterday';
      else key = format(date, 'MMMM d, yyyy');

      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });

    return groups;
  }, [filteredNotifications]);

  const stats = useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    read: notifications.filter(n => n.read).length,
  }), [notifications]);

  const getIcon = (type: string) => {
    const iconClass = "shrink-0";
    switch (type) {
      case 'payment': return <CreditCard size={16} className={cn(iconClass, "text-green-600")} />;
      case 'document': return <FileText size={16} className={cn(iconClass, "text-blue-600")} />;
      case 'follow-up': return <Bell size={16} className={cn(iconClass, "text-amber-600")} />;
      case 'enrollment': return <UserPlus size={16} className={cn(iconClass, "text-purple-600")} />;
      case 'appointment': return <Calendar size={16} className={cn(iconClass, "text-teal-600")} />;
      case 'Info': return <Bell size={16} className={cn(iconClass, "text-blue-600")} />;
      case 'Success': return <CheckCircle2 size={16} className={cn(iconClass, "text-green-600")} />;
      case 'Warning': return <AlertCircle size={16} className={cn(iconClass, "text-amber-600")} />;
      case 'Error': return <AlertCircle size={16} className={cn(iconClass, "text-red-600")} />;
      default: return <Bell size={16} className={cn(iconClass, "text-slate-400")} />;
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'payment': return 'bg-green-50';
      case 'document': return 'bg-blue-50';
      case 'follow-up': return 'bg-amber-50';
      case 'enrollment': return 'bg-purple-50';
      case 'appointment': return 'bg-teal-50';
      case 'Success': return 'bg-green-50';
      case 'Warning': return 'bg-amber-50';
      case 'Error': return 'bg-red-50';
      default: return 'bg-slate-50';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-sm text-slate-500">Loading notifications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Button */}
      {stats.unread > 0 && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={markAllRead}
            className="h-8 text-xs"
          >
            <Check size={14} className="mr-1" /> Mark All Read ({stats.unread})
          </Button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-medium uppercase">Total</p>
                <p className="text-xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg">
                <Inbox size={16} className="text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-medium uppercase">Unread</p>
                <p className="text-xl font-bold text-amber-600">{stats.unread}</p>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <Bell size={16} className="text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-medium uppercase">Read</p>
                <p className="text-xl font-bold text-emerald-600">{stats.read}</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm border-slate-200 focus-visible:border-teal-400"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              {[
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread' },
                { id: 'read', label: 'Read' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as any)}
                  className={cn(
                    "px-4 py-2 text-xs font-medium transition-colors",
                    filter === f.id
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50',
                    f.id !== 'all' && 'border-l border-slate-200'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card className="border-slate-200 border-dashed">
          <CardContent className="py-12 text-center">
            <BellOff size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">
              {searchQuery || filter !== 'all'
                ? 'No notifications match your filters'
                : 'No notifications yet'}
            </p>
            <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedNotifications).map(([date, items]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-2 mb-2">
                <Clock size={12} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-500">{date}</span>
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] text-slate-400">{items.length} items</span>
              </div>

              {/* Notifications for this date */}
              <div className="space-y-2">
                {items.map((notification) => (
                  <Card
                    key={notification.id}
                    className={cn(
                      "border transition-all hover:shadow-md cursor-pointer group",
                      !notification.read
                        ? 'border-teal-200 bg-teal-50/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                    onClick={() => handleView(notification)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                          getTypeBg(notification.type)
                        )}>
                          {getIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <h3 className={cn(
                                "text-sm truncate",
                                !notification.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                              )}>
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-teal-500 rounded-full shrink-0" />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>

                          {/* Actions */}
                          <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsReadMutation.mutate(notification.id);
                                }}
                                className="text-[10px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                              >
                                <Check size={10} /> Mark read
                              </button>
                            )}
                            {notification.actionUrl && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleView(notification);
                                }}
                                className="text-[10px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                              >
                                <Eye size={10} /> View
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMutation.mutate(notification.id);
                              }}
                              className="text-[10px] text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                            >
                              <Trash2 size={10} /> Delete
                            </button>
                          </div>
                        </div>

                        {/* Arrow indicator for actionable items */}
                        {notification.actionUrl && (
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 shrink-0 mt-1" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className="text-center py-2">
          <p className="text-xs text-slate-400">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </p>
        </div>
      )}
    </div>
  );
}
