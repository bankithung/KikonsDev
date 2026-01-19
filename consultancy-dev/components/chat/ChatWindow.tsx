'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query'; // Import useQuery
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Send, Phone, Video, Users, Info } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GroupChat } from '@/lib/chatTypes';
import { apiClient } from '@/lib/apiClient';

interface ChatWindowProps {
  conversationId: string;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const { conversations, closeChat, minimizeChat, sendMessage } = useChatStore();
  const { user: currentUser } = useAuthStore();
  const conversation = conversations.find(c => c.id === conversationId);
  const [message, setMessage] = useState('');
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Refactored to use React Query for real-time updates via WebSocket
  const { data: messages, refetch } = useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: () => apiClient.chat.getMessages(conversationId),
    enabled: !!conversationId,
    // Poll every 10s as backup, but rely on WebSocket for instant updates
    refetchInterval: 10000,
  });

  // Sync React Query data to Chat Store
  useEffect(() => {
    if (messages) {
      useChatStore.setState(state => ({
        conversations: state.conversations.map(conv =>
          conv.id === conversationId ? { ...conv, messages } : conv
        )
      }));
    }
  }, [messages, conversationId]);

  // Initial scroll
  useEffect(() => {
    if (messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!conversation) return null;

  const isGroup = conversation.isGroup;
  const groupData = isGroup ? (conversation as GroupChat) : null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(conversationId, message);
      setMessage('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-[340px] h-[480px] bg-white rounded-t-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
    >
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative shrink-0">
            {isGroup ? (
              <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                <Users size={18} />
              </div>
            ) : (
              <>
                {conversation.participantAvatar ? (
                  <img src={conversation.participantAvatar} alt="" className="w-9 h-9 rounded-full" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-semibold text-sm">
                    {conversation.participantName?.charAt(0) || 'U'}
                  </div>
                )}
                {conversation.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white"></span>
                )}
              </>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-900 truncate">{conversation.participantName || 'Unknown User'}</h4>
            <p className="text-xs text-slate-500 truncate">
              {isGroup ? `${groupData?.members.length || 0} members` : (conversation.isOnline ? 'Active now' : 'Offline')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isGroup && (
            <>
              <button className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600" title="Call">
                <Phone size={16} />
              </button>
              <button className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600" title="Video Call">
                <Video size={16} />
              </button>
            </>
          )}
          {isGroup && (
            <button
              onClick={() => setShowGroupInfo(!showGroupInfo)}
              className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600"
              title="Group Info"
            >
              <Info size={16} />
            </button>
          )}
          <button onClick={() => minimizeChat(conversationId)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600" title="Minimize">
            <Minus size={16} />
          </button>
          <button onClick={() => closeChat(conversationId)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600" title="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showGroupInfo && isGroup && groupData && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-50 border-b border-slate-200 overflow-hidden"
          >
            <div className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Group Members</p>
              <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                {groupData.members.map(member => (
                  <div key={member.id} className="flex items-center gap-2 text-xs">
                    <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-[10px] font-semibold">
                      {member.name.charAt(0)}
                    </div>
                    <span className="text-slate-700">{member.name}</span>
                    {member.isAdmin && <span className="text-teal-600 font-semibold">(Admin)</span>}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
        {conversation.messages.map((msg) => {
          const isCurrentUser = currentUser && String(msg.senderId) === String(currentUser.id);
          const isSystemMessage = msg.senderId === 'system';

          if (isSystemMessage) {
            return (
              <div key={msg.id} className="flex justify-center">
                <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  {msg.text}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isCurrentUser ? 'bg-teal-600 text-white' : 'bg-white text-slate-900 border border-slate-200'} rounded-2xl px-4 py-2.5 shadow-sm`}>
                {isGroup && !isCurrentUser && (
                  <p className="text-xs font-semibold mb-1 opacity-70">{msg.senderName}</p>
                )}
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-xs mt-1 ${isCurrentUser ? 'text-teal-100' : 'text-slate-400'}`}>
                  {format(new Date(msg.timestamp), 'HH:mm')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="bg-white border-t border-slate-200 p-3 flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isGroup ? "Message group..." : "Type a message..."}
          className="flex-1 h-9 text-sm border-slate-300"
        />
        <Button type="submit" size="sm" className="h-9 w-9 p-0 bg-teal-600 hover:bg-teal-700" disabled={!message.trim()}>
          <Send size={16} />
        </Button>
      </form>
    </motion.div>
  );
}
