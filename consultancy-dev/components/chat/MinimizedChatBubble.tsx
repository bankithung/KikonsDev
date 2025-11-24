'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Users } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';

export function MinimizedChatBubble({ conversationId, participantName, participantAvatar, unreadCount, isGroup }: any) {
  const { maximizeChat, closeChat } = useChatStore();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="relative"
    >
      <button
        onClick={() => maximizeChat(conversationId)}
        className="w-14 h-14 rounded-full bg-white shadow-lg border-2 border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all hover:scale-105 relative"
      >
        {isGroup ? (
          <div className="w-full h-full rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
            <Users size={22} />
          </div>
        ) : (
          <>
            {participantAvatar ? (
              <img src={participantAvatar} alt={participantName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-lg">
                {participantName.charAt(0)}
              </div>
            )}
          </>
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          closeChat(conversationId);
        }}
        className="absolute -top-1 -right-1 w-5 h-5 bg-slate-600 hover:bg-slate-700 text-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
      >
        <span className="text-xs">×</span>
      </button>
      
      {/* Name tooltip on hover */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {participantName}
        </div>
      </div>
    </motion.div>
  );
}
