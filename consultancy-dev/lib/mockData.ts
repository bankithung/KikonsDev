import {
    LayoutDashboard,
    Users,
    GraduationCap,
    FileText,
    Wallet,
    MessageCircle,
    CalendarDays,
    University,
    BarChart3,
    ShieldCheck,
    Globe
} from 'lucide-react';

export const FEATURES = [
    {
        name: 'Dashboard',
        title: 'Centralized Dashboard',
        description: 'Get a bird\'s-eye view of your entire consultancy. Track active enquiries, pending applications, and revenue at a glance.',
        icon: LayoutDashboard,
    },
    {
        name: 'Enquiries',
        title: 'Lead & Enquiry Management',
        description: 'Capture leads from multiple sources. Auto-assign to counselors and track conversion rates with detailed analytics.',
        icon: Users,
    },
    {
        name: 'Admissions',
        title: 'Admission Tracking',
        description: 'End-to-end application management. Track status from "Applied" to "Visa Received" with automated timeline updates.',
        icon: GraduationCap,
    },
    {
        name: 'Documents',
        title: 'Smart Document Management',
        description: 'Secure storage for student documents. Track "IN/OUT" status for original certificates and generate acknowledgement receipts.',
        icon: FileText,
    },
    {
        name: 'Finance',
        title: 'Financial Control',
        description: 'Manage student fees, generate GST-compliant invoices, and track commission payouts from universities.',
        icon: Wallet,
    },
    {
        name: 'Student Portal',
        title: 'Student Self-Service Portal',
        description: 'Dedicated portal for students to track application status, upload documents, view payment history, and download receipts.',
        icon: Users,
    },
    {
        name: 'Appointments',
        title: 'Calendar & Appointments',
        description: 'Full calendar view for scheduling Video, Phone, or In-Person appointments with duration selection and counselor assignment.',
        icon: CalendarDays,
    },
    {
        name: 'Universities',
        title: 'University Database',
        description: 'Maintain a comprehensive database of universities and courses. Filter by country, intake, and eligibility criteria.',
        icon: University,
    },
    {
        name: 'Reports',
        title: 'Advanced Reporting',
        description: 'Generate detailed reports on counselor performance, branch revenue, and visa success rates. Export to PDF/Excel.',
        icon: BarChart3,
    },
    {
        name: 'Security',
        title: 'Role-Based Security',
        description: 'Granular access control. Define roles like "Counselor", "Manager", and "Admin" with specific permission sets.',
        icon: ShieldCheck,
    },
    {
        name: 'Website',
        title: 'Integrated Website',
        description: 'Your public-facing website is automatically updated with your latest university partnerships and success stories.',
        icon: Globe,
    },
    {
        name: 'Templates',
        title: 'Email/SMS Templates',
        description: 'Template library for Email, SMS, and WhatsApp with variable support. Categories include Welcome, Follow-up, and Document Request.',
        icon: MessageCircle,
    },
];

export const PRICING_PLANS = [
    {
        name: 'Small',
        price: '₹3,999',
        period: '/month',
        description: 'For independent counselors.',
        features: [
            '10GB Storage',
            'Up to 2 Users',
            '500 Active Student Records',
            'Basic Document Management',
        ],
        cta: 'Start Free Trial',
        popular: false,
    },
    {
        name: 'Medium',
        price: '₹4,999',
        period: '/month',
        description: 'For growing agencies.',
        features: [
            '50GB Storage',
            'Up to 5 Users',
            'Unlimited Student Records',
            'WhatsApp Integration',
        ],
        cta: 'Get Started',
        popular: true,
    },
    {
        name: 'Large',
        price: '₹5,999',
        period: '/month',
        description: 'For established firms.',
        features: [
            '100GB Storage',
            'Up to 10 Users',
            'Multi-branch Management',
            'Priority Support',
        ],
        cta: 'Contact Sales',
        popular: false,
    },
];

export const DASHBOARD_DATA = {
    sidebarItems: [
        { label: 'Dashboard', icon: 'bg-teal-500' },
        { label: 'Enquiries', icon: 'bg-blue-500' },
        { label: 'Registrations', icon: 'bg-green-500' },
        { label: 'Enrollments', icon: 'bg-purple-500' },
        { label: 'Documents', icon: 'bg-yellow-500' },
        { label: 'Payments', icon: 'bg-pink-500' },
    ],
    stats: [
        { bg: 'bg-blue-50', value: '247', label: 'Enquiries' },
        { bg: 'bg-green-50', value: '89', label: 'Registrations' },
        { bg: 'bg-purple-50', value: '34', label: 'Enrollments' },
        { bg: 'bg-yellow-50', value: '12', label: 'Pending' },
    ],
    chartData: [45, 65, 85, 55, 70, 40, 60],
    enquiries: [
        { name: 'Rahul Sharma', phone: '+91 98765 43210', status: 'New', course: 'MBBS' },
        { name: 'Priya Patel', phone: '+91 98765 43211', status: 'Converted', course: 'BDS' },
        { name: 'Amit Kumar', phone: '+91 98765 43212', status: 'New', course: 'Engineering' },
    ],
    registrations: [
        { name: 'Alice Johnson', id: 'REG-001', course: 'MBBS', status: 'Active' },
        { name: 'Bob Smith', id: 'REG-002', course: 'Engineering', status: 'Active' },
        { name: 'Carol White', id: 'REG-003', course: 'BDS', status: 'Pending' },
    ],
    enrollments: [
        { name: 'David Lee', program: 'MBBS - Ukraine', year: '2024', progress: 75 },
        { name: 'Emma Wilson', program: 'Engineering - Germany', year: '2024', progress: 60 },
        { name: 'Frank Miller', program: 'BDS - Romania', year: '2023', progress: 90 },
    ],
    enrollmentStats: [
        { label: 'Total', value: '34', color: 'bg-purple-50' },
        { label: 'Active', value: '28', color: 'bg-blue-50' },
        { label: 'Completed', value: '6', color: 'bg-green-50' },
    ],
    documents: [
        { name: 'Passport - Rahul Sharma', status: 'Verified', expiry: '45 days', color: 'green' },
        { name: 'Certificate - Priya Patel', status: 'Pending', expiry: 'N/A', color: 'yellow' },
        { name: 'Passport - Amit Kumar', status: 'Expiring', expiry: '15 days', color: 'red' },
    ],
    documentStats: [
        { label: 'Total', value: '234', color: 'bg-yellow-50' },
        { label: 'Verified', value: '198', color: 'bg-green-50' },
        { label: 'Pending', value: '28', color: 'bg-blue-50' },
        { label: 'Expiring', value: '8', color: 'bg-red-50' },
    ],
    payments: [
        { student: 'Rahul Sharma', amount: '50,000', type: 'Enrollment', status: 'Success' },
        { student: 'Priya Patel', amount: '25,000', type: 'Registration', status: 'Success' },
        { student: 'Amit Kumar', amount: '30,000', type: 'Enrollment', status: 'Pending' },
    ],
    paymentStats: [
        { label: 'Revenue', value: '₹8.5L', color: 'bg-green-50' },
        { label: 'This Month', value: '₹2.8L', color: 'bg-blue-50' },
        { label: 'Pending', value: '₹1.2L', color: 'bg-yellow-50' },
        { label: 'Transactions', value: '156', color: 'bg-purple-50' },
    ]
};
