'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Users, Check } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface User {
  id: string;
  name: string;
  avatar?: string;
  role: string;
}

const MOCK_USERS: User[] = [
  { id: 'user_1', name: 'Sarah Johnson', avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson', role: 'Employee' },
  { id: 'user_2', name: 'Mike Chen', avatar: 'https://ui-avatars.com/api/?name=Mike+Chen', role: 'Manager' },
  { id: 'user_3', name: 'Emily Davis', avatar: 'https://ui-avatars.com/api/?name=Emily+Davis', role: 'Employee' },
  { id: 'user_4', name: 'James Wilson', avatar: 'https://ui-avatars.com/api/?name=James+Wilson', role: 'Admin' },
  { id: 'user_5', name: 'Lisa Anderson', avatar: 'https://ui-avatars.com/api/?name=Lisa+Anderson', role: 'Employee' },
  { id: 'user_6', name: 'Robert Taylor', avatar: 'https://ui-avatars.com/api/?name=Robert+Taylor', role: 'Manager' },
  { id: 'user_7', name: 'Chubatemjen Jamir', avatar: 'https://ui-avatars.com/api/?name=Chubatemjen+Jamir', role: 'Developer' },
];

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { createGroup, openChat } = useChatStore();

  const filteredUsers = MOCK_USERS.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleCreate = () => {
    if (groupName.trim() && selectedUsers.length >= 2) {
      const members = MOCK_USERS.filter(u => selectedUsers.includes(u.id)).map(u => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        role: u.role,
      }));
      
      const groupId = createGroup(groupName, selectedUsers, members);
      openChat(groupId);
      
      // Reset and close
      setGroupName('');
      setSelectedUsers([]);
      setSearchTerm('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col border border-slate-200"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create Group</h2>
            <p className="text-sm text-slate-500 mt-1">Add members to start chatting</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Group Name */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Group Name</Label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="h-11"
            />
          </div>

          {/* Search Members */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Add Members (min. 2)</Label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="h-11"
            />
          </div>

          {/* Selected Count */}
          {selectedUsers.length > 0 && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
              <p className="text-sm font-medium text-teal-900">
                {selectedUsers.length} member{selectedUsers.length > 1 ? 's' : ''} selected
              </p>
            </div>
          )}

          {/* User List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                onClick={() => toggleUser(user.id)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  selectedUsers.includes(user.id)
                    ? 'bg-teal-50 border-2 border-teal-500'
                    : 'bg-slate-50 border-2 border-transparent hover:border-slate-200'
                }`}
              >
                <div className="relative shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-semibold">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  {selectedUsers.includes(user.id) && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center ring-2 ring-white">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-11 bg-teal-600 hover:bg-teal-700"
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedUsers.length < 2}
          >
            Create Group
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

