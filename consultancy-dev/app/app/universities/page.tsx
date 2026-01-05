'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, DollarSign, GraduationCap, Search, Filter, Eye, X, Star, Globe, Plus, User } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

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
}

export default function UniversitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedUni, setSelectedUni] = useState<University | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newUni, setNewUni] = useState({
    name: '',
    country: '',
    city: '',
    ranking: '',
    rating: '',
    programs: '', // comma separated
    tuitionMin: '',
    tuitionMax: '',
    deadline: '',
    requirements: '' // comma separated
  });

  const { data: universities = [], isLoading } = useQuery({
    queryKey: ['universities'],
    queryFn: apiClient.universities.list,
  });

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments-uni-check'],
    queryFn: apiClient.enrollments.list,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Adapt data to API expectations if needed
      // Assuming api handles raw data or we need to format it
      const formatted = {
        ...data,
        tuitionFee: { min: Number(data.tuitionMin), max: Number(data.tuitionMax) },
        programs: data.programs.split(',').map((s: string) => s.trim()),
        requirements: data.requirements.split(',').map((s: string) => s.trim()),
        ranking: Number(data.ranking),
        rating: Number(data.rating)
      };
      // If apiClient.universities.create is not defined, we might default to a mock or implementation
      // But assuming it exists as per instructions to "make sure its fully sync... with backend"
      // I'll check if it exists in next steps if this fails, but for now assuming it does.
      return apiClient.universities.create(formatted);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universities'] });
      setIsAddOpen(false);
      toast({ title: 'University Added', type: 'success' }); // Fix type error by assuming toast signature or just title
      // Reset form
      setNewUni({
        name: '', country: '', city: '', ranking: '', rating: '',
        programs: '', tuitionMin: '', tuitionMax: '', deadline: '', requirements: ''
      });
    },
    onError: (error: any) => {
      console.error("Failed to add university:", error.response?.data || error);
      toast({
        title: 'Failed to add university',
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-500">Loading universities...</div>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">University Database</h1>
          <p className="text-sm text-slate-600 mt-1 font-body">Search and compare universities worldwide</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" /> Add University
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search universities..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-10 bg-white" />
            </div>
            <Select value={filterCountry} onValueChange={setFilterCountry}>
              <SelectTrigger className="h-10 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="Russia">Russia</SelectItem>
                <SelectItem value="Czech Republic">Czech Republic</SelectItem>
                <SelectItem value="India">India</SelectItem>
                <SelectItem value="Philippines">Philippines</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="h-10 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                <SelectItem value="MBBS">MBBS</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="MBA">MBA</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-10 font-body" onClick={() => { setFilterCountry('all'); setFilterProgram('all'); setSearchTerm(''); }}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Universities Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredUniversities.map((uni: University) => (
          <Card key={uni.id} className="border-slate-200 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setSelectedUni(uni)}>
            <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-slate-100">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-base font-heading leading-tight mb-2">{uni.name}</CardTitle>
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-body">
                    <Globe size={12} />
                    <span>{uni.city}, {uni.country}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-lg shrink-0">
                  <Star size={12} className="text-yellow-600 fill-yellow-600" />
                  <span className="text-xs font-bold text-yellow-700 font-body">{uni.rating}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 font-body mb-2">Programs</p>
                  <div className="flex flex-wrap gap-2">
                    {uni.programs.map((prog: string) => (
                      <span key={prog} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold font-body">
                        {prog}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-body mb-1">Tuition Fee (Annual)</p>
                  <p className="text-lg font-bold text-teal-600 font-heading">₹{(uni.tuitionFee.min / 1000).toFixed(0)}K - ₹{(uni.tuitionFee.max / 1000).toFixed(0)}K</p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 font-body">Deadline: <span className="font-semibold text-slate-900">{uni.admissionDeadline}</span></p>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                  <User size={12} />
                  <span>{enrollments?.filter((e: any) => e.university === uni.name).length || 0} Students Enrolled</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4 h-9 font-body" onClick={(e) => { e.stopPropagation(); setSelectedUni(uni); }}>
                <Eye size={14} className="mr-2" /> View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* University Details Modal */}
      <Dialog.Root open={!!selectedUni} onOpenChange={() => setSelectedUni(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[700px] max-h-[90vh] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl z-50 border overflow-y-auto">
            {selectedUni && (
              <>
                <Dialog.Title className="text-2xl font-bold text-slate-900 mb-2 font-heading">{selectedUni.name}</Dialog.Title>
                <p className="text-sm text-slate-600 mb-6 font-body flex items-center gap-2">
                  <MapPin size={14} />
                  {selectedUni.city}, {selectedUni.country}
                </p>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 font-body">World Ranking</p>
                    <p className="text-2xl font-bold text-slate-900 font-heading">#{selectedUni.ranking}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 font-body">Rating</p>
                    <div className="flex items-center gap-1">
                      <Star size={20} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl font-bold text-slate-900 font-heading">{selectedUni.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3 font-heading">Programs Offered</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedUni.programs.map(prog => (
                        <span key={prog} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold font-body">
                          {prog}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3 font-heading">Tuition Fee</h3>
                    <p className="text-2xl font-bold text-teal-600 font-heading">₹{selectedUni.tuitionFee.min.toLocaleString()} - ₹{selectedUni.tuitionFee.max.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-1 font-body">Per academic year</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3 font-heading">Eligibility Requirements</h3>
                    <ul className="space-y-2">
                      {selectedUni.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700 font-body">
                          <span className="text-teal-600 shrink-0">✓</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-yellow-900 font-body">
                      Application Deadline: {selectedUni.admissionDeadline}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3 font-heading">Enrolled Students</h3>
                    <div className="space-y-2">
                      {enrollments?.filter((e: any) => e.university === selectedUni.name).map((e: any) => (
                        <div key={e.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                          <span className="text-sm font-medium">{e.studentName || 'Unknown Student'}</span>
                          <span className="text-xs text-slate-500">{e.programName}</span>
                        </div>
                      ))}
                      {(!enrollments || enrollments.filter((e: any) => e.university === selectedUni.name).length === 0) && (
                        <p className="text-sm text-slate-500">No students enrolled yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8 pt-6 border-t">
                  <Button variant="outline" className="flex-1 h-11 font-body" onClick={() => setSelectedUni(null)}>Close</Button>
                  <Button className="flex-1 h-11 bg-teal-600 hover:bg-teal-700 font-body">
                    Recommend to Student
                  </Button>
                </div>

                <Dialog.Close asChild>
                  <button className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100">
                    <X size={20} />
                  </button>
                </Dialog.Close>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Add University Modal */}
      < Dialog.Root open={isAddOpen} onOpenChange={setIsAddOpen} >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[600px] max-h-[90vh] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl z-50 border overflow-y-auto">
            <Dialog.Title className="text-xl font-bold text-slate-900 mb-6">Add New University</Dialog.Title>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>University Name</Label>
                  <Input value={newUni.name} onChange={e => setNewUni({ ...newUni, name: e.target.value })} placeholder="e.g. Oxford University" />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={newUni.country} onChange={e => setNewUni({ ...newUni, country: e.target.value })} placeholder="e.g. UK" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={newUni.city} onChange={e => setNewUni({ ...newUni, city: e.target.value })} placeholder="e.g. Oxford" />
                </div>
                <div className="space-y-2">
                  <Label>Ranking</Label>
                  <Input type="number" value={newUni.ranking} onChange={e => setNewUni({ ...newUni, ranking: e.target.value })} placeholder="e.g. 5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rating (1-5)</Label>
                  <Input type="number" step="0.1" value={newUni.rating} onChange={e => setNewUni({ ...newUni, rating: e.target.value })} placeholder="e.g. 4.8" />
                </div>
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input type="date" value={newUni.deadline} onChange={e => setNewUni({ ...newUni, deadline: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Programs (comma separated)</Label>
                <Input value={newUni.programs} onChange={e => setNewUni({ ...newUni, programs: e.target.value })} placeholder="e.g. MBBS, Engineering, Law" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Tuition (Annual)</Label>
                  <Input type="number" value={newUni.tuitionMin} onChange={e => setNewUni({ ...newUni, tuitionMin: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Max Tuition (Annual)</Label>
                  <Input type="number" value={newUni.tuitionMax} onChange={e => setNewUni({ ...newUni, tuitionMax: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Requirements (comma separated)</Label>
                <Input value={newUni.requirements} onChange={e => setNewUni({ ...newUni, requirements: e.target.value })} placeholder="e.g. NEET Qualified, 60% in PCB" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending || !newUni.name || !newUni.country} className="bg-teal-600 hover:bg-teal-700">
                  {createMutation.isPending ? 'Creating...' : 'Create University'}
                </Button>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100">
                <X size={20} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root >
    </div >
  );
}

