'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CalendarIcon, MapPin, Briefcase, User as UserIcon, Shield, User as LucideUser, Eye, Edit, Trash2, X, UserPlus, Search, Users, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as Dialog from '@radix-ui/react-dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { INDIAN_STATES, RELIGIONS, APP_ROLES } from '@/lib/indian_states';

import { useToast } from '@/hooks/use-toast';
import { User } from '@/lib/types';

export default function UsersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [religionFilter, setReligionFilter] = useState<string>('all');

  // Form State
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'EMPLOYEE' | 'MANAGER' | 'COMPANY_ADMIN'>('EMPLOYEE');

  // Extended Profile State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<string>('');
  const [dob, setDob] = useState<Date | undefined>(undefined);
  const [parentsName, setParentsName] = useState('');
  const [religion, setReligion] = useState('');
  const [stateFrom, setStateFrom] = useState('');
  const [doj, setDoj] = useState<Date | undefined>(undefined);
  const [salary, setSalary] = useState('');
  const [assignedState, setAssignedState] = useState('');
  const [assignedDistrict, setAssignedDistrict] = useState('');
  const [assignedLocation, setAssignedLocation] = useState('');
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: apiClient.users.list,
  });

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((user: User) => {
      const matchesSearch = searchQuery === '' ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone_number?.includes(searchQuery);
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesState = stateFilter === 'all' || user.assigned_state === stateFilter;
      const matchesGender = genderFilter === 'all' || user.gender === genderFilter;
      const matchesReligion = religionFilter === 'all' || user.religion === religionFilter;
      return matchesSearch && matchesRole && matchesState && matchesGender && matchesReligion;
    });
  }, [users, searchQuery, roleFilter, stateFilter, genderFilter, religionFilter]);

  const createUserMutation = useMutation({
    mutationFn: apiClient.users.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleCloseModal();
      toast({
        title: "Success",
        description: "User account created successfully!",
        type: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create user.",
        type: "error"
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.users.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleCloseModal();
      toast({
        title: "Success",
        description: "User updated successfully!",
        type: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update user.",
        type: "error"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: apiClient.users.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Success",
        description: "User deleted successfully!",
        type: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete user.",
        type: "error"
      });
    }
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    populateForm(user);
    setIsModalOpen(true);
  };

  const handleOpenView = (user: User) => {
    setModalMode('view');
    setSelectedUser(user);
    populateForm(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    resetForm();
  };

  const resetForm = () => {
    setUsername('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRole('EMPLOYEE');

    // Reset Extended Fields
    setPhoneNumber('');
    setGender('');
    setDob(undefined);
    setParentsName('');
    setReligion('');
    setStateFrom('');
    setDoj(undefined);
    setSalary('');
    setAssignedState('');
    setAssignedDistrict('');
    setAssignedLocation('');
  };

  const populateForm = (user: User) => {
    setUsername(user.username);
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setEmail(user.email);
    setRole(user.role as any);
    setPassword('');
    setConfirmPassword('');

    // Populate Extended Fields
    setPhoneNumber(user.phone_number || '');
    setGender(user.gender || '');
    setDob(user.dob ? new Date(user.dob) : undefined);
    setParentsName(user.parents_name || '');
    setReligion(user.religion || '');
    setStateFrom(user.state_from || '');
    setDoj(user.date_of_joining ? new Date(user.date_of_joining) : undefined);
    setSalary(user.salary ? String(user.salary) : '');
    setAssignedState(user.assigned_state || '');
    setAssignedDistrict(user.assigned_district || '');
    setAssignedLocation(user.assigned_location || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userData: any = {
      username,
      first_name: firstName,
      last_name: lastName,
      email,
      role,

      // Extended Fields
      phone_number: phoneNumber,
      gender,
      dob: dob ? format(dob, 'yyyy-MM-dd') : null,
      parents_name: parentsName,
      religion,
      state_from: stateFrom,
      date_of_joining: doj ? format(doj, 'yyyy-MM-dd') : null,
      salary: salary || null,
      assigned_state: assignedState,
      assigned_district: assignedDistrict,
      assigned_location: assignedLocation,
    };

    if (modalMode === 'create') {
      if (password !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match!",
          type: "error"
        });
        return;
      }
      userData.password = password;
      createUserMutation.mutate(userData);
    } else if (modalMode === 'edit' && selectedUser) {
      if (password) {
        if (password !== confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match!",
            type: "error"
          });
          return;
        }
        userData.password = password;
      }
      updateUserMutation.mutate({ id: String(selectedUser.id), data: userData });
    }
  };

  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteUserId(id);
  };

  const confirmDelete = () => {
    if (deleteUserId) {
      deleteMutation.mutate(deleteUserId);
      setDeleteUserId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-500">Loading users...</div>
      </div>
    );
  }

  // Computed Options
  const stateOptions = Object.keys(INDIAN_STATES).map(s => ({ value: s, label: s }));
  const districtOptions = assignedState && INDIAN_STATES[assignedState]
    ? INDIAN_STATES[assignedState].map(d => ({ value: d, label: d }))
    : [];

  const stateFromOptions = Object.keys(INDIAN_STATES).map(s => ({ value: s, label: s }));
  const religionOptions = RELIGIONS.map(r => ({ value: r, label: r }));
  const roleOptions = APP_ROLES;

  const isView = modalMode === 'view';

  const isFormValid = () => {
    // Basic Fields
    if (!username || !email || !role) return false;

    // Password Validation for Create Mode
    if (modalMode === 'create') {
      if (!password || !confirmPassword) return false;
      if (password !== confirmPassword) return false;
    }

    // Password Validation for Edit Mode (Optional but must match if entered)
    if (modalMode === 'edit' && password) {
      if (password !== confirmPassword) return false;
    }

    return true;
  };

  return (
    <div className="space-y-4">
      {/* Search, Filters & Add Button - All in one row */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[180px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-slate-50 border-slate-200 text-xs"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[120px] h-9 bg-slate-50 border-slate-200 text-xs shrink-0">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="COMPANY_ADMIN">Admin</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="EMPLOYEE">Employee</SelectItem>
          </SelectContent>
        </Select>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-[140px] h-9 bg-slate-50 border-slate-200 text-xs shrink-0">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="all">All States</SelectItem>
            {Object.keys(INDIAN_STATES).map((state) => (
              <SelectItem key={state} value={state}>{state}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-[100px] h-9 bg-slate-50 border-slate-200 text-xs shrink-0">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Gender</SelectItem>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={religionFilter} onValueChange={setReligionFilter}>
          <SelectTrigger className="w-[120px] h-9 bg-slate-50 border-slate-200 text-xs shrink-0">
            <SelectValue placeholder="Religion" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Religions</SelectItem>
            {RELIGIONS.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(searchQuery || roleFilter !== 'all' || stateFilter !== 'all' || genderFilter !== 'all' || religionFilter !== 'all') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSearchQuery(''); setRoleFilter('all'); setStateFilter('all'); setGenderFilter('all'); setReligionFilter('all'); }}
            className="h-9 px-3 text-xs shrink-0"
          >
            Clear
          </Button>
        )}
        <div className="flex-1" />
        <Button onClick={handleOpenCreate} className="h-9 text-xs bg-teal-600 hover:bg-teal-700 shrink-0">
          <UserPlus className="mr-2 h-3.5 w-3.5" /> Add User
        </Button>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-slate-500 font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-2.5 w-[250px]">User</th>
                <th className="px-4 py-2.5 hidden md:table-cell">Email</th>
                <th className="px-4 py-2.5 hidden lg:table-cell">Phone</th>
                <th className="px-4 py-2.5 w-[120px]">Role</th>
                <th className="px-4 py-2.5 hidden xl:table-cell">Location</th>
                <th className="px-4 py-2.5 w-[100px] hidden sm:table-cell">Status</th>
                <th className="px-4 py-2.5 w-[100px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredUsers.map((user: User) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-4 py-2.5 align-middle">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs ring-2 ring-white border border-blue-50">
                        {(user.first_name || user.username).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 text-xs">{user.first_name || user.username}</span>
                        <span className="text-[10px] text-slate-500 md:hidden">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 hidden md:table-cell align-middle">{user.email}</td>
                  <td className="px-4 py-2.5 text-slate-600 hidden lg:table-cell align-middle whitespace-nowrap">{user.phone_number || '-'}</td>
                  <td className="px-4 py-2.5 align-middle">
                    <div className="flex items-center gap-1.5">
                      {user.role === 'COMPANY_ADMIN' || user.role === 'MANAGER' ? <Shield size={12} className="text-teal-600" /> : <LucideUser size={12} className="text-slate-400" />}
                      <span className="font-medium text-slate-700">{user.role === 'COMPANY_ADMIN' ? 'Admin' : user.role === 'MANAGER' ? 'Manager' : 'Employee'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 hidden xl:table-cell align-middle">
                    <span className="text-slate-600 text-[11px] font-medium leading-tight">
                      {user.assigned_state ? (
                        <>
                          {user.assigned_district ? `${user.assigned_district}, ` : ''}{user.assigned_state}
                        </>
                      ) : <span className="text-slate-400 italic">Unassigned</span>}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell align-middle">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right align-middle">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenView(user)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View Details">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleOpenEdit(user)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Edit User">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(String(user.id))} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete User">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-xs">
                    {searchQuery || roleFilter !== 'all' || stateFilter !== 'all' || genderFilter !== 'all' || religionFilter !== 'all'
                      ? 'No users match your search or filters.'
                      : 'No users found. Click "Add User" to create one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-all duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[95vw] sm:w-[90vw] md:w-full md:max-w-4xl translate-x-[-50%] translate-y-[-50%] rounded-xl border border-slate-200 bg-white shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 h-[90vh] sm:h-[85vh] flex flex-col overflow-hidden">

            {/* Header - Fixed 72px */}
            <div className={`h-[72px] px-4 sm:px-6 py-3.5 border-b flex items-center justify-between shrink-0 ${modalMode === 'create' ? 'bg-teal-600' : modalMode === 'edit' ? 'bg-blue-600' : 'bg-slate-800'
              }`}>
              <div className="text-white flex-1 min-w-0">
                <Dialog.Title className="text-base sm:text-lg font-bold font-heading tracking-tight truncate">
                  {modalMode === 'create' ? 'Add New Team Member' : modalMode === 'edit' ? 'Edit User Profile' : 'View User Profile'}
                </Dialog.Title>
                <Dialog.Description className="text-white/70 text-[10px] sm:text-[11px] mt-0.5 font-medium truncate">
                  {modalMode === 'create' ? 'Enter employee details to create account' : modalMode === 'edit' ? 'Update personal or role information' : 'Complete user profile details'}
                </Dialog.Description>
              </div>
              <button onClick={handleCloseModal} className="text-white/70 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full ml-2 shrink-0">
                <X size={18} />
              </button>
            </div>

            {/* Tabs Bar - Fixed 60px */}
            <Tabs defaultValue="personal" className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="h-[60px] px-4 sm:px-5 pt-3 pb-2 bg-slate-50/50 border-b border-slate-100 shrink-0">
                <TabsList className="grid w-full grid-cols-3 h-[44px] bg-white border border-slate-200 p-0.5 rounded-lg gap-0.5 shadow-sm">
                  <TabsTrigger value="personal" className="h-full rounded-md data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-sm font-medium text-slate-600 text-[11px] sm:text-xs transition-all duration-200 hover:bg-slate-50">
                    <UserIcon size={14} className="mr-1 sm:mr-1.5 shrink-0" />
                    <span className="truncate">Personal</span>
                  </TabsTrigger>
                  <TabsTrigger value="employment" className="h-full rounded-md data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm font-medium text-slate-600 text-[11px] sm:text-xs transition-all duration-200 hover:bg-slate-50">
                    <Briefcase size={14} className="mr-1 sm:mr-1.5 shrink-0" />
                    <span className="truncate">Employment</span>
                  </TabsTrigger>
                  <TabsTrigger value="assignment" className="h-full rounded-md data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm font-medium text-slate-600 text-[11px] sm:text-xs transition-all duration-200 hover:bg-slate-50">
                    <MapPin size={14} className="mr-1 sm:mr-1.5 shrink-0" />
                    <span className="truncate">Location</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto bg-slate-50/50 min-h-0">
                <div className="p-4 sm:p-5">
                  <form id="userForm" onSubmit={handleSubmit}>

                    <TabsContent value="personal" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Core Identity */}
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-slate-600">Username <span className="text-red-500">*</span></Label>
                            <Input disabled={isView} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="jdoe" className="bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 h-9 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-slate-600">Email Address <span className="text-red-500">*</span></Label>
                            <Input disabled={isView} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@company.com" className="bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 h-9 text-sm" />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-slate-600">First Name</Label>
                            <Input disabled={isView} value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 h-9 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-slate-600">Last Name</Label>
                            <Input disabled={isView} value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 h-9 text-sm" />
                          </div>

                          {/* Extended Personal */}
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-slate-600">Phone Number</Label>
                            <Input disabled={isView} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+91 98765 43210" className="bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 h-9 text-sm" />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-slate-600">Gender</Label>
                            <Select disabled={isView} value={gender} onValueChange={setGender}>
                              <SelectTrigger className="bg-white border-slate-200 h-9 text-sm">
                                <SelectValue placeholder="Select Gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-slate-600">Date of Birth</Label>
                            <Input disabled={isView} type="date" value={dob ? format(dob, 'yyyy-MM-dd') : ''} onChange={(e) => setDob(e.target.value ? new Date(e.target.value) : undefined)} className="bg-white border-slate-200 h-9 text-sm" />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-slate-600">Father's / Mother's Name</Label>
                            <Input disabled={isView} value={parentsName} onChange={(e) => setParentsName(e.target.value)} className="bg-white border-slate-200 h-9 text-sm" />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-slate-600">Religion</Label>
                            {isView ? (
                              <Input disabled value={religion} className="bg-slate-50 border-slate-200 h-9 text-sm" />
                            ) : (
                              <SearchableSelect
                                options={religionOptions}
                                value={religion}
                                onChange={setReligion}
                                placeholder="Select Religion"
                              />
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-slate-600">State of Origin</Label>
                            {isView ? (
                              <Input disabled value={stateFrom} className="bg-slate-50 border-slate-200 h-9 text-sm" />
                            ) : (
                              <SearchableSelect
                                options={stateFromOptions}
                                value={stateFrom}
                                onChange={setStateFrom}
                                placeholder="Search State..."
                              />
                            )}
                          </div>

                          {/* Password Scoped */}
                          {(modalMode !== 'view') && (
                            <div className="col-span-full pt-3 border-t border-slate-100">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-[11px] font-semibold text-slate-600">
                                    {modalMode === 'create' ? 'Set Password' : 'Change Password'} {modalMode === 'create' && <span className="text-red-500">*</span>}
                                  </Label>
                                  <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={modalMode === 'edit' ? 'Leave blank to keep current' : '••••••••'} className="bg-white border-slate-200 focus:border-teal-500 h-9 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[11px] font-semibold text-slate-600">
                                    Confirm Password {modalMode === 'create' && <span className="text-red-500">*</span>}
                                  </Label>
                                  <Input type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="bg-white border-slate-200 focus:border-teal-500 h-9 text-sm" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="employment" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <div className="space-y-1.5 md:col-span-2">
                          <Label className="text-[11px] font-semibold text-slate-600">System Role <span className="text-red-500">*</span></Label>
                          {isView ? (
                            <div className="p-2 bg-slate-50 border border-slate-200 rounded-md text-sm font-medium text-slate-700">{role}</div>
                          ) : (
                            <SearchableSelect
                              options={roleOptions}
                              value={role}
                              onChange={(val) => setRole(val as any)}
                              placeholder="Select Role..."
                            />
                          )}
                          <p className="text-[10px] text-slate-400 mt-1">Determines access permissions and dashboard variability.</p>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-semibold text-slate-600">Date of Joining</Label>
                          <Input disabled={isView} type="date" value={doj ? format(doj, 'yyyy-MM-dd') : ''} onChange={(e) => setDoj(e.target.value ? new Date(e.target.value) : undefined)} className="bg-white border-slate-200 h-9 text-sm" />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-semibold text-slate-600">Salary (CTC)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-400 text-sm font-medium">₹</span>
                            <Input disabled={isView} type="number" value={salary} onChange={(e) => setSalary(e.target.value)} className="pl-8 bg-white border-slate-200 h-9 text-sm" placeholder="0.00" />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="assignment" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                      <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                            <MapPin size={16} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm text-indigo-900">Work Location Assignment</h3>
                            <p className="text-[11px] text-indigo-700/70 leading-relaxed">Assign the geographic area of responsibility for this employee.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-indigo-900/70">Assigned State</Label>
                            {isView ? (
                              <Input disabled value={assignedState} className="bg-white/50 border-indigo-200 h-9 text-sm text-indigo-900" />
                            ) : (
                              <SearchableSelect
                                options={stateOptions}
                                value={assignedState}
                                onChange={(val) => {
                                  setAssignedState(val);
                                  setAssignedDistrict(''); // Reset district on state change
                                }}
                                placeholder="Select State"
                              />
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-indigo-900/70">Assigned District</Label>
                            {isView ? (
                              <Input disabled value={assignedDistrict} className="bg-white/50 border-indigo-200 h-9 text-sm text-indigo-900" />
                            ) : (
                              <SearchableSelect
                                options={districtOptions}
                                value={assignedDistrict}
                                onChange={setAssignedDistrict}
                                placeholder={assignedState ? "Select District" : "Select State First"}
                                disabled={!assignedState}
                              />
                            )}
                          </div>

                          <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-[11px] font-semibold text-indigo-900/70">Specific Location / Branch</Label>
                            <Input disabled={isView} value={assignedLocation} onChange={(e) => setAssignedLocation(e.target.value)} placeholder="e.g. MG Road Branch, 2nd Floor" className="bg-white border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500/20 h-9 text-sm" />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </form>
                </div>
              </div>
            </Tabs>

            {/* Footer - Fixed 60px */}
            <div className="h-[60px] px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
              <Button type="button" variant="outline" onClick={handleCloseModal} className="h-11 px-4 sm:px-6 text-sm border-slate-300 text-slate-700 hover:bg-slate-100 font-medium">
                Cancel
              </Button>
              {isView && (
                <Button
                  type="button"
                  onClick={() => {
                    if (selectedUser) {
                      router.push(`/app/counselors/${selectedUser.id}`);
                    }
                  }}
                  className="h-11 px-4 sm:px-6 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md transition-all"
                >
                  <Eye className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">View Profile</span>
                  <span className="sm:hidden">View</span>
                </Button>
              )}
              {!isView && (
                <Button
                  type="submit"
                  form="userForm"
                  disabled={!isFormValid() || createUserMutation.isPending || updateUserMutation.isPending}
                  className={`h-11 px-4 sm:px-6 text-sm font-semibold shadow-md transition-all ${!isFormValid() ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' :
                    modalMode === 'create' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                  <span className="hidden sm:inline">{modalMode === 'create' ? 'Create Team Member' : 'Save Changes'}</span>
                  <span className="sm:hidden">{modalMode === 'create' ? 'Create' : 'Save'}</span>
                </Button>
              )}
            </div>

          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root >

      {/* Delete Confirmation Modal */}
      < Dialog.Root open={deleteUserId !== null
      } onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-all duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 p-6 overflow-hidden">

            <div className="flex gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <Dialog.Title className="text-lg font-bold text-slate-900 mb-2">
                  Delete User
                </Dialog.Title>
                <Dialog.Description className="text-sm text-slate-600 leading-relaxed">
                  Are you sure you want to delete this user? This action cannot be undone.
                </Dialog.Description>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteUserId(null)}
                className="h-11 px-6 text-sm border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmDelete}
                className="h-11 px-6 text-sm bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md"
              >
                Delete
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root >

    </div >
  );
}
