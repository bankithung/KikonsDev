'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Filter, Search, Eye, Edit, Trash2, X, Phone, Mail, GraduationCap, Users } from 'lucide-react';
import { Enquiry } from '@/lib/types';
import { format } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuthStore } from '@/store/authStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RequestActionModal } from '@/components/ui/RequestActionModal';
import { toast } from '@/store/toastStore';
import { INDIAN_STATES, SCHOOL_BOARDS, COURSES, PREFERRED_LOCATIONS, GENDERS, getAvatarColor, getInitials } from '@/lib/utils';

export default function EnquiriesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStream, setFilterStream] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewEnquiry, setViewEnquiry] = useState<Enquiry | null>(null);
  const [actionEnquiry, setActionEnquiry] = useState<Enquiry | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterState, setFilterState] = useState<string>('all');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterBoard, setFilterBoard] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');

  const { data: enquiries, isLoading } = useQuery({
    queryKey: ['enquiries'],
    queryFn: apiClient.enquiries.list,
  });

  const { data: registrations } = useQuery({
    queryKey: ['registrations-check'],
    queryFn: apiClient.registrations.list,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.enquiries.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      setShowConfirm(false);
      setActionEnquiry(null);
      toast.success('Enquiry deleted successfully');
    },
    onError: (error) => {
      console.error("Failed to delete enquiry", error);
      toast.error('Failed to delete enquiry');
    }
  });

  const requestMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      if (!actionEnquiry) return;
      await apiClient.approvalRequests.create({
        action: 'DELETE',
        entity_type: 'enquiry',
        entity_id: Number(actionEnquiry.id),
        entity_name: actionEnquiry.candidateName,
        message: data.message,
      });
    },
    onSuccess: () => {
      setShowRequest(false);
      setActionEnquiry(null);
      toast.success('Delete request sent to admin for approval');
    },
    onError: (error) => {
      console.error("Failed to create request", error);
      alert('Failed to create request');
    }
  });

  const handleDirectDelete = () => {
    if (actionEnquiry) {
      deleteMutation.mutate(actionEnquiry.id);
    }
  };

  const handleSubmitRequest = (message: string) => {
    requestMutation.mutate({ message });
  };

  const handleDeleteClick = (enquiry: Enquiry) => {
    setActionEnquiry(enquiry);

    if (user?.role === 'COMPANY_ADMIN' || user?.role === 'DEV_ADMIN') {
      setShowConfirm(true);
    } else {
      setShowRequest(true);
    }
  };

  const filteredEnquiries = enquiries?.filter(enq => {
    const matchesSearch = enq.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enq.mobile.includes(searchTerm) ||
      enq.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (enq.status === 'Converted') return false;

    const matchesStatus = filterStatus === 'all' || enq.status === filterStatus;
    const matchesStream = filterStream === 'all' || enq.stream === filterStream;
    const matchesGender = filterGender === 'all' || enq.gender === filterGender;
    const matchesState = filterState === 'all' || enq.familyState === filterState || enq.schoolState === filterState;
    const matchesCourse = filterCourse === 'all' || enq.courseInterested?.includes(filterCourse);
    const matchesBoard = filterBoard === 'all' || enq.schoolBoard === filterBoard || enq.class10Board === filterBoard;
    const matchesLocation = filterLocation === 'all' || enq.preferredLocations?.includes(filterLocation);

    return matchesSearch && matchesStatus && matchesStream && matchesGender && matchesState && matchesCourse && matchesBoard && matchesLocation;
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-pulse text-slate-500">Loading enquiries...</div></div>;

  return (
    <div className="space-y-2">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <Filter className="mr-1 h-3 w-3" /> Filters
        </Button>
        <Button onClick={() => router.push('/app/enquiries/new')} size="sm" className="h-8 text-xs bg-teal-600 hover:bg-teal-700">
          <Plus className="mr-1 h-3 w-3" /> New Enquiry
        </Button>
      </div>

      {/* Filters Panel - Compact Design */}
      {isFilterOpen && (
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Converted">Converted</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStream} onValueChange={setFilterStream}>
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue placeholder="Stream" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Streams</SelectItem>
                <SelectItem value="Science">Science</SelectItem>
                <SelectItem value="Commerce">Commerce</SelectItem>
                <SelectItem value="Arts">Arts</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterGender} onValueChange={setFilterGender}>
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                {GENDERS.map((gender) => (
                  <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All States</SelectItem>
                {INDIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Courses</SelectItem>
                {COURSES.map((course) => (
                  <SelectItem key={course} value={course}>{course}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterBoard} onValueChange={setFilterBoard}>
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue placeholder="Board" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Boards</SelectItem>
                {SCHOOL_BOARDS.map((board) => (
                  <SelectItem key={board} value={board}>{board}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Locations</SelectItem>
                {PREFERRED_LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="sm"
              className="h-9 text-xs bg-slate-600 hover:bg-slate-700 text-white"
              onClick={() => {
                setFilterStatus('all');
                setFilterStream('all');
                setFilterGender('all');
                setFilterState('all');
                setFilterCourse('all');
                setFilterBoard('all');
                setFilterLocation('all');
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by name, mobile, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-9 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500 text-sm"
        />
      </div>

      {/* Table */}
      <Card className="border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Candidate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden lg:table-cell">Academic</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden sm:table-cell">Added By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredEnquiries && filteredEnquiries.length > 0 ? (
                filteredEnquiries.map((enquiry) => (
                  <tr key={enquiry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${getAvatarColor(enquiry.candidateName).bg} ${getAvatarColor(enquiry.candidateName).text}`}>
                          {getInitials(enquiry.candidateName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{enquiry.candidateName}</p>
                          <p className="text-xs text-slate-500 truncate sm:hidden">{enquiry.mobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 hidden md:table-cell">
                      <div className="space-y-0.5">
                        <p className="text-xs text-slate-700 flex items-center gap-1">
                          <Phone size={11} className="text-slate-400" />
                          {enquiry.mobile}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail size={11} className="text-slate-400" />
                          {enquiry.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-2 hidden lg:table-cell">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{enquiry.courseInterested}</p>
                        <p className="text-xs text-slate-500">{enquiry.stream} • {enquiry.schoolName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-600 hidden sm:table-cell">
                      {format(new Date(enquiry.date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-600 hidden sm:table-cell">
                      {enquiry.created_by_name || '-'}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${enquiry.status === 'New' ? 'bg-blue-100 text-blue-700' :
                        enquiry.status === 'Converted' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                        {enquiry.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => setViewEnquiry(enquiry)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-teal-50 hover:text-teal-600"
                          onClick={() => router.push(`/app/enquiries/${enquiry.id}`)}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDeleteClick(enquiry)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <GraduationCap size={40} className="text-slate-300" />
                      <p className="font-medium">No enquiries found</p>
                      <p className="text-xs">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick View Modal */}
      <Dialog.Root open={!!viewEnquiry} onOpenChange={() => setViewEnquiry(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] h-[85vh] w-[90vw] max-w-[900px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-xl focus:outline-none z-50 border border-slate-200 overflow-hidden flex flex-col">
            {viewEnquiry && (
              <EnquiryViewModal enquiry={viewEnquiry} onClose={() => setViewEnquiry(null)} router={router} />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Confirmation Dialog for Admins */}
      <ConfirmDialog
        open={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setActionEnquiry(null);
        }}
        onConfirm={handleDirectDelete}
        title="Delete Enquiry"
        description={
          actionEnquiry
            ? `Are you sure you want to delete the enquiry from ${actionEnquiry.candidateName}? This action cannot be undone.`
            : 'Are you sure you want to delete this enquiry?'
        }
        confirmText="Delete"
        confirmVariant="destructive"
        isLoading={deleteMutation.isPending}
      />

      {/* Request Modal for Employees */}
      <RequestActionModal
        open={showRequest}
        onClose={() => {
          setShowRequest(false);
          setActionEnquiry(null);
        }}
        onSubmit={handleSubmitRequest}
        action="DELETE"
        entityType="Enquiry"
        entityName={actionEnquiry?.candidateName || ''}
        isLoading={requestMutation.isPending}
      />
    </div>
  );
}

// Tab configuration for the modal
const MODAL_TABS = [
  { id: 'personal', label: 'Personal', icon: Users },
  { id: 'family', label: 'Family & Address', icon: Users },
  { id: 'hslc', label: 'HSLC (Class 10)', icon: GraduationCap },
  { id: 'hsslc', label: 'HSSLC (Class 12)', icon: GraduationCap },
  { id: 'scores', label: 'Science & NEET', icon: GraduationCap },
  { id: 'preferences', label: 'Preferences', icon: Filter },
];

// Enquiry View Modal Component with Tabs
function EnquiryViewModal({ enquiry, onClose, router }: { enquiry: Enquiry; onClose: () => void; router: any }) {
  const [activeTab, setActiveTab] = useState('personal');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <div className="space-y-6">
            {/* Student Header */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl ${getAvatarColor(enquiry.candidateName).bg} ${getAvatarColor(enquiry.candidateName).text}`}>
                  {getInitials(enquiry.candidateName)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{enquiry.candidateName}</h3>
                  <p className="text-sm text-slate-600">ID: {enquiry.id}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs bg-white px-2 py-1 rounded border border-teal-200">{enquiry.gender || 'N/A'}</span>
                    <span className="text-xs bg-white px-2 py-1 rounded border border-teal-200">DOB: {enquiry.dob ? format(new Date(enquiry.dob), 'dd MMM yyyy') : 'N/A'}</span>
                    {enquiry.caste && <span className="text-xs bg-white px-2 py-1 rounded border border-teal-200">{enquiry.caste}</span>}
                    {enquiry.religion && <span className="text-xs bg-white px-2 py-1 rounded border border-teal-200">{enquiry.religion}</span>}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${enquiry.status === 'New' ? 'bg-blue-100 text-blue-700' : enquiry.status === 'Converted' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                  {enquiry.status}
                </span>
              </div>
            </div>

            {/* Contact Details */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <ModalField label="Mobile" value={enquiry.mobile} icon={Phone} />
                <ModalField label="Email" value={enquiry.email} icon={Mail} />
                <ModalField label="Enquiry Date" value={format(new Date(enquiry.date), 'dd MMM yyyy')} />
                <ModalField label="Course Interested" value={enquiry.courseInterested} icon={GraduationCap} />
              </div>
            </div>
          </div>
        );

      case 'family':
        return (
          <div className="space-y-6">
            {/* Father's Details */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Father's Information</h4>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <ModalField label="Name" value={enquiry.fatherName || '-'} />
                  <ModalField label="Occupation" value={enquiry.fatherOccupation || '-'} />
                  <ModalField label="Mobile" value={enquiry.fatherMobile || '-'} icon={Phone} />
                </div>
              </div>
            </div>

            {/* Mother's Details */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Mother's Information</h4>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <ModalField label="Name" value={enquiry.motherName || '-'} />
                  <ModalField label="Occupation" value={enquiry.motherOccupation || '-'} />
                  <ModalField label="Mobile" value={enquiry.motherMobile || '-'} icon={Phone} />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Address Details</h4>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <ModalField label="City/Place" value={enquiry.familyPlace || '-'} />
                  <ModalField label="State" value={enquiry.familyState || '-'} />
                  <div className="col-span-2">
                    <ModalField label="Permanent Address" value={enquiry.permanentAddress || '-'} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'hslc':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">HSLC / Class 10 Details</h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <ModalField label="School Name" value={enquiry.class10SchoolName || '-'} />
                  <ModalField label="Board" value={enquiry.class10Board || '-'} />
                  <ModalField label="Passing Year" value={enquiry.class10PassingYear || '-'} />
                  <ModalField label="Percentage" value={enquiry.class10Percentage ? `${enquiry.class10Percentage}%` : '-'} />
                  <ModalField label="City/Place" value={enquiry.class10Place || '-'} />
                  <ModalField label="State" value={enquiry.class10State || '-'} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'hsslc':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">HSSLC / Class 12 Details</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <ModalField label="School Name" value={enquiry.schoolName || '-'} />
                  <ModalField label="Board" value={enquiry.schoolBoard || '-'} />
                  <ModalField label="Stream" value={enquiry.stream || '-'} />
                  <ModalField label="Passing Year" value={enquiry.class12PassingYear || '-'} />
                  <ModalField label="Percentage" value={enquiry.class12Percentage ? `${enquiry.class12Percentage}%` : '-'} />
                  <ModalField label="City/Place" value={enquiry.schoolPlace || '-'} />
                  <ModalField label="State" value={enquiry.schoolState || '-'} />
                </div>
              </div>
            </div>

            {/* Gap Year / Dropout */}
            {(enquiry.gapYear || enquiry.collegeDropout) && (
              <div className="flex gap-3">
                {enquiry.gapYear && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Gap Year</span>
                    {enquiry.gapYearFrom && enquiry.gapYearTo && <span className="text-sm text-slate-600">({enquiry.gapYearFrom} - {enquiry.gapYearTo})</span>}
                  </div>
                )}
                {enquiry.collegeDropout && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">College Dropout</span>
                )}
              </div>
            )}
          </div>
        );

      case 'scores':
        return (
          <div className="space-y-6">
            {/* Science Scorecard */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Science Scorecard</h4>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ModalField label="Physics" value={enquiry.physicsMarks || '-'} />
                  <ModalField label="Chemistry" value={enquiry.chemistryMarks || '-'} />
                  <ModalField label="Biology" value={enquiry.biologyMarks || '-'} />
                  <ModalField label="Maths" value={enquiry.mathsMarks || '-'} />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-purple-200">
                  <ModalField label="PCB %" value={enquiry.pcbPercentage ? `${enquiry.pcbPercentage}%` : '-'} />
                  <ModalField label="PCM %" value={enquiry.pcmPercentage ? `${enquiry.pcmPercentage}%` : '-'} />
                </div>
              </div>
            </div>

            {/* NEET Scores */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">NEET Scores</h4>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <ModalField label="Previous NEET Score" value={enquiry.previousNeetMarks || '-'} />
                  <ModalField label="Present NEET Score" value={enquiry.presentNeetMarks || '-'} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Preferred Education Hubs</h4>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                {enquiry.preferredLocations?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {enquiry.preferredLocations.map((loc: string) => (
                      <span key={loc} className="px-3 py-1.5 bg-white border border-orange-200 rounded-lg text-sm text-slate-700">{loc}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No preferred locations selected</p>
                )}
              </div>
            </div>

            {enquiry.otherLocation && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">Other Preferred Location</h4>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-900">{enquiry.otherLocation}</p>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Budget / Payment</h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-700">
                  {enquiry.paymentAmount ? `₹${enquiry.paymentAmount.toLocaleString()}` : '-'}
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <Dialog.Title className="text-lg font-bold text-slate-900">Enquiry Details</Dialog.Title>
        <Dialog.Close asChild>
          <button className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </Dialog.Close>
      </div>

      {/* Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Tabs */}
        <div className="w-48 border-r border-slate-200 p-2 flex flex-col gap-1 bg-slate-50">
          {MODAL_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${isActive ? 'bg-teal-600 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
        <Button variant="outline" className="h-10 px-6 border-slate-300 hover:bg-slate-100" onClick={onClose}>
          Close
        </Button>
        <Button
          className="h-10 px-6 bg-teal-600 hover:bg-teal-700"
          onClick={() => {
            router.push(`/app/student-profile/enquiry/${enquiry.id}`);
            onClose();
          }}
        >
          <Edit size={16} className="mr-2" /> View Full Profile
        </Button>
      </div>
    </>
  );
}

// Field display component for the modal
function ModalField({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
        {Icon && <Icon size={12} className="text-slate-400" />}
        {label}
      </p>
      <p className="text-sm text-slate-900 font-medium bg-white px-3 py-2 rounded border border-slate-200">{value}</p>
    </div>
  );
}

function InfoItem({ label, value, icon: Icon }: any) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
        {Icon && <Icon size={12} className="text-slate-400" />}
        {label}
      </p>
      <p className="text-sm text-slate-900 font-medium">{value}</p>
    </div>
  );
}
