'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, ArrowRight, Filter as FilterIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function DocumentTrackingPage() {
  const [filterType, setFilterType] = useState('all');
  
  // Mock data for tracking
  const events = [
      { id: 1, date: new Date(), title: 'Document Uploaded', desc: '10th Marksheet uploaded by Admin', status: 'done', type: 'upload' },
      { id: 2, date: new Date(Date.now() - 86400000), title: 'Status Changed to OUT', desc: 'Given to verification team', status: 'done', type: 'status' },
      { id: 3, date: new Date(Date.now() - 172800000), title: 'Transfer Initiated', desc: 'Sent to Main Branch', status: 'done', type: 'transfer' },
      { id: 4, date: new Date(Date.now() - 259200000), title: 'Document Received', desc: 'Acknowledged by branch manager', status: 'done', type: 'receive' },
  ];

  const filteredEvents = filterType === 'all' ? events : events.filter(e => e.type === filterType);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">Document Tracking</h1>
          <p className="text-sm text-slate-600 mt-1 font-body">Track document history and transfers</p>
        </div>
        <div className="w-full sm:w-64">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-10 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="upload">Uploads</SelectItem>
              <SelectItem value="status">Status Changes</SelectItem>
              <SelectItem value="transfer">Transfers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card className="border-slate-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-slate-100">
              <CardTitle className="text-lg font-semibold font-heading">Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 py-2">
                  {filteredEvents.map((event, idx) => (
                      <div key={event.id} className="relative pl-8">
                          <span className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full ring-4 ring-white ${
                            event.type === 'upload' ? 'bg-blue-600' :
                            event.type === 'status' ? 'bg-teal-600' :
                            event.type === 'transfer' ? 'bg-purple-600' :
                            'bg-green-600'
                          }`}></span>
                          <div className="pb-8 border-b border-slate-100 last:border-0">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                                  <div>
                                      <h3 className="text-base font-bold text-slate-900 font-heading">{event.title}</h3>
                                      <p className="text-sm text-slate-600 font-body mt-1">{event.desc}</p>
                                  </div>
                                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                                      {format(event.date, 'dd MMM yyyy, HH:mm')}
                                  </span>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
