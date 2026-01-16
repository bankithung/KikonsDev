'use client';

import { Bell, Search, Menu, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import Link from 'next/link';
import { ChatList } from '@/components/chat/ChatList';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { conversations } = useChatStore();
  const [isChatListOpen, setIsChatListOpen] = useState(false);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: apiClient.notifications.list,
    staleTime: 30000, // Refresh every 30 seconds
  });

  const notificationCount = notifications.filter((n: any) => !n.read).length;

  return (
    <>
      <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center flex-1">
          <button onClick={onMenuClick} className="md:hidden p-2 rounded-md hover:bg-gray-100 mr-2 text-gray-600">
            <Menu size={20} />
          </button>

          <div className="hidden md:flex items-center text-sm font-medium text-gray-900 font-heading">
            <span>Dashboard</span>
          </div>

          <div className="ml-4 md:ml-8 flex-1 max-w-md relative hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:text-sm transition duration-150 ease-in-out text-gray-900 font-body"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <HeadlessMenu as="div" className="relative">
            <HeadlessMenu.Button
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 relative group focus:outline-none"
              title="Notifications"
            >
              <Bell size={20} className="group-hover:text-teal-600 transition-colors" />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {notificationCount}
                </span>
              )}
            </HeadlessMenu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <HeadlessMenu.Items className="absolute right-0 z-20 mt-2 w-96 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-slate-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-white">
                  <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                  {notificationCount > 0 && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                      {notificationCount} New
                    </span>
                  )}
                </div>

                <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                      {notifications.slice(0, 5).map((notification: any) => (
                        <HeadlessMenu.Item key={notification.id}>
                          {({ active }) => (
                            <Link
                              href={notification.actionUrl || '/app/notifications'}
                              className={`block px-4 py-3.5 transition-all duration-200 relative ${active ? 'bg-slate-50' : 'bg-white'
                                } ${!notification.read ? 'bg-slate-50/50' : ''}`}
                            >
                              {!notification.read && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r" />
                              )}
                              <div className="flex gap-3.5 pl-1">
                                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notification.read ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-slate-300'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm leading-snug mb-1 ${!notification.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                    {notification.message}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                    {new Date(notification.created_at).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          )}
                        </HeadlessMenu.Item>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <div className="bg-slate-50 p-3 rounded-full mb-3">
                        <Bell size={24} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">No new notifications</p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border-t border-slate-100 p-2">
                  <HeadlessMenu.Item>
                    {({ active }) => (
                      <Link
                        href="/app/notifications"
                        className={`block w-full text-center px-4 py-2 text-xs font-semibold text-slate-600 hover:text-emerald-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all duration-200 ${active ? 'bg-white border-slate-200 text-emerald-600 shadow-sm' : ''}`}
                      >
                        View All Notifications
                      </Link>
                    )}
                  </HeadlessMenu.Item>
                </div>
              </HeadlessMenu.Items>
            </Transition>
          </HeadlessMenu>

          {/* Chat Button */}
          <button
            onClick={() => setIsChatListOpen(true)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 relative group hidden sm:block"
            title="Messages"
          >
            <svg className="w-5 h-5 group-hover:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {totalUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-teal-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </button>

          {/* Profile Dropdown */}
          <HeadlessMenu as="div" className="relative ml-3">
            <div>
              <HeadlessMenu.Button className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
                <span className="sr-only">Open user menu</span>
                {user?.avatar ? (
                  <img className="h-8 w-8 rounded-full ring-2 ring-gray-100" src={user.avatar} alt="" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 ring-2 ring-teal-50">
                    <User size={16} />
                  </div>
                )}
              </HeadlessMenu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <HeadlessMenu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100">
                <HeadlessMenu.Item>
                  {({ active }) => (
                    <Link
                      href="/app/profile"
                      className={`${active ? 'bg-gray-50' : ''} block px-4 py-2 text-sm text-gray-700 font-body`}
                    >
                      Your Profile
                    </Link>
                  )}
                </HeadlessMenu.Item>
                <HeadlessMenu.Item>
                  {({ active }) => (
                    <Link
                      href="/app/settings"
                      className={`${active ? 'bg-gray-50' : ''} block px-4 py-2 text-sm text-gray-700 font-body`}
                    >
                      Settings
                    </Link>
                  )}
                </HeadlessMenu.Item>
                <HeadlessMenu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => logout()}
                      className={`${active ? 'bg-gray-50' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700 font-body`}
                    >
                      Sign out
                    </button>
                  )}
                </HeadlessMenu.Item>
              </HeadlessMenu.Items>
            </Transition>
          </HeadlessMenu>
        </div>
      </header>

      {/* Chat List Panel */}
      <ChatList isOpen={isChatListOpen} onClose={() => setIsChatListOpen(false)} />
    </>
  );
}
