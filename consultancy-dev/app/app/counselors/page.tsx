'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  TrendingUp,
  Trophy,
  ChevronRight,
  Search,
  Mail,
  Phone,
  MapPin,
  UserPlus,
  Briefcase,
  Calendar,
  Activity,
  Filter,
  LayoutGrid,
  List,
  Star,
  Clock,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'EMPLOYEE': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'COUNSELOR': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'MANAGER': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'SALES': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'HR': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  'ACCOUNTS': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'OPERATIONS': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'IT_SUPPORT': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'TEAM_LEADER': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export default function CounselorsPage() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch team members with company filtering
  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ['team-members', user?.company_id],
    queryFn: async () => {
      const allUsers = await apiClient.users.list();
      return allUsers.filter((u: any) =>
        u.company_id === user?.company_id &&
        ['EMPLOYEE', 'COUNSELOR', 'MANAGER', 'SALES', 'ACCOUNTS', 'HR', 'OPERATIONS', 'IT_SUPPORT', 'TEAM_LEADER'].includes(u.role)
      );
    },
    enabled: !!user?.company_id,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const active = teamMembers.filter((m: any) => m.is_active).length;
    const total = teamMembers.length;
    const roles = new Set(teamMembers.map((m: any) => m.role));
    return {
      total,
      active,
      inactive: total - active,
      activityRate: total > 0 ? Math.round((active / total) * 100) : 0,
      uniqueRoles: roles.size
    };
  }, [teamMembers]);

  // Filter team members
  const filteredMembers = useMemo(() => {
    return teamMembers.filter((member: any) => {
      const fullName = `${member.first_name || ''} ${member.last_name || ''}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone_number?.includes(searchTerm);

      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && member.is_active) ||
        (statusFilter === 'inactive' && !member.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [teamMembers, searchTerm, roleFilter, statusFilter]);

  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'DEV_ADMIN';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-sm text-slate-500">Loading team data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Button */}
      {isAdmin && (
        <div className="flex justify-end">
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 h-8 text-xs" asChild>
            <Link href="/app/users">
              <UserPlus size={14} className="mr-1" /> Add Team Member
            </Link>
          </Button>
        </div>
      )}

      {/* Stats Row - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-medium uppercase">Total Team</p>
                <p className="text-xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg">
                <Users size={16} className="text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-medium uppercase">Active</p>
                <p className="text-xl font-bold text-emerald-600">{stats.active}</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Activity size={16} className="text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-medium uppercase">Inactive</p>
                <p className="text-xl font-bold text-slate-400">{stats.inactive}</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg">
                <Clock size={16} className="text-slate-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-medium uppercase">Activity Rate</p>
                <p className="text-xl font-bold text-blue-600">{stats.activityRate}%</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp size={16} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 col-span-2 lg:col-span-1">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-medium uppercase">Departments</p>
                <p className="text-xl font-bold text-purple-600">{stats.uniqueRoles}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Briefcase size={16} className="text-purple-600" />
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
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 w-36 text-xs">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                <SelectItem value="COUNSELOR">Counselor</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="SALES">Sales</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="ACCOUNTS">Accounts</SelectItem>
                <SelectItem value="OPERATIONS">Operations</SelectItem>
                <SelectItem value="IT_SUPPORT">IT Support</SelectItem>
                <SelectItem value="TEAM_LEADER">Team Leader</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-32 text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === 'grid' ? 'bg-teal-600 text-white' : 'bg-white text-slate-400 hover:text-slate-600'
                )}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 transition-colors border-l border-slate-200",
                  viewMode === 'list' ? 'bg-teal-600 text-white' : 'bg-white text-slate-400 hover:text-slate-600'
                )}
              >
                <List size={16} />
              </button>
            </div>

            {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="h-9 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Members Display */}
      {filteredMembers.length === 0 ? (
        <Card className="border-slate-200 border-dashed">
          <CardContent className="py-12 text-center">
            <Users size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'No team members found matching your filters.'
                : 'No team members found.'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredMembers.map((member: any) => {
            const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.username;
            const initial = fullName.charAt(0).toUpperCase();
            const roleStyle = ROLE_COLORS[member.role] || ROLE_COLORS['EMPLOYEE'];

            return (
              <Card
                key={member.id}
                className="border-slate-200 hover:border-teal-200 hover:shadow-md transition-all group overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Top banner */}
                  <div className={cn("h-1.5", roleStyle.bg)} />

                  <div className="p-4">
                    {/* Avatar and Name */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="relative">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={fullName}
                            className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className={cn("w-11 h-11 rounded-full flex items-center justify-center border-2 border-white shadow-sm", roleStyle.bg)}>
                            <span className={cn("text-base font-bold", roleStyle.text)}>{initial}</span>
                          </div>
                        )}
                        <span
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
                            member.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate text-sm">{fullName}</h3>
                        <span className={cn(
                          "inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                          roleStyle.bg, roleStyle.text, roleStyle.border, "border"
                        )}>
                          {member.role.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Contact Info - Compact */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Mail size={11} className="text-slate-400 shrink-0" />
                        <span className="truncate">{member.email || '-'}</span>
                      </div>
                      {member.phone_number && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Phone size={11} className="text-slate-400 shrink-0" />
                          <span>{member.phone_number}</span>
                        </div>
                      )}
                      {(member.assigned_district || member.assigned_state) && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <MapPin size={11} className="text-slate-400 shrink-0" />
                          <span className="truncate">
                            {[member.assigned_district, member.assigned_state].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                      {member.date_of_joining && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar size={11} className="text-slate-400 shrink-0" />
                          <span>Joined {format(new Date(member.date_of_joining), 'MMM yyyy')}</span>
                        </div>
                      )}
                    </div>

                    {/* View Profile Button */}
                    <Link href={`/app/counselors/${member.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 group-hover:border-teal-300"
                      >
                        View Profile
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List View */
        <Card className="border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase">Team Member</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase">Role</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase hidden md:table-cell">Contact</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase hidden lg:table-cell">Location</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-slate-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member: any, index: number) => {
                  const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.username;
                  const initial = fullName.charAt(0).toUpperCase();
                  const roleStyle = ROLE_COLORS[member.role] || ROLE_COLORS['EMPLOYEE'];

                  return (
                    <tr
                      key={member.id}
                      className={cn(
                        "border-b border-slate-100 hover:bg-slate-50 transition-colors",
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-25'
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            {member.avatar ? (
                              <img src={member.avatar} alt={fullName} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", roleStyle.bg)}>
                                <span className={cn("text-xs font-bold", roleStyle.text)}>{initial}</span>
                              </div>
                            )}
                            <span
                              className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white",
                                member.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                              )}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{fullName}</p>
                            <p className="text-[10px] text-slate-500 md:hidden">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn(
                          "text-[10px] font-medium px-2 py-1 rounded-full",
                          roleStyle.bg, roleStyle.text
                        )}>
                          {member.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 hidden md:table-cell">
                        <div className="space-y-0.5">
                          <p className="text-xs text-slate-600">{member.email || '-'}</p>
                          {member.phone_number && (
                            <p className="text-[10px] text-slate-500">{member.phone_number}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 hidden lg:table-cell">
                        <p className="text-xs text-slate-600 truncate max-w-[150px]">
                          {[member.assigned_district, member.assigned_state].filter(Boolean).join(', ') || '-'}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn(
                          "text-[10px] font-medium px-2 py-1 rounded-full",
                          member.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        )}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Link
                          href={`/app/counselors/${member.id}`}
                          className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                        >
                          View <ChevronRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2.5 bg-slate-50 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Showing {filteredMembers.length} of {teamMembers.length} team members
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
