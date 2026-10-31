import { Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    Bell,
    CheckCircle2,
    Cpu,
    Download,
    HardDrive,
    HelpCircle,
    Laptop,
    Layers,
    Lock,
    Monitor,
    RefreshCw,
    Server,
    ShieldCheck,
    Sparkles,
    Wifi,
    Zap,
} from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import { Button } from '@/components/ui/button';

export default function DownloadPage() {
    return (
        <PublicLayout title="Windows Desktop Application — InstitutoPropio">
            <div className="relative overflow-hidden bg-white">
                {/* Hero Header */}
                <section className="relative mx-auto w-full max-w-[1720px] px-6 pt-16 pb-12 text-center sm:px-8 md:px-12 lg:px-16 xl:px-20 border-b border-slate-100">
                    <div className="mx-auto max-w-4xl">
                    {/* Eyebrow badge */}
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-[#1769E0]">
                        <Laptop className="size-3.5 text-[#1769E0]" />
                        <span>Windows Tauri Desktop Client</span>
                    </div>

                    <h1 className="text-3xl font-extrabold tracking-tight text-[#0B1528] sm:text-5xl lg:text-6xl">
                        Dedicated Desktop Power for Your{' '}
                        <span className="text-[#1769E0]">Campus Workspace</span>
                    </h1>

                    <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                        Experience the complete School Management & E-Learning LMS in a distraction-free,
                        hardware-accelerated native Windows application engineered with Tauri and modern Webview2.
                    </p>

                    {/* Official Release State Banner (Coming Soon - As Required) */}
                    <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50/90 p-5 shadow-sm text-left">
                        <div className="flex items-start gap-3.5">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700">
                                <Sparkles className="size-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-amber-900">
                                        Release In Build & Verification Phase
                                    </h3>
                                    <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                        Coming Soon
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-amber-800/90 leading-relaxed">
                                    The official Windows installer (.msi / .exe) is currently in final QA testing and code-signing.
                                    In accordance with our strict platform standards, direct binary download links will become active immediately upon public release build certification.
                                    Meanwhile, all features are 100% accessible via your web browser.
                                </p>
                                <div className="mt-3.5 flex flex-wrap items-center gap-3">
                                    <Button
                                        asChild
                                        size="sm"
                                        className="bg-[#1769E0] text-xs font-bold text-white hover:bg-[#1256B8]"
                                    >
                                        <Link href="/register">
                                            Access Web Platform Now
                                            <ArrowRight className="ml-1.5 size-3.5" />
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="border-amber-300 bg-white text-xs font-semibold text-amber-900 hover:bg-amber-100"
                                    >
                                        <Link href="/contact">
                                            Notify My Institution
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                </section>

                {/* Important Connectivity Requirement Notice */}
                <section className="mx-auto w-full max-w-[1720px] px-6 py-8 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-xs">
                        <div className="flex items-start gap-3">
                            <Server className="mt-0.5 size-5 shrink-0 text-[#1769E0]" />
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">
                                    Server Connection & Connectivity Requirement
                                </h4>
                                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                                    The Windows desktop client is a secure native container that connects directly to your institution's LMS server instance over HTTPS and Secure WebSockets.
                                    It requires an active internet or local campus network connection and an accessible LMS host (such as your institution's custom domain or local development environment at <code>localhost:8000</code>).
                                    Offline authentication caching allows reading previously loaded curriculum content, while real-time updates require server connectivity.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Key Benefits of the Desktop App */}
                <section className="border-t border-slate-200 bg-[#F7F9FC] py-16 sm:py-20">
                    <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                        <div className="text-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#1769E0]">
                                Native Capabilities
                            </span>
                            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0B1528] sm:text-3xl">
                                Why Deploy the Windows Desktop Client?
                            </h2>
                            <p className="mx-auto mt-3 max-w-2xl text-xs text-slate-600 sm:text-sm">
                                Built specifically for high-frequency administrative users, teachers conducting live roll call, and students focused on rigorous study sessions.
                            </p>
                        </div>

                        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    icon: Zap,
                                    title: 'Zero Tab Clutter & Fast Launch',
                                    description:
                                        'Launches instantly from your taskbar or Start menu into a dedicated, focused workstation without browser tabs, bookmarks, or social distractions.',
                                },
                                {
                                    icon: Bell,
                                    title: 'Native Windows Notifications',
                                    description:
                                        'Receive real-time desktop toast alerts for instant roll calls, timetable period changes, fee reminder triggers, and grading feedback.',
                                },
                                {
                                    icon: Cpu,
                                    title: 'Tauri Lightweight Architecture',
                                    description:
                                        'Unlike resource-heavy Electron wrappers, Tauri leverages native Windows WebView2, consuming less than 60MB of RAM during typical use.',
                                },
                                {
                                    icon: Lock,
                                    title: 'Hardware-Backed Session Security',
                                    description:
                                        'Stores credentials and session tokens within encrypted Windows Credential Manager, protecting student and financial records.',
                                },
                                {
                                    icon: Monitor,
                                    title: 'Multi-Monitor & High-DPI Support',
                                    description:
                                        'Crisp font rendering and full fractional scaling across 4K displays, ideal for faculty reviewing multi-column timetable matrices.',
                                },
                                {
                                    icon: ShieldCheck,
                                    title: 'Direct Document Printing',
                                    description:
                                        'One-click native printing for official student admission forms, monthly fee vouchers, payment receipts, and completion certificates.',
                                },
                            ].map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.title}
                                        className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:border-[#1769E0]/40 hover:shadow-md"
                                    >
                                        <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-[#1769E0] transition-colors group-hover:bg-[#1769E0] group-hover:text-white">
                                            <Icon className="size-5" />
                                        </div>
                                        <h3 className="mt-4 text-base font-bold text-slate-900">
                                            {item.title}
                                        </h3>
                                        <p className="mt-2 text-xs leading-relaxed text-slate-600">
                                            {item.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* System Requirements & Verification Table */}
                <section className="py-16 sm:py-20 bg-white border-t border-slate-200">
                    <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                        <div className="text-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#1769E0]">
                                Specifications
                            </span>
                            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0B1528] sm:text-3xl">
                                Verified System Requirements
                            </h2>
                            <p className="mx-auto mt-2 max-w-xl text-xs text-slate-600 sm:text-sm">
                                Certified for modern Windows environments across school computer labs and personal workstations.
                            </p>
                        </div>

                        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-[#F7F9FC] shadow-xs">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-200 bg-slate-100 text-slate-700">
                                    <tr>
                                        <th className="px-6 py-3.5 font-bold">Component</th>
                                        <th className="px-6 py-3.5 font-bold">Minimum Specification</th>
                                        <th className="px-6 py-3.5 font-bold">Recommended Specification</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/80 bg-white">
                                    <tr>
                                        <td className="px-6 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                                            <Monitor className="size-4 text-[#1769E0]" />
                                            Operating System
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-600">
                                            Windows 10 64-bit (Build 19041+)
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-800 font-medium">
                                            Windows 11 64-bit (Version 22H2 or later)
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                                            <Cpu className="size-4 text-[#1769E0]" />
                                            Processor & Architecture
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-600">
                                            Dual-Core x86_64, 1.6 GHz
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-800 font-medium">
                                            Quad-Core Intel i3 / AMD Ryzen 3 or higher
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                                            <HardDrive className="size-4 text-[#1769E0]" />
                                            Memory (RAM)
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-600">
                                            2 GB RAM
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-800 font-medium">
                                            4 GB RAM or higher
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                                            <Layers className="size-4 text-[#1769E0]" />
                                            Disk Space
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-600">
                                            150 MB for installation & local cache
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-800 font-medium">
                                            500 MB (for offline lesson video buffers)
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                                            <Sparkles className="size-4 text-[#1769E0]" />
                                            Runtime Engine
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-600">
                                            Microsoft Edge WebView2 Evergreen
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-800 font-medium">
                                            Pre-installed in Windows 10/11
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Installation & Troubleshooting Guidance */}
                <section className="border-t border-slate-200 bg-[#F7F9FC] py-16 sm:py-20">
                    <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                            {/* Step-by-Step Installation */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#1769E0]">
                                        Setup Workflow
                                    </span>
                                    <h3 className="text-xl font-bold tracking-tight text-[#0B1528]">
                                        Installation Steps (When Released)
                                    </h3>
                                    <p className="text-xs text-slate-600">
                                        Designed for straightforward one-click setup across single devices or mass institutional deployment via Group Policy (GPO).
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        {
                                            step: '01',
                                            title: 'Download the Official Package',
                                            desc: 'Obtain the verified installer binary (.msi for administrators, .exe for standard users).',
                                        },
                                        {
                                            step: '02',
                                            title: 'Run the Setup Wizard',
                                            desc: 'Double-click the installer and grant User Account Control (UAC) permissions.',
                                        },
                                        {
                                            step: '03',
                                            title: 'Connect Your LMS Server',
                                            desc: 'Enter your custom campus URL (e.g., https://school.institutopropio.com) or use the default cloud endpoint.',
                                        },
                                        {
                                            step: '04',
                                            title: 'Sign In to Your Portal',
                                            desc: 'Authenticate using your School Admin, Teacher, Student, or Parent credentials.',
                                        },
                                    ].map((s) => (
                                        <div
                                            key={s.step}
                                            className="flex items-start gap-3.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs"
                                        >
                                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-[#1769E0]">
                                                {s.step}
                                            </span>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-900">
                                                    {s.title}
                                                </h4>
                                                <p className="mt-0.5 text-[11px] text-slate-500">
                                                    {s.desc}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Troubleshooting Guidance */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#1769E0]">
                                        Help & Diagnostics
                                    </span>
                                    <h3 className="text-xl font-bold tracking-tight text-[#0B1528]">
                                        Troubleshooting Guidance
                                    </h3>
                                    <p className="text-xs text-slate-600">
                                        Common inquiries and configuration checks for network administrators and lab managers.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                                            <Wifi className="size-4 text-[#1769E0]" />
                                            <span>"Cannot connect to LMS Server"</span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                                            Ensure port 443 (HTTPS) and port 80 are open on your local network firewall. If testing locally on Laragon, verify that your Apache/Nginx web server is started and accessible at <code>http://localhost:8000</code> or your configured virtual host.
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                                            <AlertCircle className="size-4 text-amber-500" />
                                            <span>WebView2 Runtime Missing</span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                                            Windows 11 includes WebView2 by default. On older Windows 10 machines, download the official standalone Evergreen Bootstrapper directly from Microsoft if prompted by the installer.
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                                            <HelpCircle className="size-4 text-[#1769E0]" />
                                            <span>Support Inquiries</span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                                            For technical assistance or institutional provisioning requests, submit a direct inquiry through our{' '}
                                            <Link href="/contact" className="font-semibold text-[#1769E0] hover:underline">
                                                Contact Support
                                            </Link>{' '}
                                            form.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
