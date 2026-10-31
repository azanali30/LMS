import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import PublicLayout from '@/layouts/public-layout';
import {
    Mail,
    Phone,
    MapPin,
    Clock,
    Send,
    Loader2,
    CheckCircle2,
    MessageSquare,
    HelpCircle,
    ChevronDown,
    ShieldCheck,
} from 'lucide-react';
import type { Auth, Flash } from '@/types';
import { Button } from '@/components/ui/button';

export default function ContactPage() {
    const { auth, flash } = usePage<{ auth: Auth; flash?: Flash }>().props;

    const { data, setData, post, processing, reset, errors } = useForm({
        name: auth?.user?.name || '',
        email: auth?.user?.email || '',
        subject: '',
        message: '',
    });

    const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
        0: true,
    });

    const toggleFaq = (idx: number) => {
        setFaqOpen((prev) => ({
            ...prev,
            [idx]: !prev[idx],
        }));
    };

    const submitContact = (e: React.FormEvent) => {
        e.preventDefault();
        post('/contact', {
            onSuccess: () => reset('subject', 'message'),
        });
    };

    const faqs = [
        {
            q: "How does multi-tenant isolation protect our school's student records?",
            a: "Our architecture enforces server-side database scoping on every query via our TenantScope architecture. Organization A can never query, view, or modify Organization B's private academic or personal data under any circumstances.",
        },
        {
            q: 'Can our teachers also enroll as students in other online courses?',
            a: 'Yes. Our dual-layer role architecture cleanly decouples platform user identity from institutional memberships. An instructor at one academy can simultaneously participate as an individual learner in courses across the platform.',
        },
        {
            q: 'What is required to onboard our school or university?',
            a: 'Institution setup takes less than 2 minutes. Choose "Create a School" during registration, configure your academic calendar terms, and dispatch secure invite tokens to your faculty.',
        },
        {
            q: 'How do parent accounts work?',
            a: "Parents receive a secure invitation link from the school registrar and link directly to their child's student profile, allowing real-time monitoring of attendance registers and examination grades.",
        },
    ];

    return (
        <PublicLayout title="Contact Us & Talk to Sales — InstitutoPropio">
            <div className="bg-white py-16 sm:py-24 border-b border-slate-100">
                {/* Hero Header */}
                <section className="relative mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 text-center">
                    <div className="mx-auto max-w-4xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-[#1769E0]">
                            <MessageSquare className="size-3.5" />
                            <span>Direct Institutional Communication</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-[#0B1528] sm:text-5xl">
                            We're Here to Support Your Campus
                        </h1>
                        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg leading-relaxed">
                            Whether you are an institution director evaluating deployment, a faculty educator needing assistance, or a student with questions, our education specialists are ready to help.
                        </p>
                    </div>
                </section>

                {/* Form & Info Section */}
                <section className="mx-auto mt-16 w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                        {/* Contact Information & Channels */}
                        <div className="space-y-6 lg:col-span-5">
                            <div className="rounded-3xl border border-slate-200 bg-[#F7F9FC] p-6 sm:p-8 shadow-xs">
                                <h2 className="mb-6 text-lg font-extrabold text-[#0B1528]">
                                    Direct Channels
                                </h2>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1769E0]">
                                            <Mail className="size-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                Electronic Mail
                                            </h3>
                                            <p className="mt-0.5 text-sm font-semibold text-slate-900">
                                                sales@institutopropio.com
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                support@institutopropio.com
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1769E0]">
                                            <Phone className="size-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                Telephone Line
                                            </h3>
                                            <p className="mt-0.5 text-sm font-semibold text-slate-900">
                                                +1 (800) 412-8890
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Toll-free Institutional Inquiries
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1769E0]">
                                            <MapPin className="size-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                Campus Technology HQ
                                            </h3>
                                            <p className="mt-0.5 text-sm font-semibold text-slate-900">
                                                Technology Innovation Center
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                500 Education Park Way, Suite 800
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1769E0]">
                                            <Clock className="size-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                Operational Hours
                                            </h3>
                                            <p className="mt-0.5 text-sm font-semibold text-slate-900">
                                                Monday – Friday: 08:00 – 18:00 UTC
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                24/7 Platform Incident Monitoring
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Contact Form */}
                        <div className="lg:col-span-7">
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
                                <h2 className="mb-2 text-xl font-bold tracking-tight text-[#0B1528]">
                                    Send Us an Inquiry
                                </h2>
                                <p className="mb-6 text-xs text-slate-500">
                                    Fill out the form below and an educational specialist will respond promptly.
                                </p>

                                {flash?.success && (
                                    <div className="mb-6 flex animate-in items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs font-medium text-emerald-800 fade-in">
                                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                                        <span>{flash.success}</span>
                                    </div>
                                )}

                                <form onSubmit={submitContact} className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-xs font-bold text-slate-700 uppercase">
                                                Your Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Dr. Sarah Jenkins"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 transition outline-none focus:border-[#1769E0] focus:bg-white focus:ring-2 focus:ring-[#1769E0]/20"
                                            />
                                            {errors.name && (
                                                <p className="mt-1 text-xs text-rose-500 font-medium">
                                                    {errors.name}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-bold text-slate-700 uppercase">
                                                Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                placeholder="s.jenkins@academy.edu"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 transition outline-none focus:border-[#1769E0] focus:bg-white focus:ring-2 focus:ring-[#1769E0]/20"
                                            />
                                            {errors.email && (
                                                <p className="mt-1 text-xs text-rose-500 font-medium">
                                                    {errors.email}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-slate-700 uppercase">
                                            Inquiry Subject *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. School Enterprise Deployment & Onboarding Assistance"
                                            value={data.subject}
                                            onChange={(e) => setData('subject', e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 transition outline-none focus:border-[#1769E0] focus:bg-white focus:ring-2 focus:ring-[#1769E0]/20"
                                        />
                                        {errors.subject && (
                                            <p className="mt-1 text-xs text-rose-500 font-medium">
                                                {errors.subject}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-slate-700 uppercase">
                                            Detailed Message *
                                        </label>
                                        <textarea
                                            rows={5}
                                            required
                                            placeholder="Provide context regarding your institution, student body size, or technical questions..."
                                            value={data.message}
                                            onChange={(e) => setData('message', e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 transition outline-none focus:border-[#1769E0] focus:bg-white focus:ring-2 focus:ring-[#1769E0]/20"
                                        />
                                        {errors.message && (
                                            <p className="mt-1 text-xs text-rose-500 font-medium">
                                                {errors.message}
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full h-11 bg-[#FF7A30] font-bold text-white shadow-md hover:bg-[#E5661E] disabled:opacity-60 cursor-pointer"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                                <span>Transmitting Message...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 size-4" />
                                                <span>Transmit Message</span>
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="mx-auto mt-20 max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 text-center">
                        <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-[#1769E0] uppercase">
                            <HelpCircle className="size-3.5" />
                            <span>Quick Answers</span>
                        </div>
                        <h2 className="text-2xl font-extrabold tracking-tight text-[#0B1528]">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {faqs.map((faq, idx) => {
                            const isOpen = faqOpen[idx] ?? false;
                            return (
                                <div
                                    key={idx}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleFaq(idx)}
                                        className="flex w-full items-center justify-between px-5 py-4 text-left text-xs font-bold text-slate-900 transition hover:bg-slate-50 sm:text-sm"
                                    >
                                        <span>{faq.q}</span>
                                        <ChevronDown
                                            className={`size-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#1769E0]' : ''}`}
                                        />
                                    </button>
                                    {isOpen && (
                                        <div className="border-t border-slate-100 px-5 pt-3 pb-4 text-xs leading-relaxed text-slate-600">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
