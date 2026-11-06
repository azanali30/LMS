import { Link } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import {
    FileText,
    Shield,
    CreditCard,
    AlertCircle,
    UserCheck,
    Building2,
    Lock,
    Scale,
    HelpCircle,
} from 'lucide-react';

export default function TermsPage() {
    return (
        <PublicLayout title="Terms & Conditions — InstitutoPropio">
            <div className="border-b border-slate-100 bg-white py-14 sm:py-20">
                {/* Header */}
                <section className="mx-auto w-full max-w-[1720px] px-6 text-center sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="mx-auto max-w-3xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#078675]/20 bg-[#078675]/10 px-3.5 py-1 text-xs font-semibold text-[#078675]">
                            <FileText className="size-3.5" />
                            <span>Legal Agreement & Terms of Service</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-[#173A5E] sm:text-4xl lg:text-5xl">
                            Terms & Conditions
                        </h1>
                        <p className="mt-3 text-xs text-slate-500 sm:text-sm">
                            Last Updated: November 2026 &bull; Effective for all registered accounts and institutional tenants
                        </p>
                    </div>
                </section>

                {/* Paddle Merchant of Record Callout */}
                <section className="mx-auto mt-10 w-full max-w-4xl px-6 sm:px-8">
                    <div className="flex items-start gap-4 rounded-2xl border border-[#078675]/30 bg-[#078675]/5 p-5 sm:p-6 text-left">
                        <CreditCard className="mt-0.5 size-6 shrink-0 text-[#078675]" />
                        <div className="text-xs sm:text-sm leading-relaxed text-slate-700">
                            <span className="font-bold text-[#173A5E]">Merchant of Record Notice: </span>
                            Our order process is conducted by our online reseller and Merchant of Record,{' '}
                            <strong className="text-slate-900">Paddle.com</strong>. Paddle is the Merchant of Record for all online orders placed on InstitutoPropio. Paddle handles payment processing, billing compliance, sales tax/VAT remittance, customer service inquiries related to transactions, and payment returns.
                        </div>
                    </div>
                </section>

                {/* Terms Body */}
                <section className="mx-auto mt-12 w-full max-w-4xl space-y-10 px-6 text-slate-700 sm:px-8">
                    {/* Section 1 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <Building2 className="size-5 text-[#078675]" />
                            <h2 className="text-lg font-bold text-[#173A5E] sm:text-xl">
                                1. The InstitutoPropio Platform & Intended Users
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            InstitutoPropio is a multi-tenant education Software-as-a-Service (SaaS) operating system designed specifically for educational institutions, including primary and secondary schools, colleges, specialized academies, vocational training centers, tutoring networks, and individual learners.
                        </p>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            The platform provides cloud-based administrative tooling encompassing student admission management, class and cohort rosters, daily attendance roll call, timetable scheduling, curriculum and syllabus tracking, digital gradebooks, examination management, tuition fee invoicing, and online multimedia course delivery with digital completion certificates.
                        </p>
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <UserCheck className="size-5 text-[#078675]" />
                            <h2 className="text-lg font-bold text-[#173A5E] sm:text-xl">
                                2. Account Registration, Organization Ownership & Tenant Isolation
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            <strong>2.1 Account Creation:</strong> To access the platform, you must register an account by providing accurate, current, and complete registration information. You are solely responsible for safeguarding your credentials, including passkeys and passwords, and for all activities that occur under your account.
                        </p>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            <strong>2.2 Organization Ownership:</strong> An individual creating a school or academy workspace is designated as the Organization Owner. Organization Owners hold administrative authority over their tenant, including inviting faculty and students, configuring fee structures, managing billing plans, and assigning campus roles.
                        </p>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            <strong>2.3 Strict Tenant Isolation:</strong> Every educational organization operates within a cryptographically isolated tenant boundary. Administrative members, faculty, students, and parents of one organization cannot view, query, access, or modify records belonging to another organization.
                        </p>
                    </div>

                    {/* Section 3 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <CreditCard className="size-5 text-[#078675]" />
                            <h2 className="text-lg font-bold text-[#173A5E] sm:text-xl">
                                3. Subscriptions, Billing, Renewals & Paddle Merchant of Record
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            <strong>3.1 Subscription Plans:</strong> InstitutoPropio offers tiered organization-based subscription plans (Starter/Bronze for 1 institution, Growth/Silver for up to 5 institutions, Professional/Gold for up to 10 institutions, and Enterprise/Premium for unlimited institutions). Students and teacher accounts are unlimited across all plans.
                        </p>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            <strong>3.2 Merchant of Record:</strong> All online subscription transactions and checkouts are facilitated and billed by Paddle.com Market Ltd (Paddle), acting as Merchant of Record. Paddle processes your payment details under its own Terms and Privacy Policy. When you purchase an InstitutoPropio subscription, you enter into a contractual purchasing relationship with Paddle for the financial transaction.
                        </p>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            <strong>3.3 Billing Cycles & Auto-Renewal:</strong> Subscriptions are billed in advance on a recurring monthly or annual basis, depending on the billing interval selected at checkout. Subscriptions automatically renew at the end of each billing cycle unless cancelled prior to the renewal date.
                        </p>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            <strong>3.4 Price Adjustments:</strong> Any subscription price modifications will be communicated with reasonable advance written notice. Continued use of the service following the effective date of a price change constitutes acceptance of the modified billing rate.
                        </p>
                    </div>

                    {/* Section 4 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <Shield className="size-5 text-[#078675]" />
                            <h2 className="text-lg font-bold text-[#173A5E] sm:text-xl">
                                4. Acceptable Use Policy & Platform Restrictions
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            You agree not to misuse the InstitutoPropio platform. You shall not:
                        </p>
                        <ul className="list-disc space-y-1.5 pl-6 text-xs sm:text-sm text-slate-600">
                            <li>Attempt to bypass, defeat, or probe tenant boundaries, authentication controls, or authorization rules;</li>
                            <li>Upload, transmit, or store unlawful, defamatory, infringing, or malicious content;</li>
                            <li>Interfere with or disrupt platform servers, databases, or API infrastructure;</li>
                            <li>Engage in unauthorized scraping, automated data extraction, or denial-of-service activities;</li>
                            <li>Use the platform in violation of applicable student privacy, data protection, or child online safety laws.</li>
                        </ul>
                    </div>

                    {/* Section 5 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <AlertCircle className="size-5 text-[#078675]" />
                            <h2 className="text-lg font-bold text-[#173A5E] sm:text-xl">
                                5. Account Suspension & Termination
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            <strong>5.1 Suspension for Cause:</strong> We reserve the right to suspend or restrict access to any account or organization workspace immediately and without prior notice in the event of a material breach of these Terms, non-payment, suspected fraudulent activity, or conduct that poses security risks to other institutions.
                        </p>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            <strong>5.2 Cancellation by Customer:</strong> Organization Owners may cancel their subscription at any time via the billing management portal. Upon cancellation, the organization retains access to the subscribed features through the conclusion of the active paid billing period.
                        </p>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            <strong>5.3 Data Retrieval Upon Termination:</strong> Upon termination or expiration of an active subscription, organization administrators will be granted a reasonable grace period to export student attendance, gradebook, and fee records before workspace data is archived.
                        </p>
                    </div>

                    {/* Section 6 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <Scale className="size-5 text-[#078675]" />
                            <h2 className="text-lg font-bold text-[#173A5E] sm:text-xl">
                                6. Limitation of Liability & Service Warranties
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            The platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. While we strive for continuous uptime and rigorous data integrity, InstitutoPropio and its operators disclaim all warranties, express or implied, including merchantability, fitness for a particular educational purpose, and non-infringement. In no event shall InstitutoPropio or Paddle be liable for indirect, incidental, consequential, or punitive damages.
                        </p>
                    </div>

                    {/* Section 7 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <HelpCircle className="size-5 text-[#078675]" />
                            <h2 className="text-lg font-bold text-[#173A5E] sm:text-xl">
                                7. Contact Information & Legal Inquiries
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            For legal notices, terms inquiries, or institutional contracts, please submit an inquiry via our{' '}
                            <Link href="/contact" className="font-semibold text-[#078675] hover:underline">
                                Contact Portal
                            </Link>
                            . For billing inquiries and payment receipt assistance, you may also reach out directly to Paddle at{' '}
                            <a
                                href="https://paddle.net"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-[#078675] hover:underline"
                            >
                                paddle.net
                            </a>
                            .
                        </p>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                            <p className="font-medium text-slate-700">Entity & Registration Notice:</p>
                            <p className="mt-1">
                                Operating as <strong>InstitutoPropio</strong>. Operating company registration details and official jurisdiction: [Pending Official Corporate Filing / Available upon request]. Online sales are fulfilled globally by Paddle.com Market Ltd as Merchant of Record.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}

