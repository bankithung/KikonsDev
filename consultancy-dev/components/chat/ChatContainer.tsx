'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/store/chatStore';
import { ChatWindow } from './ChatWindow';
import { MinimizedChatBubble } from './MinimizedChatBubble';
import { ChatList } from './ChatList';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function ChatContainer() {
  const { conversations, activeChats, minimizedChats, fetchConversations } = useChatStore();
  const [isChatListOpen, setIsChatListOpen] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Limit to 3 open chats max (like Facebook)
  const visibleChats = activeChats.slice(-3);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <>
      {/* Floating Chat Button - Shows when no chats are open */}
      {activeChats.length === 0 && minimizedChats.length === 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setIsChatListOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 transition-transform"
        >
          <MessageCircle size={24} />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center ring-2 ring-white">
              {totalUnread}
            </span>
          )}
        </motion.button>
      )}

      {/* Active Chat Windows */}
      <div className="fixed bottom-0 right-6 z-50 flex gap-3 items-end">
        <AnimatePresence>
          {visibleChats.map((chatId, index) => (
            <ChatWindow key={chatId} conversationId={chatId} />
          ))}
        </AnimatePresence>
      </div>

      {/* Minimized Chats Bar */}
      <div className="fixed bottom-6 right-6 z-40 flex gap-3 items-center">
        <AnimatePresence>
          {minimizedChats.map((chat) => (
            <MinimizedChatBubble
              key={chat.conversationId}
              conversationId={chat.conversationId}
              participantName={chat.participantName}
              participantAvatar={chat.participantAvatar}
              unreadCount={chat.unreadCount}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Chat List Sidebar */}
      <ChatList isOpen={isChatListOpen} onClose={() => setIsChatListOpen(false)} />
    </>
  );
}
