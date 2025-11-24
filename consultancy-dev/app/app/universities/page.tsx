'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, DollarSign, GraduationCap, Search, Filter, Eye, X, Star, Globe } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

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
  const [selectedUni, setSelectedUni] = useState<University | null>(null);

  const { data: universities = [], isLoading } = useQuery({
    queryKey: ['universities'],
    queryFn: apiClient.universities.list,
  });

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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">University Database</h1>
        <p className="text-sm text-slate-600 mt-1 font-body">Search and compare universities worldwide</p>
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
    </div>
  );
}

