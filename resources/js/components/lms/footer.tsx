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
            {/* Top Brand Gradient Ribbon */}
            <div className="h-[2.5px] w-full bg-gradient-to-r from-[#173A5E] via-[#078675] via-[#26965B] to-[#E49A2E]" />

            <div className="mx-auto w-full max-w-[1720px] px-6 py-16 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-6">
                    {/* Platform Brand Column */}
                    <div className="space-y-4 lg:col-span-2">
                        <Link
                            href={home()}
                            className="inline-flex items-center gap-3 transition-transform hover:scale-[1.01]"
                        >
                            <img
                                src="/images/logo-horizontal.png"
                                alt="InstitutoPropio"
                                className="h-9 w-auto object-contain"
                            />
                        </Link>

                        <p className="max-w-sm text-xs leading-relaxed text-slate-500">
                            A next-generation enterprise educational operating system uniting multi-tenant campus management with interactive multimedia e-learning and verifiable digital certifications.
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-2">
                            <span className="flex items-center gap-1.5 rounded-full border border-[#26965B]/30 bg-[#26965B]/10 px-2.5 py-1 text-[11px] font-bold text-[#26965B]">
                                <span className="size-1.5 animate-pulse rounded-full bg-[#26965B]" />
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
                                    className="transition-colors hover:text-[#078675]"
                                >
                                    Multi-Tenant Administration
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/benefits"
                                    className="transition-colors hover:text-[#078675]"
                                >
                                    Automated Daily Roll Call
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/benefits"
                                    className="transition-colors hover:text-[#078675]"
                                >
                                    Academic Timetable Scheduling
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/benefits"
                                    className="transition-colors hover:text-[#078675]"
                                >
                                    Digital Gradebook & Exams
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/benefits"
                                    className="transition-colors hover:text-[#078675]"
                                >
                                    Tuition Fee Billing & Invoices
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/courses"
                                    className="font-bold text-[#078675] transition-colors hover:underline"
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
                                    className="font-bold text-[#078675] hover:underline"
                                >
                                    Pricing Plans (Bronze to Premium)
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={login.url()}
                                    className="transition-colors hover:text-[#078675]"
                                >
                                    Account Sign In
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/register?journey=school"
                                    className="transition-colors hover:text-[#078675]"
                                >
                                    Register School Free
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/download"
                                    className="inline-flex items-center gap-1 font-semibold text-slate-700 transition-colors hover:text-[#078675]"
                                >
                                    <Laptop className="size-3" />
                                    <span>Windows Desktop App (Tauri)</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal & Compliance Column */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
                            Legal & Policies
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-600">
                            <li>
                                <Link
                                    href="/terms"
                                    className="transition-colors hover:text-[#078675]"
                                >
                                    Terms & Conditions
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/privacy-policy"
                                    className="transition-colors hover:text-[#078675]"
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/refund-policy"
                                    className="transition-colors hover:text-[#078675]"
                                >
                                    Refund Policy
                                </Link>
                            </li>
                            <li className="pt-2 text-[11px] leading-relaxed text-slate-400">
                                Payments securely processed by <strong>Paddle</strong> as Merchant of Record.
                            </li>
                        </ul>
                    </div>

                    {/* Contact & Support */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
                            Support & Contact
                        </h4>
                        <ul className="space-y-2.5 text-xs text-slate-600">
                            <li className="flex items-start gap-2">
                                <Mail className="mt-0.5 size-4 shrink-0 text-[#078675]" />
                                <div>
                                    <span className="block font-medium text-slate-800">
                                        Online Inquiries
                                    </span>
                                    <Link
                                        href="/contact"
                                        className="text-[11px] text-[#078675] hover:underline"
                                    >
                                        Submit Support Message
                                    </Link>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <HelpCircle className="mt-0.5 size-4 shrink-0 text-[#078675]" />
                                <div>
                                    <span className="block font-medium text-slate-800">
                                        Help & FAQs
                                    </span>
                                    <Link
                                        href="/contact"
                                        className="text-[11px] text-slate-500 hover:text-slate-900"
                                    >
                                        Frequently Asked Questions
                                    </Link>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#078675]" />
                                <div>
                                    <span className="block font-medium text-slate-800">
                                        Billing Support
                                    </span>
                                    <a
                                        href="https://paddle.net"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] text-slate-500 hover:text-[#078675]"
                                    >
                                        Paddle Order Lookup (paddle.net)
                                    </a>
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

                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                        <Link
                            href="/pricing"
                            className="font-bold text-[#078675] hover:underline"
                        >
                            Pricing
                        </Link>
                        <Link
                            href="/about"
                            className="transition-colors hover:text-slate-900"
                        >
                            About Us
                        </Link>
                        <Link
                            href="/contact"
                            className="transition-colors hover:text-slate-900"
                        >
                            Contact
                        </Link>
                        <Link
                            href="/terms"
                            className="transition-colors hover:text-slate-900"
                        >
                            Terms
                        </Link>
                        <Link
                            href="/privacy-policy"
                            className="transition-colors hover:text-slate-900"
                        >
                            Privacy
                        </Link>
                        <Link
                            href="/refund-policy"
                            className="transition-colors hover:text-slate-900"
                        >
                            Refunds
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
