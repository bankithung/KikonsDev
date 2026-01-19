'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, Star, Search, Plus, Globe, GraduationCap, Calendar, Eye, TrendingUp, Award, MoreHorizontal } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';

interface University {
  id: string;
  name: string;
  country: string;
  city: string;
  ranking: number;
  programs: string[];
  tuitionFee: { min: number; max: number };
  admissionDeadline: string;
  requirements: string[];
  rating: number;
  company_id?: string;
}

export default function UniversitiesPage() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedUni, setSelectedUni] = useState<University | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'programs' | 'requirements'>('basic');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newUni, setNewUni] = useState({
    name: '', country: '', city: '', ranking: '', rating: '',
    programs: '', tuitionMin: '', tuitionMax: '', deadline: '', requirements: ''
  });

  const [editUni, setEditUni] = useState({
    name: '', country: '', city: '', ranking: '', rating: '',
    programs: '', tuitionMin: '', tuitionMax: '', deadline: '', requirements: ''
  });

  const { data: universities = [], isLoading } = useQuery({
    queryKey: ['universities', user?.company_id],
    queryFn: async () => {
      const allUniversities = await apiClient.universities.list();
      return allUniversities.filter((uni: any) =>
        !uni.company_id || uni.company_id === user?.company_id
      );
    },
    enabled: !!user?.company_id,
  });

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments-uni-check'],
    queryFn: apiClient.enrollments.list,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const formatted = {
        ...data,
        company_id: user?.company_id,
        tuitionFee: { min: Number(data.tuitionMin), max: Number(data.tuitionMax) },
        programs: data.programs.split(',').map((s: string) => s.trim()).filter((s: string) => s),
        requirements: data.requirements.split(',').map((s: string) => s.trim()).filter((s: string) => s),
        ranking: Number(data.ranking) || 0,
        rating: Number(data.rating) || 0
      };
      return apiClient.universities.create(formatted);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universities'] });
      setIsAddOpen(false);
      setActiveTab('basic');
      toast({ title: 'University Added', type: 'success' });
      setNewUni({
        name: '', country: '', city: '', ranking: '', rating: '',
        programs: '', tuitionMin: '', tuitionMax: '', deadline: '', requirements: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add university',
        description: error.response?.data ? JSON.stringify(error.response.data) : 'Unknown error',
        type: 'error'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const formatted = {
        ...data,
        company_id: user?.company_id,
        tuitionFee: { min: Number(data.tuitionMin), max: Number(data.tuitionMax) },
        programs: data.programs.split(',').map((s: string) => s.trim()).filter((s: string) => s),
        requirements: data.requirements.split(',').map((s: string) => s.trim()).filter((s: string) => s),
        ranking: Number(data.ranking) || 0,
        rating: Number(data.rating) || 0
      };
      return apiClient.universities.update(id, formatted);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universities'] });
      setIsEditMode(false);
      setSelectedUni(null);
      setActiveTab('basic');
      toast({ title: 'University Updated', type: 'success' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update university',
        description: error.response?.data ? JSON.stringify(error.response.data) : 'Unknown error',
        type: 'error'
      });
    }
  });

  const handleCreate = () => {
    if (!newUni.name || !newUni.country) {
      toast({ title: 'Validation Error', description: 'Name and Country are required', type: 'error' });
      return;
    }
    createMutation.mutate(newUni);
  };

  const handleUpdate = () => {
    if (!editUni.name || !editUni.country || !selectedUni) {
      toast({ title: 'Validation Error', description: 'Name and Country are required', type: 'error' });
      return;
    }
    updateMutation.mutate({ id: selectedUni.id, data: editUni });
  };

  const startEdit = (uni: University) => {
    setEditUni({
      name: uni.name,
      country: uni.country,
      city: uni.city,
      ranking: String(uni.ranking),
      rating: String(uni.rating),
      programs: uni.programs.join(', '),
      tuitionMin: String(uni.tuitionFee.min),
      tuitionMax: String(uni.tuitionFee.max),
      deadline: uni.admissionDeadline,
      requirements: uni.requirements.join(', ')
    });
    setIsEditMode(true);
    setActiveTab('basic');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-slate-400">Loading universities...</div>
      </div>
    );
  }

  const filteredUniversities = universities.filter((uni: University) => {
    const matchesSearch = uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uni.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = filterCountry === 'all' || uni.country === filterCountry;
    const matchesProgram = filterProgram === 'all' || uni.programs.includes(filterProgram);
    return matchesSearch && matchesCountry && matchesProgram;
  });

  const countries = Array.from(new Set(universities.map((u: University) => u.country)));
  const allPrograms = Array.from(new Set(universities.flatMap((u: University) => u.programs)));

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{filteredUniversities.length} universities worldwide</p>
        <Button onClick={() => setIsAddOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white h-9">
          <Plus size={14} className="mr-1.5" />
          Add University
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search universities or cities..."
            className="pl-9 h-9 border-slate-200 bg-slate-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterCountry} onValueChange={setFilterCountry}>
          <SelectTrigger className="w-[160px] h-9 border-slate-200 bg-slate-50">
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map((country: string) => (
              <SelectItem key={country} value={country}>{country}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterProgram} onValueChange={setFilterProgram}>
          <SelectTrigger className="w-[160px] h-9 border-slate-200 bg-slate-50">
            <SelectValue placeholder="All Programs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            {allPrograms.map((program: string) => (
              <SelectItem key={program} value={program}>{program}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(searchTerm || filterCountry !== 'all' || filterProgram !== 'all') && (
          <Button variant="outline" onClick={() => { setSearchTerm(''); setFilterCountry('all'); setFilterProgram('all'); }} className="h-9 px-3">
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      {filteredUniversities.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-sm font-medium">
            {searchTerm || filterCountry !== 'all' || filterProgram !== 'all'
              ? 'No universities found matching your filters.'
              : 'No universities found. Add your first university!'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">University</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Ranking</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Programs</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Tuition Fee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Deadline</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Students</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUniversities.map((uni: University) => (
                  <tr key={uni.id} className="hover:bg-slate-50 transition-colors">
                    {/* University Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center shrink-0">
                          <Building2 size={16} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 line-clamp-1">{uni.name}</p>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{uni.city}, {uni.country}</span>
                      </div>
                    </td>

                    {/* Ranking */}
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-sm font-semibold text-slate-700">
                        <Award size={12} className="text-slate-500" />
                        #{uni.ranking || 'N/A'}
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded border border-yellow-200">
                        <Star size={12} className="text-yellow-600 fill-yellow-600" />
                        <span className="text-sm font-bold text-yellow-700">{uni.rating}</span>
                      </div>
                    </td>

                    {/* Programs */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {uni.programs.slice(0, 3).map((prog: string) => (
                          <span key={prog} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold border border-blue-100">
                            {prog}
                          </span>
                        ))}
                        {uni.programs.length > 3 && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                            +{uni.programs.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Tuition Fee */}
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-teal-600">
                        ₹{(uni.tuitionFee.min / 1000).toFixed(0)}K - ₹{(uni.tuitionFee.max / 1000).toFixed(0)}K
                      </div>
                      <div className="text-[10px] text-slate-500">per year</div>
                    </td>

                    {/* Deadline */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Calendar size={12} className="text-slate-400" />
                        <span className="text-xs">{uni.admissionDeadline || 'Rolling'}</span>
                      </div>
                    </td>

                    {/* Students */}
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 rounded border border-blue-100">
                        <GraduationCap size={12} className="text-blue-600" />
                        <span className="text-sm font-semibold text-blue-700">
                          {enrollments?.filter((e: any) => e.university === uni.name).length || 0}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                        onClick={() => setSelectedUni(uni)}
                      >
                        <Eye size={14} className="mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View/Edit University Modal */}
      <Dialog.Root open={!!selectedUni} onOpenChange={(open) => {
        if (!open) {
          setSelectedUni(null);
          setIsEditMode(false);
          setActiveTab('basic');
        }
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] w-[95vw] max-w-[900px] h-[85vh] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-xl z-50 border flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div>
                <Dialog.Title className="text-xl font-bold text-slate-900">
                  {isEditMode ? 'Edit University' : selectedUni?.name}
                </Dialog.Title>
                <p className="text-sm text-slate-500 mt-0.5">
                  {isEditMode ? 'Update university details below' : 'View university details'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isEditMode && (
                  <Button variant="outline" size="sm" onClick={() => selectedUni && startEdit(selectedUni)} className="h-8">
                    Edit Details
                  </Button>
                )}
                <Dialog.Close asChild>
                  <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 15 15" fill="none"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                  </button>
                </Dialog.Close>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 px-6 shrink-0">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'basic' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
              >
                Basic Info
              </button>
              <button
                onClick={() => setActiveTab('programs')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'programs' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
              >
                Programs & Fees
              </button>
              <button
                onClick={() => setActiveTab('requirements')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'requirements' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
              >
                Requirements
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 bg-slate-50">
              {activeTab === 'basic' && (
                <div className="space-y-4 max-w-4xl">
                  {/* Primary Info */}
                  <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <div className="w-1 h-5 bg-teal-600 rounded-full"></div>
                      Primary Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">University Name</Label>
                        {isEditMode ? (
                          <Input value={editUni.name} onChange={e => setEditUni({ ...editUni, name: e.target.value })} className="h-10 border-slate-300" />
                        ) : (
                          <p className="text-sm font-medium text-slate-900">{selectedUni?.name}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Country</Label>
                        {isEditMode ? (
                          <Select value={editUni.country} onValueChange={(val) => setEditUni({ ...editUni, country: val })}>
                            <SelectTrigger className="h-10 border-slate-300"><SelectValue placeholder="Select Country" /></SelectTrigger>
                            {/* Same countries list as Add Modal - shortened for brevity in this replace block, assume same list */}
                            <SelectContent className="max-h-60">
                              <SelectItem value="Russia">🇷🇺 Russia</SelectItem>
                              <SelectItem value="Czech Republic">🇨🇿 Czech Republic</SelectItem>
                              <SelectItem value="Poland">🇵🇱 Poland</SelectItem>
                              <SelectItem value="Ukraine">🇺🇦 Ukraine</SelectItem>
                              <SelectItem value="Philippines">🇵🇭 Philippines</SelectItem>
                              <SelectItem value="China">🇨🇳 China</SelectItem>
                              <SelectItem value="Bangladesh">🇧🇩 Bangladesh</SelectItem>
                              <SelectItem value="Nepal">🇳🇵 Nepal</SelectItem>
                              <SelectItem value="Kyrgyzstan">🇰🇬 Kyrgyzstan</SelectItem>
                              <SelectItem value="Kazakhstan">🇰🇿 Kazakhstan</SelectItem>
                              <SelectItem value="USA">🇺🇸 USA</SelectItem>
                              <SelectItem value="UK">🇬🇧 UK</SelectItem>
                              <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                              <SelectItem value="Australia">🇦🇺 Australia</SelectItem>
                              <SelectItem value="Germany">🇩🇪 Germany</SelectItem>
                              <SelectItem value="India">🇮🇳 India</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm text-slate-900 flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {selectedUni?.country}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">City</Label>
                        {isEditMode ? (
                          <Input value={editUni.city} onChange={e => setEditUni({ ...editUni, city: e.target.value })} className="h-10 border-slate-300" />
                        ) : (
                          <p className="text-sm text-slate-900">{selectedUni?.city}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Deadline</Label>
                        {isEditMode ? (
                          <Input type="date" value={editUni.deadline} onChange={e => setEditUni({ ...editUni, deadline: e.target.value })} className="h-10 border-slate-300" />
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-slate-900">
                            <Calendar size={14} className="text-slate-400" />
                            {selectedUni?.admissionDeadline || 'Rolling Admission'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ranking & Rating */}
                  <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <div className="w-1 h-5 bg-yellow-600 rounded-full"></div>
                      Rankings & Rating
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">World Ranking</Label>
                        {isEditMode ? (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">#</span>
                            <Input type="number" value={editUni.ranking} onChange={e => setEditUni({ ...editUni, ranking: e.target.value })} className="h-10 border-slate-300 pl-8" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">#{selectedUni?.ranking}</span>
                            <span className="text-xs text-slate-500">Global Rank</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Rating</Label>
                        {isEditMode ? (
                          <Select value={editUni.rating} onValueChange={(val) => setEditUni({ ...editUni, rating: val })}>
                            <SelectTrigger className="h-10 border-slate-300"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5.0">⭐⭐⭐⭐⭐ 5.0</SelectItem>
                              <SelectItem value="4.8">⭐⭐⭐⭐⭐ 4.8</SelectItem>
                              <SelectItem value="4.5">⭐⭐⭐⭐ 4.5</SelectItem>
                              <SelectItem value="4.0">⭐⭐⭐⭐ 4.0</SelectItem>
                              <SelectItem value="3.5">⭐⭐⭐ 3.5</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Star size={16} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-lg font-bold text-slate-900">{selectedUni?.rating}</span>
                            <span className="text-xs text-slate-500 ml-1">Student Satisfaction</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'programs' && (
                <div className="space-y-4 max-w-4xl">
                  <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
                    <Label className="text-sm font-semibold text-slate-700 mb-3 block">Programs Offered</Label>
                    {isEditMode ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-3 bg-slate-50 rounded border">
                        {['MBBS', 'MD', 'BDS', 'BAMS', 'BHMS', 'Engineering', 'B.Tech', 'MBA', 'BBA', 'Law', 'LLB', 'Nursing', 'Pharmacy', 'B.Sc', 'M.Sc', 'Arts', 'Commerce', 'Management'].map(prog => (
                          <label key={prog} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                            <input type="checkbox" checked={editUni.programs.includes(prog)}
                              onChange={e => {
                                const curr = editUni.programs.split(', ').filter(Boolean);
                                if (e.target.checked) setEditUni({ ...editUni, programs: [...curr, prog].join(', ') });
                                else setEditUni({ ...editUni, programs: curr.filter(p => p !== prog).join(', ') });
                              }}
                              className="w-4 h-4 text-teal-600 rounded"
                            />
                            <span className="text-sm">{prog}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedUni?.programs.map(prog => (
                          <span key={prog} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium border border-blue-100">{prog}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
                    <Label className="text-sm font-semibold text-slate-700 mb-3 block">Annual Tuition</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500">Minimum</span>
                        {isEditMode ? (
                          <Input type="number" value={editUni.tuitionMin} onChange={e => setEditUni({ ...editUni, tuitionMin: e.target.value })} className="h-10" />
                        ) : (
                          <p className="text-xl font-bold text-teal-600">₹{selectedUni?.tuitionFee.min.toLocaleString()}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500">Maximum</span>
                        {isEditMode ? (
                          <Input type="number" value={editUni.tuitionMax} onChange={e => setEditUni({ ...editUni, tuitionMax: e.target.value })} className="h-10" />
                        ) : (
                          <p className="text-xl font-bold text-teal-600">₹{selectedUni?.tuitionFee.max.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'requirements' && (
                <div className="max-w-4xl">
                  <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
                    <Label className="text-sm font-semibold text-slate-700 mb-3 block">Eligibility Requirements</Label>
                    {isEditMode ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded border">
                        {['NEET Qualified', '60% in PCB', '50% in PCB', '12th Pass', 'IELTS 6.0+', 'TOEFL 80+', 'Age 17-25', 'English Proficiency', 'Medical Fitness', 'Valid Passport'].map(req => (
                          <label key={req} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                            <input type="checkbox" checked={editUni.requirements.includes(req)}
                              onChange={e => {
                                const curr = editUni.requirements.split(', ').filter(Boolean);
                                if (e.target.checked) setEditUni({ ...editUni, requirements: [...curr, req].join(', ') });
                                else setEditUni({ ...editUni, requirements: curr.filter(r => r !== req).join(', ') });
                              }}
                              className="w-4 h-4 text-teal-600 rounded"
                            />
                            <span className="text-sm">{req}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {selectedUni?.requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 text-xs font-bold">✓</div>
                            {req}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0 gap-3">
              {isEditMode ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditMode(false)} className="h-10">Cancel Editing</Button>
                  <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="bg-teal-600 hover:bg-teal-700 h-10 min-w-32">
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setSelectedUni(null)} className="h-10">Close</Button>
                  <Button className="bg-teal-600 hover:bg-teal-700 h-10 min-w-32">
                    Recommend to Student
                  </Button>
                </>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Add University Modal */}
      <Dialog.Root open={isAddOpen} onOpenChange={(open) => {
        setIsAddOpen(open);
        if (!open) setActiveTab('basic');
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] w-[95vw] max-w-[900px] h-[85vh] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-xl z-50 border flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div>
                <Dialog.Title className="text-xl font-bold text-slate-900">Add New University</Dialog.Title>
                <p className="text-sm text-slate-500 mt-0.5">Fill in the details below to add a university</p>
              </div>
              <Dialog.Close asChild>
                <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 15 15" fill="none"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                </button>
              </Dialog.Close>
            </div>

            <div className="flex border-b border-slate-200 px-6 shrink-0">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'basic' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
              >
                Basic Info
              </button>
              <button
                onClick={() => setActiveTab('programs')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'programs' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
              >
                Programs & Fees
              </button>
              <button
                onClick={() => setActiveTab('requirements')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'requirements' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
              >
                Requirements
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 bg-slate-50">
              {activeTab === 'basic' && (
                <div className="space-y-4 max-w-4xl">
                  <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <div className="w-1 h-5 bg-teal-600 rounded-full"></div>
                      Primary Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                          University Name <span className="text-red-500">*</span>
                        </Label>
                        <Input value={newUni.name} onChange={e => setNewUni({ ...newUni, name: e.target.value })} placeholder="Enter university name" className="h-10 border-slate-300" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                          Country <span className="text-red-500">*</span>
                        </Label>
                        <Select value={newUni.country} onValueChange={(val) => setNewUni({ ...newUni, country: val })}>
                          <SelectTrigger className="h-10 border-slate-300">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            <SelectItem value="Russia">🇷🇺 Russia</SelectItem>
                            <SelectItem value="Czech Republic">🇨🇿 Czech Republic</SelectItem>
                            <SelectItem value="Poland">🇵🇱 Poland</SelectItem>
                            <SelectItem value="Ukraine">🇺🇦 Ukraine</SelectItem>
                            <SelectItem value="Philippines">🇵🇭 Philippines</SelectItem>
                            <SelectItem value="China">🇨🇳 China</SelectItem>
                            <SelectItem value="Bangladesh">🇧🇩 Bangladesh</SelectItem>
                            <SelectItem value="Nepal">🇳🇵 Nepal</SelectItem>
                            <SelectItem value="Kyrgyzstan">🇰🇬 Kyrgyzstan</SelectItem>
                            <SelectItem value="Kazakhstan">🇰🇿 Kazakhstan</SelectItem>
                            <SelectItem value="USA">🇺🇸 USA</SelectItem>
                            <SelectItem value="UK">🇬🇧 UK</SelectItem>
                            <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                            <SelectItem value="Australia">🇦🇺 Australia</SelectItem>
                            <SelectItem value="Germany">🇩🇪 Germany</SelectItem>
                            <SelectItem value="India">🇮🇳 India</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">City</Label>
                        <Input value={newUni.city} onChange={e => setNewUni({ ...newUni, city: e.target.value })} placeholder="Enter city name" className="h-10 border-slate-300" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Application Deadline</Label>
                        <Input type="date" value={newUni.deadline} onChange={e => setNewUni({ ...newUni, deadline: e.target.value })} className="h-10 border-slate-300" />
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <div className="w-1 h-5 bg-yellow-600 rounded-full"></div>
                      Rankings & Rating
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">World Ranking</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">#</span>
                          <Input type="number" value={newUni.ranking} onChange={e => setNewUni({ ...newUni, ranking: e.target.value })} placeholder="150" className="h-10 border-slate-300 pl-8" />
                        </div>
                        <p className="text-xs text-slate-500">Global ranking position</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Overall Rating</Label>
                        <Select value={newUni.rating} onValueChange={(val) => setNewUni({ ...newUni, rating: val })}>
                          <SelectTrigger className="h-10 border-slate-300">
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5.0">⭐⭐⭐⭐⭐ 5.0 - Excellent</SelectItem>
                            <SelectItem value="4.8">⭐⭐⭐⭐⭐ 4.8 - Outstanding</SelectItem>
                            <SelectItem value="4.5">⭐⭐⭐⭐ 4.5 - Very Good</SelectItem>
                            <SelectItem value="4.3">⭐⭐⭐⭐ 4.3 - Very Good</SelectItem>
                            <SelectItem value="4.0">⭐⭐⭐⭐ 4.0 - Good</SelectItem>
                            <SelectItem value="3.8">⭐⭐⭐ 3.8 - Good</SelectItem>
                            <SelectItem value="3.5">⭐⭐⭐ 3.5 - Average</SelectItem>
                            <SelectItem value="3.0">⭐⭐⭐ 3.0 - Average</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">Student satisfaction rating</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'programs' && (
                <div className="space-y-4 max-w-4xl">
                  <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
                    <Label className="text-sm font-semibold text-slate-700 mb-3 block">Programs Offered</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-64 overflow-y-auto p-3 bg-slate-50 rounded border border-slate-200">
                      {['MBBS', 'MD', 'BDS', 'BAMS', 'BHMS', 'Engineering', 'B.Tech', 'MBA', 'BBA', 'Law', 'LLB', 'Nursing', 'Pharmacy', 'B.Sc', 'M.Sc', 'Arts', 'Commerce', 'Management'].map((program) => {
                        const isSelected = newUni.programs.split(',').map(p => p.trim()).includes(program);
                        return (
                          <label key={program} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const currentPrograms = newUni.programs ? newUni.programs.split(',').map(p => p.trim()).filter(p => p) : [];
                                if (e.target.checked) {
                                  setNewUni({ ...newUni, programs: [...currentPrograms, program].join(', ') });
                                } else {
                                  setNewUni({ ...newUni, programs: currentPrograms.filter(p => p !== program).join(', ') });
                                }
                              }}
                              className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                            />
                            <span className="text-sm text-slate-700">{program}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Select all programs that apply</p>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
                    <Label className="text-sm font-semibold text-slate-700 mb-3 block">Annual Tuition Fee (₹)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Minimum Amount</Label>
                        <Input type="number" value={newUni.tuitionMin} onChange={e => setNewUni({ ...newUni, tuitionMin: e.target.value })} placeholder="e.g. 500000" className="h-10 border-slate-300" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Maximum Amount</Label>
                        <Input type="number" value={newUni.tuitionMax} onChange={e => setNewUni({ ...newUni, tuitionMax: e.target.value })} placeholder="e.g. 800000" className="h-10 border-slate-300" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'requirements' && (
                <div className="max-w-4xl">
                  <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
                    <Label className="text-sm font-semibold text-slate-700 mb-3 block">Eligibility Requirements</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-slate-50 rounded border border-slate-200">
                      {['NEET Qualified', '60% in PCB', '50% in PCB', '12th Pass', 'IELTS 6.0+', 'TOEFL 80+', 'Age 17-25', 'English Proficiency', 'Medical Fitness', 'Valid Passport'].map((req) => {
                        const isSelected = newUni.requirements.split(',').map(r => r.trim()).includes(req);
                        return (
                          <label key={req} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const currentReqs = newUni.requirements ? newUni.requirements.split(',').map(r => r.trim()).filter(r => r) : [];
                                if (e.target.checked) {
                                  setNewUni({ ...newUni, requirements: [...currentReqs, req].join(', ') });
                                } else {
                                  setNewUni({ ...newUni, requirements: currentReqs.filter(r => r !== req).join(', ') });
                                }
                              }}
                              className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                            />
                            <span className="text-sm text-slate-700">{req}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Select all eligibility criteria that apply</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
              <div className="text-sm text-slate-600">
                <span className="text-red-500">*</span> Required fields
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsAddOpen(false)} className="h-10">Cancel</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending || !newUni.name || !newUni.country} className="bg-teal-600 hover:bg-teal-700 h-10 min-w-32">
                  {createMutation.isPending ? 'Creating...' : 'Create University'}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
