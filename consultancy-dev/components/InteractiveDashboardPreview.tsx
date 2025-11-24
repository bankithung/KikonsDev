'use client';

import { useState } from 'react';

import { DASHBOARD_DATA } from '@/lib/mockData';

export function InteractiveDashboardPreview() {
    const [activeView, setActiveView] = useState('Dashboard');

    const { sidebarItems } = DASHBOARD_DATA;

    const renderContent = () => {
        switch (activeView) {
            case 'Dashboard':
                return <DashboardView />;
            case 'Enquiries':
                return <EnquiriesView />;
            case 'Registrations':
                return <RegistrationsView />;
            case 'Enrollments':
                return <EnrollmentsView />;
            case 'Documents':
                return <DocumentsView />;
            case 'Payments':
                return <PaymentsView />;
            default:
                return <DashboardView />;
        }
    };

    return (
        <div className="mt-20 relative mx-auto max-w-6xl animate-in fade-in zoom-in-95 duration-1000 delay-500">
            <div className="rounded-xl bg-slate-900 p-2 shadow-2xl ring-1 ring-slate-900/10">
                <div className="rounded-lg bg-white overflow-hidden aspect-[16/9] relative group border border-slate-200">
                    {/* Browser Chrome */}
                    <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        <div className="ml-4 flex-1 bg-white h-5 rounded-sm border border-slate-200 px-3 flex items-center">
                            <div className="h-2 w-12 bg-slate-200 rounded mr-2"></div>
                            <span className="text-[8px] text-slate-400">consultancydev.app/{activeView.toLowerCase()}</span>
                        </div>
                    </div>

                    {/* Mock Content */}
                    <div className="flex h-full bg-slate-50/50">
                        {/* Sidebar */}
                        <div className="w-56 border-r border-slate-200 bg-white hidden md:flex flex-col p-4 gap-2">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                                <div className="h-7 w-7 bg-teal-600 rounded-md flex items-center justify-center">
                                    <div className="w-3 h-3 bg-white rounded-sm"></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-900">ConsultancyDev</span>
                            </div>

                            {sidebarItems.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveView(item.label)}
                                    className={`h-8 w-full ${activeView === item.label
                                        ? 'bg-teal-50 border border-teal-100'
                                        : 'bg-transparent hover:bg-slate-50'
                                        } rounded-lg flex items-center px-2 gap-2.5 transition-all cursor-pointer`}
                                >
                                    <div className={`w-3.5 h-3.5 rounded ${activeView === item.label ? item.icon : 'bg-slate-400'}`}></div>
                                    <span className={`text-[10px] font-medium ${activeView === item.label ? 'text-teal-700' : 'text-slate-600'}`}>
                                        {item.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Main Area - Dynamic Content */}
                        <div className="flex-1 overflow-hidden bg-white">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Dashboard View with stats cards and charts
function DashboardView() {
    return (
        <div className="p-6 sm:p-8 h-full overflow-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">Dashboard</h2>
                    <p className="text-[9px] text-slate-500">Welcome back! Here's your overview.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {DASHBOARD_DATA.stats.map((stat, i) => (
                    <div key={i} className={`${stat.bg} rounded-xl border border-slate-200 p-3 min-h-[75px]`}>
                        <p className="text-[8px] text-slate-600 mb-1">{stat.label}</p>
                        <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-xs font-bold text-slate-900 mb-3">Weekly Activity</h3>
                <div className="flex items-end justify-between gap-2 h-28 px-1">
                    {DASHBOARD_DATA.chartData.map((height, i) => (
                        <div
                            key={i}
                            className={`w-full rounded-t-md ${i === 2 ? 'bg-gradient-to-t from-teal-600 to-teal-400' : 'bg-gradient-to-t from-teal-400 to-teal-200'}`}
                            style={{ height: `${height}%` }}
                        />
                    ))}
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 mt-2 font-medium">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
            </div>
        </div>
    );
}

// Enquiries View with table layout
function EnquiriesView() {
    const { enquiries } = DASHBOARD_DATA;

    return (
        <div className="p-6 sm:p-8 h-full overflow-auto">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-sm font-bold text-slate-900">Enquiries</h2>
                    <p className="text-[9px] text-slate-500">Manage all student enquiries</p>
                </div>
                <div className="h-7 px-2 bg-teal-600 rounded-lg flex items-center">
                    <span className="text-[8px] font-semibold text-white">+ New Enquiry</span>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white border border-slate-200 rounded-lg h-8 mb-4 px-3 flex items-center">
                <span className="text-[8px] text-slate-400">Search by name, mobile...</span>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-[9px]">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Candidate</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Contact</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Course</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {enquiries.map((enq, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                <td className="px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-[8px]">
                                            {enq.name.charAt(0)}
                                        </div>
                                        <span className="font-medium text-slate-900">{enq.name}</span>
                                    </div>
                                </td>
                                <td className="px-3 py-2 text-slate-600">{enq.phone}</td>
                                <td className="px-3 py-2 text-slate-600">{enq.course}</td>
                                <td className="px-3 py-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-semibold ${enq.status === 'New' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {enq.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Registrations View with tabs
function RegistrationsView() {
    const { registrations } = DASHBOARD_DATA;

    return (
        <div className="p-6 sm:p-8 h-full overflow-auto">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-sm font-bold text-slate-900">Registrations</h2>
                    <p className="text-[9px] text-slate-500">Track all registered students</p>
                </div>
                <div className="h-7 px-2 bg-teal-600 rounded-lg flex items-center">
                    <span className="text-[8px] font-semibold text-white">+ New Registration</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <div className="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-lg text-[9px] font-semibold">Registered Students</div>
                <div className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-medium">Add New</div>
            </div>

            {/* Cards */}
            <div className="space-y-3">
                {registrations.map((reg, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-[9px]">
                                    {reg.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-900">{reg.name}</p>
                                    <p className="text-[8px] text-slate-500">{reg.id} • {reg.course}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-semibold ${reg.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {reg.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Enrollments View
function EnrollmentsView() {
    const { enrollments, enrollmentStats } = DASHBOARD_DATA;

    return (
        <div className="p-6 sm:p-8 h-full overflow-auto">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-sm font-bold text-slate-900">Enrollments</h2>
                    <p className="text-[9px] text-slate-500">Manage course enrollments</p>
                </div>
                <div className="h-7 px-2 bg-teal-600 rounded-lg flex items-center">
                    <span className="text-[8px] font-semibold text-white">+ New Enrollment</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                {enrollmentStats.map((stat, i) => (
                    <div key={i} className={`${stat.color} rounded-lg border border-slate-200 p-3`}>
                        <p className="text-[8px] text-slate-600">{stat.label}</p>
                        <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Enrollment Cards */}
            <div className="space-y-3">
                {enrollments.map((enr, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold text-slate-900">{enr.name}</p>
                            <span className="text-[8px] text-slate-500">{enr.year}</span>
                        </div>
                        <p className="text-[8px] text-slate-600 mb-2">{enr.program}</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600 rounded-full" style={{ width: `${enr.progress}%` }}></div>
                            </div>
                            <span className="text-[8px] font-semibold text-purple-600">{enr.progress}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Documents View
function DocumentsView() {
    const { documents, documentStats } = DASHBOARD_DATA;

    return (
        <div className="p-6 sm:p-8 h-full overflow-auto">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-sm font-bold text-slate-900">Documents</h2>
                    <p className="text-[9px] text-slate-500">Track and verify documents</p>
                </div>
                <div className="h-7 px-2 bg-teal-600 rounded-lg flex items-center">
                    <span className="text-[8px] font-semibold text-white">+ Add Document</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                {documentStats.map((stat, i) => (
                    <div key={i} className={`${stat.color} rounded-lg border border-slate-200 p-2`}>
                        <p className="text-[7px] text-slate-600">{stat.label}</p>
                        <p className="text-sm font-bold text-slate-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Document List */}
            <div className="space-y-2">
                {documents.map((doc, i) => (
                    <div key={i} className={`border-2 ${doc.color === 'green' ? 'border-green-200 bg-green-50' :
                        doc.color === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
                            'border-red-200 bg-red-50'
                        } rounded-lg p-3`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-bold text-slate-900">{doc.name}</p>
                                <p className="text-[8px] text-slate-600">Expiry: {doc.expiry}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-[8px] font-semibold ${doc.color === 'green' ? 'bg-green-100 text-green-700' :
                                doc.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                {doc.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Payments View with table
function PaymentsView() {
    const { payments, paymentStats } = DASHBOARD_DATA;

    return (
        <div className="p-6 sm:p-8 h-full overflow-auto">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-sm font-bold text-slate-900">Payments</h2>
                    <p className="text-[9px] text-slate-500">Track all transactions</p>
                </div>
                <div className="h-7 px-2 bg-teal-600 rounded-lg flex items-center">
                    <span className="text-[8px] font-semibold text-white">+ Record Payment</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-4">
                {paymentStats.map((stat, i) => (
                    <div key={i} className={`${stat.color} rounded-lg border border-slate-200 p-2`}>
                        <p className="text-[7px] text-slate-600">{stat.label}</p>
                        <p className="text-sm font-bold text-slate-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Payment Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-[9px]">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Student</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Type</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Amount</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {payments.map((pay, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                <td className="px-3 py-2 font-medium text-slate-900">{pay.student}</td>
                                <td className="px-3 py-2 text-slate-600">{pay.type}</td>
                                <td className="px-3 py-2 font-bold text-slate-900">₹{pay.amount}</td>
                                <td className="px-3 py-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-semibold ${pay.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {pay.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
