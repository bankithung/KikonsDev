'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  UserPlus,
  GraduationCap,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  Users,
  Database,
  Activity,
  Server,
  FileOutput,
  CheckSquare,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Calendar,
  AlertCircle,
  DollarSign,
  Building2,
  Plane,
  TrendingUp,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/lib/types';

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onCloseMobile: () => void;
  toggleCollapse: () => void;
  isCollapsed: boolean;
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard, roles: ['ALL'] },
  { label: 'Enquiries', href: '/app/enquiries', icon: MessageSquare, roles: ['ALL'] },
  { label: 'Follow-ups', href: '/app/follow-ups', icon: Bell, roles: ['ALL'] },
  { label: 'Registrations', href: '/app/registrations', icon: UserPlus, roles: ['ALL'] },
  { label: 'Enrollments', href: '/app/enrollments', icon: GraduationCap, roles: ['ALL'] },
  { label: 'Documents', href: '/app/documents', icon: FileText, roles: ['ALL'] },
  { label: 'Payments', href: '/app/payments', icon: CreditCard, roles: ['ALL'] },
  { label: 'Commissions', href: '/app/commissions', icon: DollarSign, roles: ['COMPANY_ADMIN'] },
  { label: 'Appointments', href: '/app/appointments', icon: Calendar, roles: ['ALL'] },
  { label: 'My Requests', href: '/app/my-requests', icon: CheckSquare, roles: ['EMPLOYEE'] },
  { label: 'Universities', href: '/app/universities', icon: Building2, roles: ['ALL'] },
  { label: 'Visa Tracking', href: '/app/visa-tracking', icon: Plane, roles: ['ALL'] },
  { label: 'Templates', href: '/app/templates', icon: Mail, roles: ['ALL'] },
  { label: 'Reports', href: '/app/reports', icon: BarChart3, roles: ['ALL'] },
];

const ADMIN_ITEMS = [
  { label: 'Counselors', href: '/app/counselors', icon: Users, roles: ['COMPANY_ADMIN', 'DEV_ADMIN'] },
  { label: 'Lead Sources', href: '/app/lead-sources', icon: TrendingUp, roles: ['COMPANY_ADMIN', 'DEV_ADMIN'] },
  { label: 'Earnings Stats', href: '/app/earnings', icon: BarChart3, roles: ['COMPANY_ADMIN', 'DEV_ADMIN'] },
  { label: 'Settings', href: '/app/settings', icon: Settings, roles: ['COMPANY_ADMIN', 'DEV_ADMIN'] },
  { label: 'Approval Requests', href: '/app/approval-requests', icon: CheckSquare, roles: ['COMPANY_ADMIN', 'DEV_ADMIN'] },
  { label: 'User Management', href: '/app/users', icon: Users, roles: ['COMPANY_ADMIN', 'DEV_ADMIN'] },
];

const DEV_ITEMS = [
  { label: 'Signup Requests', href: '/app/dev-tools/signup-requests', icon: CheckSquare, roles: ['DEV_ADMIN'] },
  { label: 'Company Mgmt', href: '/app/dev-tools/companies', icon: Server, roles: ['DEV_ADMIN'] },
  { label: 'System Analytics', href: '/app/dev-tools/analytics', icon: Activity, roles: ['DEV_ADMIN'] },
  { label: 'Database', href: '/app/dev-tools/database', icon: Database, roles: ['DEV_ADMIN'] },
  { label: 'System Logs', href: '/app/dev-tools/logs', icon: FileOutput, roles: ['DEV_ADMIN'] },
];

function NavItem({ item, isCollapsed, pathname }: { item: any, isCollapsed: boolean, pathname: string }) {
  // Exact match for paths to avoid highlighting parent routes
  const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/app/documents');
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center px-3 py-2 rounded-md transition-colors group",
        isActive
          ? "bg-teal-50 text-teal-600"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        isCollapsed ? "justify-center" : ""
      )}
    >
      <item.icon size={20} className={cn(isActive ? "text-teal-600" : "text-muted-foreground group-hover:text-accent-foreground")} />
      {!isCollapsed && <span className="ml-3 truncate">{item.label}</span>}
    </Link>
  );
}

// Extracted SidebarContent component
const SidebarContent = ({
  isCollapsed,
  isMobile,
  onCloseMobile,
  toggleCollapse,
  user,
  logout,
  pathname
}: {
  isCollapsed: boolean;
  isMobile: boolean;
  onCloseMobile: () => void;
  toggleCollapse: () => void;
  user: User | null;
  logout: () => void;
  pathname: string;
}) => {
  const filterItems = (items: typeof NAV_ITEMS) => {
    if (!user) return [];
    return items.filter(item => item.roles.includes('ALL') || item.roles.includes(user.role));
  };

  const mainNav = filterItems(NAV_ITEMS);
  const adminNav = filterItems(ADMIN_ITEMS);
  const devNav = filterItems(DEV_ITEMS);

  const displayName = user?.first_name || user?.username || 'User';

  return (
    <div className="flex flex-col h-full bg-card border-r border-border text-sm font-medium">
      {/* Header */}
      <div className={cn("flex items-center h-16 px-4 border-b border-border", isCollapsed && !isMobile ? "justify-center" : "justify-between")}>
        {(!isCollapsed || isMobile) && (
          <span className="text-lg font-bold text-teal-600 truncate">Consultancy Dev</span>
        )}
        {!isMobile && (
          <button onClick={toggleCollapse} className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}
        {isMobile && (
          <button onClick={onCloseMobile} className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Scrollable Nav */}
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <nav className="px-2 space-y-1">
          {mainNav.map((item) => (
            <NavItem key={item.href} item={item} isCollapsed={isCollapsed && !isMobile} pathname={pathname} />
          ))}
        </nav>

        {adminNav.length > 0 && (
          <>
            <div className={cn("mt-6 mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider", isCollapsed && !isMobile && "hidden")}>
              Admin
            </div>
            {isCollapsed && !isMobile && <div className="h-4" />}
            <nav className="px-2 space-y-1">
              {adminNav.map((item) => (
                <NavItem key={item.href} item={item} isCollapsed={isCollapsed && !isMobile} pathname={pathname} />
              ))}
            </nav>
          </>
        )}

        {devNav.length > 0 && (
          <>
            <div className={cn("mt-6 mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider", isCollapsed && !isMobile && "hidden")}>
              Dev Tools
            </div>
            {isCollapsed && !isMobile && <div className="h-4" />}
            <nav className="px-2 space-y-1">
              {devNav.map((item) => (
                <NavItem key={item.href} item={item} isCollapsed={isCollapsed && !isMobile} pathname={pathname} />
              ))}
            </nav>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className={cn("flex items-center", isCollapsed && !isMobile ? "justify-center" : "space-x-3")}>
          {user?.avatar ? (
            <img src={user.avatar} alt={displayName} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
              <span className="text-xs font-bold">{displayName.charAt(0).toUpperCase()}</span>
            </div>
          )}

          {(!isCollapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
          {(!isCollapsed || isMobile) && (
            <button onClick={() => logout()} className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut size={18} />
            </button>
          )}
        </div>
        {isCollapsed && !isMobile && (
          <button onClick={() => logout()} className="mt-4 w-full flex justify-center text-muted-foreground hover:text-destructive transition-colors">
            <LogOut size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export function Sidebar({ isOpen, isMobile, onCloseMobile, toggleCollapse, isCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const contentProps = {
    isCollapsed,
    isMobile,
    onCloseMobile,
    toggleCollapse,
    user,
    logout,
    pathname
  };

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              key="overlay"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 w-64 z-50 shadow-xl border-r border-border bg-card"
              key="sidebar"
            >
              <SidebarContent {...contentProps} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden md:block h-screen sticky top-0 z-30 shadow-sm flex-shrink-0 border-r border-border bg-card"
    >
      <SidebarContent {...contentProps} />
    </motion.div>
  );
}
