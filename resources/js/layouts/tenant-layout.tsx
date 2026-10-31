import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    LayoutDashboard,
    GraduationCap,
    Users,
    BookOpen,
    CalendarCheck,
    Award,
    Settings,
    UserPlus,
    ChevronDown,
    Check,
    LogOut,
    Menu,
    X,
    Building2,
    ShieldCheck,
    Plus,
    CheckCircle2,
    AlertCircle,
    Layers,
    Sun,
    Moon,
    Clock,
    CreditCard,
    Bell,
    Receipt,
    Inbox,
} from 'lucide-react';
import type { Auth, Flash, Organization } from '@/types';
import AppLogoIcon from '@/components/app-logo-icon';
import { useAppearance } from '@/hooks/use-appearance';

interface TenantLayoutProps {
    title?: string;
    children: React.ReactNode;
}

export default function TenantLayout({
    title = 'Dashboard',
    children,
}: TenantLayoutProps) {
    const { appearance, resolvedAppearance, updateAppearance } = useAppearance();
    const page = usePage<{ auth: Auth; flash?: Flash }>();
    const auth = page.props.auth;
    const flash = page.props.flash;
    const currentOrg = auth.currentOrganization;
    const userOrgs = auth.userOrganizations || [];
    const role = auth.organizationRole || 'student';
    const isSuperAdmin = auth.isSuperAdmin || false;
    const canCreateOrg = (!isSuperAdmin && role === 'teacher')
        ? false
        : Boolean((auth as any).canCreateOrganization ?? isSuperAdmin);

    const [mobileOpen, setMobileOpen] = useState(false);
    const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
    const [headerOrgDropdownOpen, setHeaderOrgDropdownOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

    const notifications = (page.props as any).notifications as
        | {
              unreadCount: number;
              recent: Array<{
                  id: string;
                  type: string;
                  data: {
                      type?: string;
                      title?: string;
                      message?: string;
                      url?: string;
                      balance_due?: number;
                      currency?: string;
                      reminder_type?: string;
                  };
                  read_at: string | null;
                  created_at: string;
              }>;
          }
        | undefined;

    const unreadCount = notifications?.unreadCount || 0;
    const recentNotifs = notifications?.recent || [];

    const markNotificationAsRead = (id: string, targetUrl?: string) => {
        router.post(
            `/notifications/${id}/read`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (targetUrl) {
                        setNotifDropdownOpen(false);
                        router.visit(targetUrl);
                    }
                },
            }
        );
    };

    const markAllNotificationsAsRead = () => {
        router.post('/notifications/read-all', {}, { preserveScroll: true });
    };

    const toggleTheme = () => {
        updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark');
    };

    const switchOrganization = (orgId: number) => {
        setOrgDropdownOpen(false);
        setHeaderOrgDropdownOpen(false);
        router.post(`/organizations/${orgId}/switch`);
    };

    // Navigation items tailored to roles
    const navItems = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutDashboard,
            active: window.location.pathname === '/dashboard',
            roles: [
                'owner',
                'admin',
                'teacher',
                'student',
                'parent',
                'super_admin',
            ],
        },
        // School Management
        {
            title: 'Classes Directory',
            href: '/school/classes',
            icon: GraduationCap,
            active: window.location.pathname === '/school/classes',
            roles: ['owner', 'admin'],
        },
        {
            title: 'Sections & Cohorts',
            href: '/school/sections',
            icon: Layers,
            active: window.location.pathname.startsWith('/school/sections'),
            roles: ['owner', 'admin'],
        },
        {
            title: role === 'student' || role === 'teacher' ? 'My Subjects' : 'Subjects & Curriculum',
            href: '/school/subjects',
            icon: BookOpen,
            active: window.location.pathname.startsWith('/school/subjects'),
            roles: ['owner', 'admin', 'teacher', 'student'],
        },
        {
            title: role === 'student' || role === 'teacher' ? 'My Timetable' : 'Timetable & Schedule',
            href: '/school/timetable',
            icon: Clock,
            active: window.location.pathname.startsWith('/school/timetable'),
            roles: ['owner', 'admin', 'teacher', 'student'],
        },
        {
            title: role === 'teacher' ? 'My Students' : 'Student Directory',
            href: '/school/students',
            icon: Users,
            active: window.location.pathname.startsWith('/school/students'),
            roles: ['owner', 'admin', 'teacher'],
        },
        {
            title: role === 'student' || role === 'teacher' ? 'My Attendance' : 'Attendance Register',
            href: '/school/attendance',
            icon: CalendarCheck,
            active: window.location.pathname.startsWith('/school/attendance'),
            roles: ['owner', 'admin', 'teacher', 'student', 'parent'],
        },
        {
            title: 'Assessments & Grades',
            href: '/school/grades',
            icon: Award,
            active: window.location.pathname.startsWith('/school/grades'),
            roles: ['owner', 'admin', 'teacher', 'student', 'parent'],
        },
        // Institutional Fee Management & Billing
        {
            title: 'Fee Management',
            href: '/school/fees',
            icon: CreditCard,
            active: window.location.pathname.startsWith('/school/fees') && !window.location.pathname.startsWith('/school/my-fees'),
            roles: ['owner', 'admin', 'super_admin'],
        },
        {
            title: role === 'parent' ? 'Children Fees & Dues' : 'My Fees & Payments',
            href: '/school/my-fees',
            icon: CreditCard,
            active: window.location.pathname.startsWith('/school/my-fees'),
            roles: ['student', 'parent'],
        },
        // Online Learning
        {
            title: 'Course Catalog',
            href: '/learning/courses',
            icon: BookOpen,
            active: window.location.pathname.startsWith('/learning/courses'),
            roles: ['owner', 'admin', 'student'],
        },
        // Organization Administration
        {
            title: 'Faculty & Staff',
            href: '/organizations/members',
            icon: UserPlus,
            active: window.location.pathname === '/organizations/members',
            roles: ['owner', 'admin', 'super_admin'],
        },
        {
            title: 'Organization Settings',
            href: '/organizations/settings',
            icon: Settings,
            active: window.location.pathname === '/organizations/settings',
            roles: ['owner', 'admin', 'super_admin'],
        },
        {
            title: 'Subscription & Billing',
            href: '/organizations/billing',
            icon: CreditCard,
            active: window.location.pathname === '/organizations/billing',
            roles: ['owner', 'admin', 'super_admin'],
        },
    ];

    let filteredNavItems = navItems.filter((item) => {
        if (isSuperAdmin) return true;
        return item.roles.includes(role);
    });

    if (role === 'teacher') {
        const teacherOrder = [
            '/dashboard',
            '/school/timetable',
            '/school/attendance',
            '/school/subjects',
            '/school/grades',
            '/school/students',
        ];
        filteredNavItems = [...filteredNavItems].sort((a, b) => {
            const indexA = teacherOrder.indexOf(a.href);
            const indexB = teacherOrder.indexOf(b.href);
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });
    }

    const getRoleBadge = (r: string) => {
        switch (r) {
            case 'owner':
                return {
                    label: 'Owner',
                    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                };
            case 'admin':
                return {
                    label: 'Admin',
                    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                };
            case 'teacher':
                return {
                    label: 'Teacher',
                    color: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                };
            case 'student':
                return {
                    label: 'Student',
                    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                };
            case 'parent':
                return {
                    label: 'Parent',
                    color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                };
            case 'super_admin':
                return {
                    label: 'Platform Admin',
                    color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                };
            default:
                return {
                    label: r,
                    color: 'bg-slate-800 text-slate-300 border-slate-700',
                };
        }
    };

    const roleBadge = getRoleBadge(role);

    return (
        <div className="flex h-screen h-[100dvh] w-full flex-col overflow-hidden bg-slate-50 font-sans text-slate-900 selection:bg-purple-500 selection:text-white md:flex-row dark:bg-[#070b14] dark:text-slate-100">
            {/* Mobile Header */}
            <div className="sticky top-0 z-50 flex shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md md:hidden dark:border-slate-800 dark:bg-[#0B1220]/95">
                <Link href="/dashboard" className="flex items-center gap-2.5">
                    {currentOrg?.logo_path ? (
                        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <img
                                src={currentOrg.logo_path}
                                alt={currentOrg.name}
                                className="size-full object-contain"
                            />
                        </div>
                    ) : (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-md shadow-purple-500/20 text-xs font-bold text-white">
                            {currentOrg?.name ? currentOrg.name.charAt(0).toUpperCase() : <GraduationCap className="size-4" />}
                        </div>
                    )}
                    <span className="max-w-[170px] truncate text-base font-bold tracking-tight text-slate-900 dark:text-white">
                        {currentOrg?.name || 'School Portal'}
                    </span>
                </Link>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                        title="Notifications"
                        className="relative flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <Bell className="size-4" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={toggleTheme}
                        title={`Switch to ${resolvedAppearance === 'dark' ? 'light' : 'dark'} mode`}
                        className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        {resolvedAppearance === 'dark' ? (
                            <Sun className="size-4 text-amber-400" />
                        ) : (
                            <Moon className="size-4 text-purple-600" />
                        )}
                    </button>
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? (
                            <X className="size-6" />
                        ) : (
                            <Menu className="size-6" />
                        )}
                    </button>
                </div>
            </div>

            {/* Sidebar Navigation */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex h-full w-72 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out md:static md:h-full md:translate-x-0 dark:border-slate-800/80 dark:bg-[#0B1220] ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* School Brand & Workspace Header */}
                <div className="shrink-0 border-b border-slate-200 p-4 dark:border-slate-800/80">
                    {currentOrg ? (
                        <div className="relative">
                            <div className="flex items-center justify-between gap-2">
                                <Link
                                    href="/dashboard"
                                    className="group flex min-w-0 flex-1 items-center gap-3"
                                    title={currentOrg.name}
                                >
                                    {currentOrg.logo_path ? (
                                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-sm transition-transform group-hover:scale-105 dark:border-slate-800 dark:bg-slate-900">
                                            <img
                                                src={currentOrg.logo_path}
                                                alt={currentOrg.name}
                                                className="size-full object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-violet-500 to-indigo-500 text-sm font-extrabold text-white shadow-md shadow-purple-600/30 transition-transform group-hover:scale-105">
                                            {currentOrg.name ? currentOrg.name.charAt(0).toUpperCase() : <GraduationCap className="size-5" />}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <span className="block truncate text-base font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400">
                                            {currentOrg.name}
                                        </span>
                                        <div className="mt-0.5 flex items-center gap-1.5">
                                            <span
                                                className={`inline-block rounded border px-1.5 py-0.2 text-[9px] font-semibold ${roleBadge.color}`}
                                            >
                                                {roleBadge.label}
                                            </span>
                                            <span className="text-[10px] font-semibold tracking-wider text-purple-600 uppercase dark:text-purple-400">
                                                Portal
                                            </span>
                                        </div>
                                    </div>
                                </Link>

                                {(userOrgs.length > 1 || canCreateOrg) && (
                                    <button
                                        type="button"
                                        onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                                        className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-purple-400 hover:bg-slate-100 hover:text-purple-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:border-purple-500/40 dark:hover:bg-slate-800 dark:hover:text-white"
                                        title="Switch organization"
                                    >
                                        <ChevronDown className="size-4" />
                                    </button>
                                )}
                            </div>

                            {orgDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setOrgDropdownOpen(false)}
                                    />
                                    <div className="absolute top-full right-0 left-0 z-50 mt-2 animate-in rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl backdrop-blur-xl zoom-in-95 fade-in dark:border-slate-700/80 dark:bg-[#0e1626]">
                                        <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            <span>Your Organizations</span>
                                            <span className="rounded-full bg-purple-100 px-1.5 py-0.2 text-[10px] font-bold text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">
                                                {userOrgs.length}
                                            </span>
                                        </div>
                                        <div className="max-h-48 space-y-0.5 overflow-y-auto">
                                            {userOrgs.map((org: Organization) => (
                                                <button
                                                    key={org.id}
                                                    onClick={() =>
                                                        switchOrganization(org.id)
                                                    }
                                                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors ${
                                                        org.id === currentOrg.id
                                                            ? 'border border-purple-200 bg-purple-50 font-semibold text-purple-700 dark:border-purple-500/30 dark:bg-purple-600/20 dark:text-purple-300'
                                                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        {org.logo_path ? (
                                                            <img
                                                                src={org.logo_path}
                                                                alt={org.name}
                                                                className="size-5 shrink-0 rounded object-contain border border-slate-200 dark:border-slate-800"
                                                            />
                                                        ) : (
                                                            <div className="flex size-5 shrink-0 items-center justify-center rounded bg-purple-100 text-[10px] font-bold text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
                                                                {org.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col text-left min-w-0">
                                                            <span className="truncate">
                                                                {org.name}
                                                            </span>
                                                            {org.pivot?.role && (
                                                                <span className="text-[10px] text-slate-500 capitalize dark:text-slate-400">
                                                                    {org.pivot.role}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {org.id === currentOrg.id && (
                                                        <Check className="size-3.5 shrink-0 text-purple-600 dark:text-purple-400" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>

                                        {canCreateOrg && (
                                            <div className="mt-1 border-t border-slate-200 pt-1.5 dark:border-slate-800">
                                                <Link
                                                    href="/organizations/create"
                                                    onClick={() =>
                                                        setOrgDropdownOpen(false)
                                                    }
                                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-purple-600 transition-colors hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-500/10"
                                                >
                                                    <Plus className="size-3.5 shrink-0" />
                                                    <span>Setup / Create Organization</span>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : canCreateOrg ? (
                        <Link
                            href="/organizations/create"
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 dark:border-purple-500/30 dark:bg-purple-600/10 dark:text-purple-300 dark:hover:bg-purple-600/20"
                        >
                            <Plus className="size-3.5" />
                            <span>Setup Organization</span>
                        </Link>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-violet-500 to-indigo-500 text-sm font-extrabold text-white shadow-md shadow-purple-600/30">
                                <GraduationCap className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="block truncate text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                                    School Portal
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Items */}
                <div className="flex-1 min-h-0 space-y-1 overflow-y-auto px-3 py-4 overscroll-contain">
                    <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        Main Menu
                    </div>
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                                    item.active
                                        ? 'border border-purple-200 bg-purple-50 font-semibold text-purple-700 shadow-xs dark:border-purple-500/30 dark:bg-gradient-to-r dark:from-purple-600/25 dark:to-indigo-600/15 dark:text-white dark:shadow-purple-950'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/60 dark:hover:text-slate-200'
                                }`}
                            >
                                <Icon
                                    className={`size-4 ${item.active ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`}
                                />
                                <span>{item.title}</span>
                            </Link>
                        );
                    })}

                    {isSuperAdmin && (
                        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800/80">
                            <div className="flex items-center gap-1.5 px-3 pb-2 text-[10px] font-bold tracking-wider text-rose-600 uppercase dark:text-rose-400">
                                <ShieldCheck className="size-3" />
                                Platform Admin
                            </div>
                            <Link
                                href="/admin/dashboard"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                            >
                                <ShieldCheck className="size-4" />
                                <span>Platform Metrics</span>
                            </Link>
                            <Link
                                href="/admin/payment-approvals"
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition ${
                                    window.location.pathname.startsWith('/admin/payment-approvals')
                                        ? 'border border-amber-500/30 bg-amber-500/10 font-semibold text-amber-500 dark:text-amber-300'
                                        : 'text-amber-600 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10'
                                }`}
                            >
                                <CreditCard className="size-4" />
                                <span>Payment Approvals</span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Sidebar Footer User Card */}
                <div className="relative shrink-0 border-t border-slate-200 p-3 dark:border-slate-800/80">
                    <button
                        onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                        className={`flex w-full items-center justify-between rounded-xl border p-2 text-left transition ${
                            window.location.pathname.startsWith('/settings')
                                ? 'border-purple-300 bg-purple-50 dark:border-purple-500/40 dark:bg-purple-600/10'
                                : 'border-transparent hover:border-slate-200 hover:bg-slate-100 dark:hover:border-slate-800 dark:hover:bg-slate-900/80'
                        }`}
                    >
                        <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-xs font-bold text-white ring-2 ring-purple-500/30">
                                {auth.user?.name
                                    ? auth.user.name.charAt(0).toUpperCase()
                                    : 'U'}
                            </div>
                            <div className="min-w-0 truncate">
                                <div className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                                    {auth.user?.name}
                                </div>
                                <div className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                                    {auth.user?.email}
                                </div>
                            </div>
                        </div>
                        <ChevronDown className={`size-4 transition-colors ${window.location.pathname.startsWith('/settings') ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                    </button>

                    {userDropdownOpen && (
                        <div className="absolute right-3 bottom-full left-3 z-50 mb-2 animate-in rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl backdrop-blur-xl fade-in dark:border-slate-700/80 dark:bg-[#0e1626]">
                            <Link
                                href="/settings/profile"
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                                    window.location.pathname.startsWith('/settings')
                                        ? 'border border-purple-200 bg-purple-50 font-semibold text-purple-700 dark:border-purple-500/30 dark:bg-purple-600/20 dark:text-purple-300'
                                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
                                }`}
                            >
                                <Settings className={`size-3.5 ${window.location.pathname.startsWith('/settings') ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                                <span>Account Settings</span>
                            </Link>
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                            >
                                <LogOut className="size-3.5" />
                                <span>Sign Out</span>
                            </Link>
                        </div>
                    )}
                </div>
            </aside>

            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
                />
            )}

            {/* Main Content Area */}
            <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                {/* Top Desktop Bar */}
                <header className="relative z-20 hidden shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-8 py-3.5 backdrop-blur-md md:flex dark:border-slate-800/80 dark:bg-[#0B1220]/95">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                            {title}
                        </h1>

                        {/* Header Organization Switcher */}
                        {currentOrg ? (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setHeaderOrgDropdownOpen(!headerOrgDropdownOpen)}
                                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 transition hover:border-purple-400 hover:bg-slate-100 focus:outline-none dark:border-slate-800 dark:bg-slate-900/90 dark:text-white dark:hover:border-purple-500/40 dark:hover:bg-slate-900"
                                    title="Switch active organization"
                                >
                                    {currentOrg.logo_path ? (
                                        <img src={currentOrg.logo_path} alt={currentOrg.name} className="size-4 rounded object-contain" />
                                    ) : (
                                        <Building2 className="size-3.5 text-purple-600 dark:text-purple-400" />
                                    )}
                                    <span className="max-w-[150px] truncate font-semibold">{currentOrg.name}</span>
                                    <span className={`rounded border px-1.5 py-0.2 text-[9px] font-semibold ${roleBadge.color}`}>
                                        {roleBadge.label}
                                    </span>
                                    <ChevronDown className="size-3 text-slate-400" />
                                </button>

                                {headerOrgDropdownOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setHeaderOrgDropdownOpen(false)}
                                        />
                                        <div className="absolute left-0 top-full mt-2 w-72 animate-in rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl backdrop-blur-xl zoom-in-95 fade-in z-40 dark:border-slate-700/80 dark:bg-[#0e1626]">
                                            <div className="flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                <span>Your Organizations</span>
                                                <span className="rounded-full bg-purple-100 px-1.5 py-0.2 font-bold text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">
                                                    {userOrgs.length}
                                                </span>
                                            </div>
                                            <div className="max-h-56 space-y-0.5 overflow-y-auto">
                                                {userOrgs.map((org: Organization) => (
                                                    <button
                                                        key={org.id}
                                                        onClick={() => {
                                                            setHeaderOrgDropdownOpen(false);
                                                            switchOrganization(org.id);
                                                        }}
                                                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors ${
                                                            org.id === currentOrg.id
                                                                ? 'border border-purple-200 bg-purple-50 font-semibold text-purple-700 dark:border-purple-500/30 dark:bg-purple-600/20 dark:text-purple-300'
                                                                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
                                                        }`}
                                                    >
                                                        <div className="flex flex-col text-left min-w-0">
                                                            <span className="truncate font-medium">{org.name}</span>
                                                            {org.pivot?.role && (
                                                                <span className="text-[10px] text-slate-500 capitalize dark:text-slate-400">
                                                                    Role: {org.pivot.role}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {org.id === currentOrg.id && (
                                                            <Check className="size-3.5 shrink-0 text-purple-600 dark:text-purple-400" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                            {canCreateOrg && (
                                                <div className="mt-1 border-t border-slate-200 pt-1.5 dark:border-slate-800">
                                                    <Link
                                                        href="/organizations/create"
                                                        onClick={() => setHeaderOrgDropdownOpen(false)}
                                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-purple-600 transition-colors hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-500/10"
                                                    >
                                                        <Plus className="size-3.5 shrink-0" />
                                                        <span>Setup / Create Organization</span>
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : canCreateOrg ? (
                            <Link
                                href="/organizations/create"
                                className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 dark:border-purple-500/30 dark:bg-purple-600/15 dark:text-purple-300 dark:hover:bg-purple-600/25"
                            >
                                <Plus className="size-3.5" />
                                <span>Setup Organization</span>
                            </Link>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Interactive In-App Notification Center */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                                title="Notifications & Fee Reminders"
                                className="relative flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-purple-300 hover:text-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-purple-500/40 dark:hover:text-white"
                            >
                                <Bell className="size-4" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-md shadow-rose-600/30 ring-2 ring-white dark:ring-[#0B1220]">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {notifDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-30"
                                        onClick={() => setNotifDropdownOpen(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 w-84 sm:w-96 animate-in rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop-blur-xl zoom-in-95 fade-in z-40 dark:border-slate-700/80 dark:bg-[#0e1626]">
                                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <Bell className="size-4 text-purple-600 dark:text-purple-400" />
                                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                                    Notifications Center
                                                </h4>
                                                {unreadCount > 0 && (
                                                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                                                        {unreadCount} unread
                                                    </span>
                                                )}
                                            </div>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={markAllNotificationsAsRead}
                                                    className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 hover:underline dark:text-purple-400"
                                                >
                                                    Mark all as read
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-80 space-y-1 overflow-y-auto p-2">
                                            {recentNotifs.length === 0 ? (
                                                <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                                                    <Inbox className="mx-auto size-7 text-slate-400 opacity-60" />
                                                    <p className="mt-2 text-xs font-medium">All caught up! No notifications yet.</p>
                                                </div>
                                            ) : (
                                                recentNotifs.map((n) => {
                                                    const isUnread = !n.read_at;
                                                    const isFee = n.data?.type === 'fee_reminder' || n.type?.includes('Fee');
                                                    const remType = n.data?.reminder_type;
                                                    const targetUrl = n.data?.url || (role === 'student' ? '/school/my-fees' : '/school/fees');

                                                    let badgeColor = 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300';
                                                    if (remType === 'overdue_10') {
                                                        badgeColor = 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400';
                                                    } else if (remType === 'due_today') {
                                                        badgeColor = 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
                                                    }

                                                    return (
                                                        <div
                                                            key={n.id}
                                                            className={`group relative flex flex-col gap-1 rounded-xl p-3 text-xs transition ${
                                                                isUnread
                                                                    ? 'bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-800/40'
                                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                            }`}
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex items-center gap-1.5">
                                                                    {isFee ? (
                                                                        <CreditCard className="size-3.5 text-purple-600 dark:text-purple-400" />
                                                                    ) : (
                                                                        <Bell className="size-3.5 text-slate-400" />
                                                                    )}
                                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                                        {n.data?.title || 'System Notification'}
                                                                    </span>
                                                                </div>
                                                                <span className="shrink-0 text-[10px] text-slate-400">
                                                                    {n.created_at}
                                                                </span>
                                                            </div>

                                                            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                                                {n.data?.message || 'New institutional update received.'}
                                                            </p>

                                                            <div className="mt-1 flex items-center justify-between pt-1">
                                                                <button
                                                                    onClick={() => markNotificationAsRead(n.id, targetUrl)}
                                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                                                >
                                                                    <span>View Details &rarr;</span>
                                                                </button>
                                                                {isUnread && (
                                                                    <button
                                                                        onClick={() => markNotificationAsRead(n.id)}
                                                                        className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                                    >
                                                                        Mark read
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        <div className="border-t border-slate-200 p-2 text-center dark:border-slate-800">
                                            <Link
                                                href={role === 'student' ? '/school/my-fees' : '/school/fees'}
                                                onClick={() => setNotifDropdownOpen(false)}
                                                className="block rounded-lg py-1.5 text-[11px] font-bold text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-500/10"
                                            >
                                                {role === 'student' ? 'Go to My Fees & Payments' : 'Go to Fee Management Ledger'}
                                            </Link>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Live Theme Toggle Button */}
                        <button
                            type="button"
                            onClick={toggleTheme}
                            title={`Switch to ${resolvedAppearance === 'dark' ? 'light' : 'dark'} mode`}
                            className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-purple-300 hover:text-purple-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-purple-500/40 dark:hover:text-white"
                        >
                            {resolvedAppearance === 'dark' ? (
                                <Sun className="size-4 text-amber-400" />
                            ) : (
                                <Moon className="size-4 text-purple-600" />
                            )}
                        </button>

                        <Link
                            href="/"
                            target="_blank"
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-purple-300 hover:text-purple-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-purple-400"
                        >
                            View Public Portal &rarr;
                        </Link>
                    </div>
                </header>

                {/* Scrollable Content Container */}
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                    {/* Flash Messages */}
                    {flash?.success && (
                        <div className="mx-6 mt-4 flex animate-in items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 shadow-lg fade-in dark:text-emerald-300">
                            <CheckCircle2 className="size-4 shrink-0" />
                            <span>{flash.success}</span>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mx-6 mt-4 flex animate-in items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-700 shadow-lg fade-in dark:text-rose-300">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{flash.error}</span>
                        </div>
                    )}

                    {/* Page Content */}
                    <main className="mx-auto w-full max-w-7xl flex-1 p-6 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
