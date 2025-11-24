'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MessageCircle, Users as UsersIcon, Plus } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CreateGroupModal } from './CreateGroupModal';
import { format } from 'date-fns';
import { User } from '@/lib/chatTypes';

interface ChatListProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatList({ isOpen, onClose }: ChatListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'groups' | 'users'>('chats');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const { conversations, openChat, createConversation, availableUsers, fetchAvailableUsers } = useChatStore();
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    fetchAvailableUsers();
  }, [fetchAvailableUsers]);

  // Role-based filtering
  let filteredUsers = availableUsers;

  // If DEV_ADMIN: show only COMPANY_ADMIN users
  if (currentUser?.role === 'DEV_ADMIN') {
    filteredUsers = availableUsers.filter(user => user.role === 'COMPANY_ADMIN');
  }
  // For COMPANY_ADMIN and EMPLOYEE: backend already filters by company

  // Apply search filter
  filteredUsers = filteredUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConversations = conversations.filter(conv =>
    !conv.isGroup && conv.participantName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = conversations.filter(conv =>
    conv.isGroup && conv.participantName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onlineCount = availableUsers.filter(u => u.isOnline).length;
  const groupCount = conversations.filter(c => c.isGroup).length;

  const handleUserClick = async (user: User) => {
    let conversation = conversations.find(c => c.participantId === user.id && !c.isGroup);

    if (!conversation) {
      const newConvId = await createConversation(user.id, user.name, user.avatar, user.role);
      openChat(newConvId);
    } else {
      openChat(conversation.id);
    }

    onClose();
  };

  const handleConversationClick = (convId: string) => {
    openChat(convId);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/20 z-40"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
            >
              <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Messages</h2>
                  <p className="text-xs text-slate-500">{onlineCount} online • {groupCount} groups</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-700 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 border-b border-slate-100">
                <Button onClick={() => setIsCreateGroupOpen(true)} className="w-full h-10 bg-teal-600 hover:bg-teal-700 font-semibold">
                  <UsersIcon size={16} className="mr-2" /> Create New Group
                </Button>
              </div>

              <div className="px-4 pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input type="text" placeholder="Search messages..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-10 border-slate-300" />
                </div>

                <div className="flex gap-2 mt-3">
                  <button onClick={() => setActiveTab('chats')} className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'chats' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-slate-600 hover:bg-slate-50'}`}>
                    Chats
                  </button>
                  <button onClick={() => setActiveTab('groups')} className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'groups' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-slate-600 hover:bg-slate-50'}`}>
                    Groups ({groupCount})
                  </button>
                  <button onClick={() => setActiveTab('users')} className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'users' ? 'bg-green-50 text-green-700 border border-green-200' : 'text-slate-600 hover:bg-slate-50'}`}>
                    Users
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === 'chats' && (
                  <div className="p-2">
                    {filteredConversations.length > 0 ? (
                      filteredConversations.map(conv => (
                        <ConversationItem key={conv.id} conversation={conv} onClick={() => handleConversationClick(conv.id)} />
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-500">
                        <MessageCircle size={40} className="mx-auto mb-3 text-slate-300" />
                        <p className="text-sm font-medium">No direct chats yet</p>
                        <p className="text-xs text-slate-400 mt-1">Start a conversation from Users tab</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'groups' && (
                  <div className="p-2">
                    {filteredGroups.length > 0 ? (
                      filteredGroups.map(conv => (
                        <ConversationItem key={conv.id} conversation={conv} onClick={() => handleConversationClick(conv.id)} />
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-500">
                        <UsersIcon size={40} className="mx-auto mb-3 text-slate-300" />
                        <p className="text-sm font-medium">No groups yet</p>
                        <p className="text-xs text-slate-400 mt-1">Create a group to get started</p>
                        <Button size="sm" onClick={() => setIsCreateGroupOpen(true)} className="mt-4 bg-teal-600 hover:bg-teal-700">
                          <Plus size={14} className="mr-2" /> Create Group
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'users' && (
                  <div className="p-2">
                    {filteredUsers.map(user => (
                      <UserItem key={user.id} user={user} onClick={() => handleUserClick(user)} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CreateGroupModal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} />
    </>
  );
}

function ConversationItem({ conversation, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors group border border-transparent hover:border-slate-200">
      <div className="relative shrink-0">
        {conversation.isGroup ? (
          <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 ring-2 ring-slate-100">
            <UsersIcon size={20} />
          </div>
        ) : (
          <>
            {conversation.participantAvatar ? (
              <img src={conversation.participantAvatar} alt={conversation.participantName} className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-semibold ring-2 ring-slate-100">
                {conversation.participantName?.charAt(0)}
              </div>
            )}
            {conversation.isOnline && !conversation.isGroup && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-white"></span>
            )}
          </>
        )}
      </div>

      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-slate-900 truncate">{conversation.participantName}</p>
          {conversation.lastMessageTime && (
            <span className="text-xs text-slate-400">{format(new Date(conversation.lastMessageTime), 'HH:mm')}</span>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate">{conversation.lastMessage || 'No messages yet'}</p>
      </div>

      {conversation.unreadCount > 0 && (
        <div className="shrink-0 w-5 h-5 bg-teal-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {conversation.unreadCount}
        </div>
      )}
    </button>
  );
}

function UserItem({ user, onClick }: { user: User; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors group border border-transparent hover:border-slate-200">
      <div className="relative shrink-0">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-semibold ring-2 ring-slate-100">
            {user.name.charAt(0)}
          </div>
        )}
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white ${user.isOnline ? 'bg-green-500' : 'bg-slate-300'}`}></span>
      </div>

      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-500">{user.role}</p>
          {user.isOnline && (
            <span className="text-xs text-green-600 font-medium">• Active</span>
          )}
        </div>
      </div>

      <MessageCircle size={18} className="text-slate-300 group-hover:text-teal-600 transition-colors shrink-0" />
    </button>
  );
}
