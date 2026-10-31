import { Link, usePage } from '@inertiajs/react';
import { HelpCircle, Laptop, Mail, MapPin, PhoneCall, ShieldCheck } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home, login, register } from '@/routes';

export default function Footer() {
    const { name } = usePage().props;
    const platformName = (name as string) || 'InstitutoPropio';
    const currentYear = new Date().getFullYear();

    return (
        <footer
            id="contact"
            className="border-t border-slate-200 bg-white text-slate-600"
        >
            <div className="mx-auto w-full max-w-[1720px] px-6 py-16 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
                    {/* Platform Brand Column */}
                    <div className="space-y-4 lg:col-span-2">
                        <Link
                            href={home()}
                            className="inline-flex items-center gap-3 transition-transform hover:scale-[1.01]"
                        >
                            <div className="flex size-9 items-center justify-center rounded-xl bg-[#1769E0] text-white shadow-md shadow-blue-500/20 ring-2 ring-[#1769E0]/20">
                                <AppLogoIcon className="size-5 text-white" />
                            </div>
                            <span className="text-xl font-extrabold tracking-tight text-[#0B1528]">
                                {platformName}
                            </span>
                        </Link>

                        <p className="max-w-sm text-xs leading-relaxed text-slate-500">
                            A next-generation enterprise educational operating system uniting multi-tenant campus management with interactive multimedia e-learning and verifiable digital certifications.
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-2">
                            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                                All Systems Operational
                            </span>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                Multi-Tenant Campus Core v2.4
                            </span>
                        </div>
                    </div>

                    {/* School OS & Modules Column */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
                            Campus & LMS Modules
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-600">
                            <li>
                                <Link
                                    href="/benefits"
                                    className="transition-colors hover:text-[#1769E0]"
                                >
                                    Multi-Tenant Administration
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/benefits"
                                    className="transition-colors hover:text-[#1769E0]"
                                >
                                    Automated Daily Roll Call
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/benefits"
                                    className="transition-colors hover:text-[#1769E0]"
                                >
                                    Academic Timetable Scheduling
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/benefits"
                                    className="transition-colors hover:text-[#1769E0]"
                                >
                                    Digital Gradebook & Exams
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/benefits"
                                    className="transition-colors hover:text-[#1769E0]"
                                >
                                    Tuition Fee Billing & Invoices
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/courses"
                                    className="font-bold text-[#1769E0] transition-colors hover:underline"
                                >
                                    Online Courses Catalog &rarr;
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Portals & Pricing */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
                            Portals & Plans
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-600">
                            <li>
                                <Link
                                    href="/pricing"
                                    className="font-bold text-[#1769E0] hover:underline"
                                >
                                    Pricing Plans (Bronze to Premium)
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={login.url()}
                                    className="transition-colors hover:text-[#1769E0]"
                                >
                                    Account Sign In
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/register?journey=school"
                                    className="transition-colors hover:text-[#1769E0]"
                                >
                                    Register School Free
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/download"
                                    className="inline-flex items-center gap-1 font-semibold text-slate-700 transition-colors hover:text-[#1769E0]"
                                >
                                    <Laptop className="size-3" />
                                    <span>Windows Desktop App (Tauri)</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact & Support */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
                            Support & Inquiries
                        </h4>
                        <ul className="space-y-2.5 text-xs text-slate-600">
                            <li className="flex items-start gap-2">
                                <Mail className="mt-0.5 size-4 shrink-0 text-[#1769E0]" />
                                <div>
                                    <span className="block font-medium text-slate-800">
                                        Admissions & Sales
                                    </span>
                                    <Link
                                        href="/contact"
                                        className="text-[11px] text-[#1769E0] hover:underline"
                                    >
                                        sales@institutopropio.com
                                    </Link>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <PhoneCall className="mt-0.5 size-4 shrink-0 text-[#1769E0]" />
                                <div>
                                    <span className="block font-medium text-slate-800">
                                        Toll-Free Helpline
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                        +1 (800) 412-8890
                                    </span>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <HelpCircle className="mt-0.5 size-4 shrink-0 text-[#1769E0]" />
                                <div>
                                    <span className="block font-medium text-slate-800">
                                        Help Center & FAQs
                                    </span>
                                    <Link
                                        href="/contact"
                                        className="text-[11px] text-slate-500 hover:text-slate-900"
                                    >
                                        View Common Questions
                                    </Link>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-xs text-slate-500 sm:flex-row">
                    <p>
                        © {currentYear} {platformName}. Enterprise School OS & E-Learning SaaS.
                    </p>

                    <div className="flex flex-wrap items-center gap-6">
                        <Link
                            href="/pricing"
                            className="font-bold text-[#1769E0] hover:underline"
                        >
                            Pricing
                        </Link>
                        <Link
                            href="/benefits"
                            className="transition-colors hover:text-slate-900"
                        >
                            Features & Benefits
                        </Link>
                        <Link
                            href="/how-it-works"
                            className="transition-colors hover:text-slate-900"
                        >
                            How It Works
                        </Link>
                        <Link
                            href="/about"
                            className="transition-colors hover:text-slate-900"
                        >
                            About Us
                        </Link>
                        <Link
                            href="/download"
                            className="transition-colors hover:text-slate-900"
                        >
                            Desktop App
                        </Link>
                        <Link
                            href="/contact"
                            className="transition-colors hover:text-slate-900"
                        >
                            Contact Sales
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
