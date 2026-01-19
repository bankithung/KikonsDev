'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CalendarIcon, MapPin, Briefcase, User as UserIcon, Shield, User as LucideUser, Eye, Edit, Trash2, X, UserPlus } from 'lucide-react';
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

  const handleDelete = (id: string) => {
    if (confirm('Remove this user?')) {
      deleteMutation.mutate(id);
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
      {/* Action Button */}
      <div className="flex justify-end">
        <Button onClick={handleOpenCreate} className="h-8 text-xs bg-teal-600 hover:bg-teal-700">
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
              {users.map((user: User) => (
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
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-xs">
                    No users found. Click "Add User" to create one.
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
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-5xl translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl border bg-white shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 h-[85vh] flex flex-col p-0 overflow-hidden">

            {/* Header */}
            <div className={`px-8 py-5 border-b flex items-center justify-between shrink-0 ${modalMode === 'create' ? 'bg-teal-600' : modalMode === 'edit' ? 'bg-blue-600' : 'bg-slate-800'
              }`}>
              <div className="text-white">
                <Dialog.Title className="text-xl font-bold font-heading tracking-tight">
                  {modalMode === 'create' ? 'Add New Team Member' : modalMode === 'edit' ? 'Edit User Profile' : 'View User Profile'}
                </Dialog.Title>
                <Dialog.Description className="text-teal-100/80 text-xs mt-0.5 font-medium">
                  {modalMode === 'create' ? 'Enter employee details to create account' : modalMode === 'edit' ? 'Update personal or role information' : 'Complete user profile details'}
                </Dialog.Description>
              </div>
              <button onClick={handleCloseModal} className="text-white/70 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full">
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              <div className="max-w-4xl mx-auto space-y-8">

                <form id="userForm" onSubmit={handleSubmit} className="space-y-8">
                  <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100 p-1.5 h-auto rounded-lg gap-1.5">
                      <TabsTrigger value="personal" className="py-2.5 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm rounded-md font-medium text-slate-500 text-sm transition-all duration-200">
                        <UserIcon size={16} className="mr-2.5" /> Personal Details
                      </TabsTrigger>
                      <TabsTrigger value="employment" className="py-2.5 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md font-medium text-slate-500 text-sm transition-all duration-200">
                        <Briefcase size={16} className="mr-2.5" /> Employment
                      </TabsTrigger>
                      <TabsTrigger value="assignment" className="py-2.5 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-md font-medium text-slate-500 text-sm transition-all duration-200">
                        <MapPin size={16} className="mr-2.5" /> Location & Assignment
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="personal" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Core Identity */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Username <span className="text-red-500">*</span></Label>
                          <Input disabled={isView} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="jdoe" className="bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 h-10 font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address <span className="text-red-500">*</span></Label>
                          <Input disabled={isView} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@company.com" className="bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 h-10" />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">First Name</Label>
                          <Input disabled={isView} value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 h-10" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Name</Label>
                          <Input disabled={isView} value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 h-10" />
                        </div>

                        {/* Extended Personal */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</Label>
                          <Input disabled={isView} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+91 98765 43210" className="bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 h-10" />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gender</Label>
                          <Select disabled={isView} value={gender} onValueChange={setGender}>
                            <SelectTrigger className="bg-white border-slate-200 h-10">
                              <SelectValue placeholder="Select Gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date of Birth</Label>
                          <Input disabled={isView} type="date" value={dob ? format(dob, 'yyyy-MM-dd') : ''} onChange={(e) => setDob(e.target.value ? new Date(e.target.value) : undefined)} className="bg-white border-slate-200 h-10" />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Father's / Mother's Name</Label>
                          <Input disabled={isView} value={parentsName} onChange={(e) => setParentsName(e.target.value)} className="bg-white border-slate-200 h-10" />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Religion</Label>
                          {isView ? (
                            <Input disabled value={religion} className="bg-slate-50 h-10" />
                          ) : (
                            <SearchableSelect
                              options={religionOptions}
                              value={religion}
                              onChange={setReligion}
                              placeholder="Select Religion"
                            />
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">State of Origin</Label>
                          {isView ? (
                            <Input disabled value={stateFrom} className="bg-slate-50 h-10" />
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
                          <div className="col-span-full pt-4 border-t border-slate-100">
                            <div className="space-y-2 max-w-md">
                              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {modalMode === 'create' ? 'Set Password' : 'Change Password'} {modalMode === 'create' && <span className="text-red-500">*</span>}
                              </Label>
                              <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={modalMode === 'edit' ? 'Leave blank to keep current' : '••••••••'} className="bg-white border-slate-200 focus:border-teal-500 h-10" />
                            </div>
                            <div className="space-y-2 max-w-md">
                              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Confirm Password {modalMode === 'create' && <span className="text-red-500">*</span>}
                              </Label>
                              <Input type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="bg-white border-slate-200 focus:border-teal-500 h-10" />
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="employment" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Role <span className="text-red-500">*</span></Label>
                          {isView ? (
                            <div className="p-2.5 bg-slate-50 border rounded-md text-sm font-medium text-slate-700">{role}</div>
                          ) : (
                            <SearchableSelect
                              options={roleOptions}
                              value={role}
                              onChange={(val) => setRole(val as any)}
                              placeholder="Select Role..."
                            />
                          )}
                          <p className="text-[10px] text-slate-400">Determines access permissions and dashboard variability.</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date of Joining</Label>
                          <Input disabled={isView} type="date" value={doj ? format(doj, 'yyyy-MM-dd') : ''} onChange={(e) => setDoj(e.target.value ? new Date(e.target.value) : undefined)} className="bg-white border-slate-200 h-10" />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Salary (CTC)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-medium">₹</span>
                            <Input disabled={isView} type="number" value={salary} onChange={(e) => setSalary(e.target.value)} className="pl-8 bg-white border-slate-200 h-10" placeholder="0.00" />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="assignment" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                      <div className="bg-indigo-50/50 p-6 rounded-lg border border-indigo-100 space-y-6">
                        <div className="flex items-start gap-4 mb-2">
                          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                            <MapPin size={20} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-indigo-900">Work Location Assignment</h3>
                            <p className="text-xs text-indigo-700/70 leading-relaxed">Assign the geographic area of responsibility for this employee.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-indigo-900/70 uppercase tracking-wider">Assigned State</Label>
                            {isView ? (
                              <Input disabled value={assignedState} className="bg-white/50 border-indigo-200 h-10 text-indigo-900" />
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

                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-indigo-900/70 uppercase tracking-wider">Assigned District</Label>
                            {isView ? (
                              <Input disabled value={assignedDistrict} className="bg-white/50 border-indigo-200 h-10 text-indigo-900" />
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

                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-xs font-bold text-indigo-900/70 uppercase tracking-wider">Specific Location / Branch</Label>
                            <Input disabled={isView} value={assignedLocation} onChange={(e) => setAssignedLocation(e.target.value)} placeholder="e.g. MG Road Branch, 2nd Floor" className="bg-white border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500/20 h-10" />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </form>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-slate-50 flex justify-end gap-3 shrink-0">
              <Button type="button" variant="outline" onClick={handleCloseModal} className="h-10 px-6 border-slate-300 text-slate-700 hover:bg-slate-100 font-medium">
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
                  className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md transition-all"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Profile
                </Button>
              )}
              {!isView && (
                <Button
                  type="submit"
                  form="userForm"
                  disabled={!isFormValid() || createUserMutation.isPending || updateUserMutation.isPending}
                  className={`h-10 px-8 font-semibold shadow-md transition-all ${!isFormValid() ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' :
                    modalMode === 'create' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                  {modalMode === 'create' ? 'Create Team Member' : 'Save Changes'}
                </Button>
              )}
            </div>

          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
