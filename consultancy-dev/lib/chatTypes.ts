export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface ChatConversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  participantRole?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline: boolean;
  messages: ChatMessage[];
  isGroup?: boolean;
}

export interface GroupChat extends ChatConversation {
  isGroup: true;
  groupName: string;
  groupAvatar?: string;
  memberIds: string[];
  members: GroupMember[];
  admins: string[];
  createdBy: string;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  isAdmin?: boolean;
}

export interface MinimizedChat {
  conversationId: string;
  participantName: string;
  participantAvatar?: string;
  unreadCount: number;
  isGroup?: boolean;
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  isOnline: boolean;
}
