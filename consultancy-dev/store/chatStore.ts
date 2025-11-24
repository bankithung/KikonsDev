import { create } from 'zustand';
import { ChatConversation, MinimizedChat, ChatMessage, GroupChat, GroupMember, User } from '@/lib/chatTypes';
import { apiClient } from '@/lib/apiClient';

interface ChatState {
  conversations: ChatConversation[];
  activeChats: string[];
  minimizedChats: MinimizedChat[];
  availableUsers: User[];
  isLoading: boolean;

  fetchConversations: () => Promise<void>;
  fetchAvailableUsers: () => Promise<void>;
  openChat: (conversationId: string) => void;
  closeChat: (conversationId: string) => void;
  minimizeChat: (conversationId: string) => void;
  maximizeChat: (conversationId: string) => void;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  createConversation: (userId: string, userName: string, userAvatar?: string, userRole?: string) => Promise<string>;
  createGroup: (groupName: string, memberIds: string[], members: GroupMember[]) => Promise<string>;

  initMockData: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeChats: [],
  minimizedChats: [],
  availableUsers: [],
  isLoading: false,

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const conversations = await apiClient.chat.getConversations();
      set({ conversations });
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAvailableUsers: async () => {
    try {
      const users = await apiClient.users.list();
      console.log('Fetched users from backend:', users);

      // Map backend users to Chat User interface
      const mappedUsers: User[] = users.map((u: any) => ({
        id: String(u.id),
        name: `${u.first_name} ${u.last_name}`,
        avatar: u.avatar || `https://ui-avatars.com/api/?name=${u.first_name}+${u.last_name}`,
        role: u.role,
        isOnline: false
      }));

      console.log('Mapped users:', mappedUsers);
      console.log('Available roles:', [...new Set(mappedUsers.map(u => u.role))]);

      set({ availableUsers: mappedUsers });
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  },

  createConversation: async (userId: string, userName: string, userAvatar?: string, userRole?: string) => {
    const state = get();

    const existing = state.conversations.find(c => c.participantId === userId);
    if (existing) return existing.id;

    try {
      // Call real API
      const conversation = await apiClient.chat.createConversation([parseInt(userId)]);

      const newConversation: ChatConversation = {
        id: String(conversation.id),
        participantId: userId,
        participantName: userName,
        participantAvatar: userAvatar,
        participantRole: userRole,
        unreadCount: 0,
        isOnline: false,
        messages: [],
        isGroup: false,
      };

      set({ conversations: [...state.conversations, newConversation] });
      return String(conversation.id);
    } catch (error) {
      console.error("Failed to create conversation", error);
      return "";
    }
  },

  createGroup: async (groupName: string, memberIds: string[], members: GroupMember[]) => {
    try {
      const state = get();
      const newGroup: GroupChat = {
        id: `group_${Date.now()}`,
        participantId: `group_${Date.now()}`,
        participantName: groupName,
        groupName,
        isGroup: true,
        memberIds,
        members,
        admins: ['current_user'],
        createdBy: 'current_user',
        createdAt: new Date().toISOString(),
        unreadCount: 0,
        isOnline: true,
        messages: [],
      };
      set({ conversations: [...state.conversations, newGroup] });
      return newGroup.id;
    } catch (error) {
      console.error("Failed to create group", error);
      return "";
    }
  },

  openChat: async (conversationId: string) => {
    const state = get();
    const minimizedChats = state.minimizedChats.filter(c => c.conversationId !== conversationId);

    if (!state.activeChats.includes(conversationId)) {
      const newActiveChats = [...state.activeChats, conversationId].slice(-3);
      set({
        activeChats: newActiveChats,
        minimizedChats
      });

      try {
        const messages = await apiClient.chat.getMessages(conversationId);
        set(state => ({
          conversations: state.conversations.map(c =>
            c.id === conversationId ? { ...c, messages } : c
          )
        }));
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }

    } else {
      set({ minimizedChats });
    }
  },

  closeChat: (conversationId: string) => {
    set(state => ({
      activeChats: state.activeChats.filter(id => id !== conversationId),
      minimizedChats: state.minimizedChats.filter(c => c.conversationId !== conversationId),
    }));
  },

  minimizeChat: (conversationId: string) => {
    const state = get();
    const conversation = state.conversations.find(c => c.id === conversationId);

    if (conversation) {
      const minimized: MinimizedChat = {
        conversationId: conversation.id,
        participantName: conversation.participantName,
        participantAvatar: conversation.participantAvatar,
        unreadCount: conversation.unreadCount,
        isGroup: conversation.isGroup,
      };

      set({
        activeChats: state.activeChats.filter(id => id !== conversationId),
        minimizedChats: [...state.minimizedChats, minimized],
      });
    }
  },

  maximizeChat: (conversationId: string) => {
    const state = get();
    const newActiveChats = [...state.activeChats, conversationId].slice(-3);
    set({
      minimizedChats: state.minimizedChats.filter(c => c.conversationId !== conversationId),
      activeChats: newActiveChats,
    });
  },

  sendMessage: async (conversationId: string, text: string) => {
    const state = get();

    // Optimistic update
    const optimisticMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: 'current_user',
      senderName: 'You',
      text,
      timestamp: new Date().toISOString(),
      read: true,
    };

    set({
      conversations: state.conversations.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: [...conv.messages, optimisticMessage],
            lastMessage: text,
            lastMessageTime: optimisticMessage.timestamp,
          };
        }
        return conv;
      })
    });

    try {
      const sentMessage = await apiClient.chat.sendMessage(conversationId, text);

      // Replace optimistic message with real message from backend
      set(state => ({
        conversations: state.conversations.map(conv => {
          if (conv.id === conversationId) {
            const messages = conv.messages.map(msg =>
              msg.id === optimisticMessage.id ? sentMessage : msg
            );
            return { ...conv, messages };
          }
          return conv;
        })
      }));
    } catch (error: any) {
      console.error("Failed to send message", error);
      console.error("Error details:", error.response?.data);

      // Remove optimistic message on error
      set(state => ({
        conversations: state.conversations.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: conv.messages.filter(msg => msg.id !== optimisticMessage.id)
            };
          }
          return conv;
        })
      }));
    }
  },

  initMockData: () => {
    set({ conversations: [] });
  },
}));
