import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    BookOpen,
    Building2,
    Calendar,
    ChevronDown,
    CreditCard,
    GraduationCap,
    HeartHandshake,
    HelpCircle,
    Laptop,
    Layers,
    Menu,
    PhoneCall,
    School,
    ShieldCheck,
    Sparkles,
    UserCheck,
    Users,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import LoginDropdown from '@/components/lms/login-dropdown';
import { dashboard, register } from '@/routes';
import type { User } from '@/types';

interface NavbarProps {
    user?: User | null;
}

export default function Navbar({ user }: NavbarProps) {
    const { name } = usePage().props;
    const platformName = (name as string) || 'InstitutoPropio';

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileSubmenu, setMobileSubmenu] = useState<'product' | 'solutions' | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);

    // Active desktop dropdown: 'product' | 'solutions' | null
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const navRef = useRef<HTMLDivElement>(null);

    // Track scroll state
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Outside click dismiss
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (navRef.current && !navRef.current.contains(e.target as Node)) {
                setActiveDropdown(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Escape key dismiss
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setActiveDropdown(null);
                setMobileMenuOpen(false);
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Body scroll lock on mobile
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileMenuOpen]);

    const { url } = usePage();
    const currentPath = url ? url.split('?')[0] : '';

    return (
        <header
            ref={navRef}
            className={`sticky top-0 z-50 w-full transition-all duration-200 ${
                isScrolled
                    ? 'border-b border-slate-200/90 bg-white/95 shadow-xs backdrop-blur-md'
                    : 'border-b border-slate-200/80 bg-white/90 backdrop-blur-sm'
            }`}
        >
            {/* TOP UTILITY NAVIGATION BAR (RingCentral Layout) */}
            <div className="hidden border-b border-slate-100 bg-[#F5F8F7] py-1.5 text-xs text-slate-600 md:block">
                <div className="mx-auto flex w-full max-w-[1720px] items-center justify-between px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    {/* Left: System Status & Desktop App Teaser */}
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                            <span className="size-2 rounded-full bg-[#26965B] animate-pulse" />
                            Multi-Tenant Campus Infrastructure
                        </span>
                        <span className="text-slate-300">|</span>
                        <Link
                            href="/download"
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 hover:text-[#078675] transition-colors"
                        >
                            <Laptop className="size-3 text-slate-400" />
                            <span>Windows Desktop App</span>
                            <span className="rounded-full bg-[#078675]/15/80 px-1.5 py-0.2 text-[9px] font-bold text-[#078675]">
                                Tauri
                            </span>
                        </Link>
                    </div>

                    {/* Right: Sales & Support Links + SSO Login Dropdown */}
                    <div className="flex items-center gap-4">
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-[#078675] transition-colors"
                        >
                            <PhoneCall className="size-3 text-[#078675]" />
                            <span>Talk to Sales</span>
                        </Link>

                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-[#078675] transition-colors"
                        >
                            <HelpCircle className="size-3 text-slate-400" />
                            <span>Support</span>
                        </Link>

                        <span className="text-slate-300">|</span>

                        {/* Interactive Login Dropdown */}
                        <LoginDropdown variant="utility" />
                    </div>
                </div>
            </div>

            {/* MAIN NAVIGATION BAR */}
            <div className="mx-auto flex h-19 w-full max-w-[1720px] items-center justify-between px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                {/* Brand Logo & Name */}
                <Link
                    href="/"
                    className="group flex items-center gap-3 transition-transform hover:scale-[1.01]"
                    aria-label="InstitutoPropio Home"
                >
                    <img
                        src="/images/logo-horizontal.png"
                        alt="InstitutoPropio"
                        className="hidden h-9 w-auto object-contain sm:block"
                    />
                    <div className="flex items-center gap-2 sm:hidden">
                        <img
                            src="/images/logo-emblem.png"
                            alt="InstitutoPropio"
                            className="size-8 object-contain"
                        />
                        <span className="text-base font-extrabold tracking-tight text-[#173A5E]">
                            InstitutoPropio
                        </span>
                    </div>
                </Link>

                {/* Desktop Main Navigation Links with Dropdowns */}
                <nav
                    className="hidden items-center gap-1 lg:flex"
                    aria-label="Main Navigation"
                >
                    {/* Product Mega Menu Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() =>
                                setActiveDropdown(
                                    activeDropdown === 'product' ? null : 'product',
                                )
                            }
                            aria-expanded={activeDropdown === 'product'}
                            className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                                activeDropdown === 'product'
                                    ? 'bg-slate-100 text-[#078675]'
                                    : 'text-slate-700 hover:bg-slate-50 hover:text-[#078675]'
                            }`}
                        >
                            <span>Product</span>
                            <ChevronDown
                                className={`size-3.5 transition-transform duration-200 ${
                                    activeDropdown === 'product' ? 'rotate-180 text-[#078675]' : 'text-slate-400'
                                }`}
                            />
                        </button>

                        {activeDropdown === 'product' && (
                            <div className="absolute left-1/2 top-full mt-2 w-[720px] -translate-x-1/3 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 animate-in fade-in-50 zoom-in-95">
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Column 1: School Governance */}
                                    <div>
                                        <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            School Administration & Operations
                                        </h4>
                                        <div className="space-y-1">
                                            <Link
                                                href="/how-it-works"
                                                onClick={() => setActiveDropdown(null)}
                                                className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50"
                                            >
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#078675]/10 text-[#078675]">
                                                    <School className="size-4.5" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#078675]">
                                                        School Management OS
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        Admissions, classes, sections, subjects & staff
                                                    </div>
                                                </div>
                                            </Link>

                                            <Link
                                                href="/benefits"
                                                onClick={() => setActiveDropdown(null)}
                                                className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50"
                                            >
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                                    <Zap className="size-4.5" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#078675]">
                                                        Attendance & Daily Roll Call
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        30-second roll calls, substitute tracking & percentages
                                                    </div>
                                                </div>
                                            </Link>

                                            <Link
                                                href="/benefits"
                                                onClick={() => setActiveDropdown(null)}
                                                className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50"
                                            >
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                                    <CreditCard className="size-4.5" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#078675]">
                                                        Fee Invoicing & Payment Tracking
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        Fee structures, batch invoices & printable vouchers
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Column 2: Digital Learning & Academics */}
                                    <div>
                                        <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            Academics & Digital Learning
                                        </h4>
                                        <div className="space-y-1">
                                            <Link
                                                href="/courses"
                                                onClick={() => setActiveDropdown(null)}
                                                className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50"
                                            >
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                                    <BookOpen className="size-4.5" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#078675]">
                                                        Online Course LMS
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        Video lectures, module syllabus & track progress
                                                    </div>
                                                </div>
                                            </Link>

                                            <Link
                                                href="/benefits"
                                                onClick={() => setActiveDropdown(null)}
                                                className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50"
                                            >
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                                                    <Calendar className="size-4.5" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#078675]">
                                                        Timetable & Gradebook
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        Weekly period schedules, exams & mark evaluation
                                                    </div>
                                                </div>
                                            </Link>

                                            <Link
                                                href="/download"
                                                onClick={() => setActiveDropdown(null)}
                                                className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50"
                                            >
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#E49A2E]">
                                                    <Laptop className="size-4.5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-bold text-slate-900 group-hover:text-[#078675]">
                                                            Windows Desktop App
                                                        </span>
                                                        <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                                                            Coming Soon
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        Dedicated desktop client engineered with Tauri
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Mega-menu footer strip */}
                                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="size-4 text-[#078675]" />
                                        <span>Enterprise Multi-Tenant Data Isolation</span>
                                    </div>
                                    <Link
                                        href="/benefits"
                                        onClick={() => setActiveDropdown(null)}
                                        className="font-semibold text-[#078675] hover:underline"
                                    >
                                        View all architectural benefits &rarr;
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Solutions Mega Menu Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() =>
                                setActiveDropdown(
                                    activeDropdown === 'solutions' ? null : 'solutions',
                                )
                            }
                            aria-expanded={activeDropdown === 'solutions'}
                            className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                                activeDropdown === 'solutions'
                                    ? 'bg-slate-100 text-[#078675]'
                                    : 'text-slate-700 hover:bg-slate-50 hover:text-[#078675]'
                            }`}
                        >
                            <span>Solutions</span>
                            <ChevronDown
                                className={`size-3.5 transition-transform duration-200 ${
                                    activeDropdown === 'solutions' ? 'rotate-180 text-[#078675]' : 'text-slate-400'
                                }`}
                            />
                        </button>

                        {activeDropdown === 'solutions' && (
                            <div className="absolute left-1/2 top-full mt-2 w-[680px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 animate-in fade-in-50 zoom-in-95">
                                <div className="grid grid-cols-2 gap-6">
                                    {/* By Institution Type */}
                                    <div>
                                        <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            By Institution Type
                                        </h4>
                                        <div className="space-y-1">
                                            <Link
                                                href="/how-it-works"
                                                onClick={() => setActiveDropdown(null)}
                                                className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50"
                                            >
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#078675]/10 text-[#078675]">
                                                    <School className="size-4.5" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#078675]">
                                                        Independent Schools
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        Complete campus operating system for modern K-12 institutions
                                                    </div>
                                                </div>
                                            </Link>

                                            <Link
                                                href="/pricing"
                                                onClick={() => setActiveDropdown(null)}
                                                className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50"
                                            >
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                                                    <Building2 className="size-4.5" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#078675]">
                                                        Multi-School Groups & Chains
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        Manage 5, 10, or unlimited organizations from one executive master account
                                                    </div>
                                                </div>
                                            </Link>

                                            <Link
                                                href="/courses"
                                                onClick={() => setActiveDropdown(null)}
                                                className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50"
                                            >
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                                    <Award className="size-4.5" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#078675]">
                                                        Academies & Training Centers
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        Cohort curricula, self-paced courses, and graduation diplomas
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* By Educational Role */}
                                    <div>
                                        <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            By Stakeholder Role
                                        </h4>
                                        <div className="space-y-1">
                                            <Link
                                                href="/how-it-works"
                                                onClick={() => setActiveDropdown(null)}
                                                className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50"
                                            >
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                                    <UserCheck className="size-4.5" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#078675]">
                                                        Teachers & Faculty
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        Effortless roll call, timetable schedules & grade marks
                                                    </div>
                                                </div>
                                            </Link>

                                            <Link
                                                href="/benefits"
                                                onClick={() => setActiveDropdown(null)}
                                                className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50"
                                            >
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pink-50 text-pink-600">
                                                    <HeartHandshake className="size-4.5" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#078675]">
                                                        Parents & Students
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        Direct attendance logs, report cards & fee vouchers
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Dropdown bottom banner */}
                                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-600">
                                    <span>Need guidance on multi-tenant onboarding?</span>
                                    <Link
                                        href="/contact"
                                        onClick={() => setActiveDropdown(null)}
                                        className="font-semibold text-[#078675] hover:underline"
                                    >
                                        Schedule an institutional walkthrough &rarr;
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Features & Benefits Link */}
                    <Link
                        href="/benefits"
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                            currentPath === '/benefits'
                                ? 'bg-[#078675]/10 text-[#078675]'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-[#078675]'
                        }`}
                    >
                        Features & Benefits
                    </Link>

                    {/* How It Works Link */}
                    <Link
                        href="/how-it-works"
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                            currentPath === '/how-it-works'
                                ? 'bg-[#078675]/10 text-[#078675]'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-[#078675]'
                        }`}
                    >
                        How It Works
                    </Link>

                    {/* Explore Courses Link */}
                    <Link
                        href="/courses"
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                            currentPath.startsWith('/courses')
                                ? 'bg-[#078675]/10 text-[#078675]'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-[#078675]'
                        }`}
                    >
                        Explore Courses
                    </Link>

                    {/* Pricing Link — REQUIRED */}
                    <Link
                        href="/pricing"
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                            currentPath === '/pricing'
                                ? 'bg-[#078675]/10 text-[#078675]'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-[#078675]'
                        }`}
                    >
                        Pricing
                    </Link>

                    {/* About Us Link */}
                    <Link
                        href="/about"
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                            currentPath === '/about'
                                ? 'bg-[#078675]/10 text-[#078675]'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-[#078675]'
                        }`}
                    >
                        About Us
                    </Link>
                </nav>

                {/* Right Action Area */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <Button
                            asChild
                            size="sm"
                            className="h-10 cursor-pointer bg-[#E49A2E] px-4 font-bold text-white shadow-md shadow-[#E49A2E]/20 hover:bg-[#d08a24]"
                        >
                            <Link href={dashboard()}>
                                <span>Dashboard</span>
                                <ArrowRight className="ml-1.5 size-4" />
                            </Link>
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2.5">
                            <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="hidden font-semibold text-slate-700 hover:bg-slate-100 hover:text-[#078675] sm:inline-flex"
                            >
                                <Link href="/contact">Talk to Sales</Link>
                            </Button>

                            <Button
                                asChild
                                size="sm"
                                className="h-10 cursor-pointer bg-[#E49A2E] px-5 font-bold text-white shadow-md shadow-[#E49A2E]/20 hover:bg-[#d08a24]"
                            >
                                <Link href={register()}>
                                    <span>Get Started Free</span>
                                    <ArrowRight className="ml-1.5 size-4" />
                                </Link>
                            </Button>
                        </div>
                    )}

                    {/* Mobile Hamburger Button */}
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen((prev) => !prev)}
                        className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 lg:hidden"
                        aria-label="Toggle Navigation Menu"
                    >
                        {mobileMenuOpen ? (
                            <X className="size-5" />
                        ) : (
                            <Menu className="size-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* MOBILE NAVIGATION DRAWER */}
            {mobileMenuOpen && (
                <div className="border-b border-slate-200 bg-white px-4 pt-3 pb-6 shadow-xl lg:hidden max-h-[85vh] overflow-y-auto">
                    <div className="space-y-1">
                        {/* Product Submenu Toggle */}
                        <div>
                            <button
                                type="button"
                                onClick={() =>
                                    setMobileSubmenu(
                                        mobileSubmenu === 'product' ? null : 'product',
                                    )
                                }
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
                            >
                                <span>Product</span>
                                <ChevronDown
                                    className={`size-4 text-slate-400 transition-transform ${
                                        mobileSubmenu === 'product' ? 'rotate-180 text-[#078675]' : ''
                                    }`}
                                />
                            </button>
                            {mobileSubmenu === 'product' && (
                                <div className="ml-2 space-y-1 border-l-2 border-slate-100 pl-3 pt-1 pb-2 text-xs">
                                    <Link
                                        href="/how-it-works"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-1.5 font-medium text-slate-600 hover:text-[#078675]"
                                    >
                                        School Management OS
                                    </Link>
                                    <Link
                                        href="/benefits"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-1.5 font-medium text-slate-600 hover:text-[#078675]"
                                    >
                                        Attendance & Daily Roll Call
                                    </Link>
                                    <Link
                                        href="/benefits"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-1.5 font-medium text-slate-600 hover:text-[#078675]"
                                    >
                                        Fee Management & Invoicing
                                    </Link>
                                    <Link
                                        href="/courses"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-1.5 font-medium text-slate-600 hover:text-[#078675]"
                                    >
                                        Online Course LMS
                                    </Link>
                                    <Link
                                        href="/download"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-1.5 font-medium text-slate-600 hover:text-[#078675]"
                                    >
                                        Windows Desktop App (Tauri)
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Solutions Submenu Toggle */}
                        <div>
                            <button
                                type="button"
                                onClick={() =>
                                    setMobileSubmenu(
                                        mobileSubmenu === 'solutions' ? null : 'solutions',
                                    )
                                }
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
                            >
                                <span>Solutions</span>
                                <ChevronDown
                                    className={`size-4 text-slate-400 transition-transform ${
                                        mobileSubmenu === 'solutions' ? 'rotate-180 text-[#078675]' : ''
                                    }`}
                                />
                            </button>
                            {mobileSubmenu === 'solutions' && (
                                <div className="ml-2 space-y-1 border-l-2 border-slate-100 pl-3 pt-1 pb-2 text-xs">
                                    <Link
                                        href="/how-it-works"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-1.5 font-medium text-slate-600 hover:text-[#078675]"
                                    >
                                        Independent Schools
                                    </Link>
                                    <Link
                                        href="/pricing"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-1.5 font-medium text-slate-600 hover:text-[#078675]"
                                    >
                                        Multi-School Groups (5-10+ Orgs)
                                    </Link>
                                    <Link
                                        href="/courses"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-1.5 font-medium text-slate-600 hover:text-[#078675]"
                                    >
                                        Academies & Training Centers
                                    </Link>
                                    <Link
                                        href="/how-it-works"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-1.5 font-medium text-slate-600 hover:text-[#078675]"
                                    >
                                        Teachers & Faculty Operations
                                    </Link>
                                </div>
                            )}
                        </div>

                        <Link
                            href="/benefits"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
                        >
                            Features & Benefits
                        </Link>

                        <Link
                            href="/how-it-works"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
                        >
                            How It Works
                        </Link>

                        <Link
                            href="/courses"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
                        >
                            Explore Courses
                        </Link>

                        {/* Mobile Pricing Link */}
                        <Link
                            href="/pricing"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block rounded-xl px-3 py-2.5 text-sm font-bold text-[#078675] bg-[#078675]/10 hover:bg-[#078675]/10"
                        >
                            Pricing Plans
                        </Link>

                        <Link
                            href="/about"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
                        >
                            About Us
                        </Link>

                        <Link
                            href="/contact"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
                        >
                            Contact & Sales
                        </Link>
                    </div>

                    {/* Mobile Portal / Login Options */}
                    <div className="mt-4 border-t border-slate-100 pt-4">
                        <LoginDropdown variant="mobile" onCloseMenu={() => setMobileMenuOpen(false)} />
                    </div>

                    {/* Mobile CTA */}
                    <div className="mt-5 space-y-2">
                        <Button
                            asChild
                            className="w-full bg-[#E49A2E] font-bold text-white hover:bg-[#d08a24]"
                        >
                            <Link
                                href={register()}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Get Started Free &rarr;
                            </Link>
                        </Button>
                    </div>
                </div>
            )}
        </header>
    );
}
