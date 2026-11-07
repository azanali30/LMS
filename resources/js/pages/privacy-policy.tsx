import { Link } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import {
    ShieldCheck,
    Lock,
    Eye,
    Database,
    CreditCard,
    UserCheck,
    FileCheck,
    Globe,
    HelpCircle,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
    return (
        <PublicLayout title="Privacy Policy — InstitutoPropio">
            <div className="border-b border-slate-100 bg-gradient-hero py-14 sm:py-20">
                {/* Header */}
                <section className="mx-auto w-full max-w-[1720px] px-6 text-center sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="mx-auto max-w-3xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#078675]/25 bg-gradient-accent-pill px-3.5 py-1 text-xs font-semibold text-[#173A5E]">
                            <ShieldCheck className="size-3.5 text-[#078675]" />
                            <span>Data Protection & Privacy Commitment</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-[#173A5E] sm:text-4xl lg:text-5xl">
                            Privacy Policy
                        </h1>
                        <p className="mt-3 text-xs text-slate-500 sm:text-sm">
                            Last Updated: November 2026 &bull; Strict adherence to student privacy and tenant isolation
                        </p>
                    </div>
                </section>

                {/* Paddle Merchant of Record Privacy Callout */}
                <section className="mx-auto mt-10 w-full max-w-4xl px-6 sm:px-8">
                    <div className="flex items-start gap-4 rounded-2xl border border-[#078675]/30 bg-[#078675]/5 p-5 sm:p-6 text-left">
                        <CreditCard className="mt-0.5 size-6 shrink-0 text-[#078675]" />
                        <div className="text-xs sm:text-sm leading-relaxed text-slate-700">
                            <span className="font-bold text-[#173A5E]">Payment Data Processing by Paddle: </span>
                            All payment transactions on InstitutoPropio are processed securely by our Merchant of Record,{' '}
                            <strong className="text-slate-900">Paddle.com Market Ltd</strong>. When you purchase a subscription or initiate a payment, your payment details (such as credit card numbers, billing addresses, and payment tokens) are collected and processed directly by Paddle in compliance with PCI-DSS Level 1 standards. InstitutoPropio never receives, stores, or processes raw credit card details.
                        </div>
                    </div>
                </section>

                {/* Privacy Policy Body */}
                <section className="mx-auto mt-12 w-full max-w-4xl space-y-10 px-6 text-slate-700 sm:px-8">
                    {/* Section 1 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <Database className="size-5 text-[#078675]" />
                            <h2 className="text-lg font-bold text-[#173A5E] sm:text-xl">
                                1. Information We Collect
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            We collect only the information necessary to provide, secure, and improve our multi-tenant educational platform:
                        </p>
                        <ul className="list-disc space-y-2 pl-6 text-xs sm:text-sm text-slate-600">
                            <li>
                                <strong>Account & Profile Information:</strong> When you register as an administrator, teacher, student, or parent, we collect your name, email address, password hash, and optional display preferences.
                            </li>
                            <li>
                                <strong>Institutional & Campus Data:</strong> Organization owners and authorized faculty provide institution names, academic terms, grade levels, sections, subjects, syllabus topics, and weekly timetable schedules.
                            </li>
                            <li>
                                <strong>Academic Records:</strong> Student attendance marks, exam grades, evaluation notes, admission application documents, and course completion milestones submitted by institutions.
                            </li>
                            <li>
                                <strong>Institutional Billing & Fee Records:</strong> Tuition fee structures, generated fee invoices, receipt records, and subscription billing tier selections.
                            </li>
                            <li>
                                <strong>Technical & Usage Information:</strong> IP addresses, browser and device user-agents, authentication timestamps, and session tokens used strictly for account security and fraud prevention.
                            </li>
                        </ul>
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <Eye className="size-5 text-[#078675]" />
                            <h2 className="text-lg font-bold text-[#173A5E] sm:text-xl">
                                2. How We Use Collected Information
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            We use collected data solely for legitimate educational and administrative purposes:
                        </p>
                        <ul className="list-disc space-y-1.5 pl-6 text-xs sm:text-sm text-slate-600">
                            <li>To provision and manage tenant-isolated school workspaces and digital classrooms;</li>
                            <li>To calculate and report daily attendance roll calls, gradebook averages, and curriculum progress;</li>
                            <li>To dispatch transactional platform notifications, invitation links, and verification emails;</li>
                            <li>To process platform subscription entitlements through Paddle webhooks;</li>
                            <li>To maintain system integrity, detect unauthorized access attempts, and enforce tenant isolation.</li>
                        </ul>
                        <p className="text-xs sm:text-sm font-semibold text-[#173A5E]">
                            We do not sell, rent, monetize, or trade student, faculty, or institutional data to third parties or advertisers under any circumstances.
                        </p>
                    </div>

                    {/* Section 3 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <Lock className="size-5 text-[#078675]" />
                            <h2 className="text-lg font-bold text-[#173A5E] sm:text-xl">
                                3. Data Security & Multi-Tenant Access Controls
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            We implement defense-in-depth architectural measures to safeguard educational data:
                        </p>
                        <ul className="list-disc space-y-1.5 pl-6 text-xs sm:text-sm text-slate-600">
                            <li>
                                <strong>Tenant Isolation:</strong> Server-side database query scoping guarantees that data belonging to one school cannot be queried, accessed, or leaked to another organization.
                            </li>
                            <li>
                                <strong>Role-Based Access Control (RBAC):</strong> Granular permissions enforce that students, teachers, parents, and administrators can only access authorized endpoints and records.
                            </li>
                            <li>
                                <strong>Encryption:</strong> All data in transit is protected using modern Transport Layer Security (TLS 1.3 / HTTPS). Passwords are cryptographically hashed using standard Bcrypt / Argon2 algorithms.
                            </li>
                            <li>
                                <strong>Automated Backups:</strong> System and tenant databases are backed up regularly to protect against accidental loss or infrastructure outages.
                            </li>
                        </ul>
                    </div>

                    {/* Section 4 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <CreditCard className="size-5 text-[#078675]" />
                            <h2 className="text-lg font-bold text-[#173A5E] sm:text-xl">
                                4. Third-Party Payment Processing & Paddle Integration
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            InstitutoPropio utilizes Paddle as our Merchant of Record and payment gateway provider. When you make a payment for an InstitutoPropio subscription:
                        </p>
                        <ul className="list-disc space-y-1.5 pl-6 text-xs sm:text-sm text-slate-600">
                            <li>You are redirected to or presented with Paddle&rsquo;s secure checkout overlay;</li>
                            <li>Paddle collects and stores billing details in accordance with its privacy policy, accessible at <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-[#078675] underline">paddle.com/legal/privacy</a>;</li>
                            <li>Paddle transmits server-to-server cryptographically signed webhooks to InstitutoPropio, confirming transaction identifiers, customer IDs, and subscription statuses;</li>
                            <li>We store only the non-sensitive identifiers (Paddle Customer ID, Subscription ID, Transaction Reference) necessary to activate and maintain your institution&rsquo;s subscription tier.</li>
                        </ul>
                    </div>

                    {/* Section 5 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <UserCheck className="size-5 text-[#078675]" />
                            <h2 className="text-lg font-bold text-[#173A5E] sm:text-xl">
                                5. Data Retention & User Rights
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            <strong>5.1 Data Retention:</strong> We retain account and institutional records for as long as your workspace remains active. When a workspace is deleted or terminated, data is securely archived and purged in accordance with institutional policy and legal obligations.
                        </p>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            <strong>5.2 User Rights:</strong> Depending on your jurisdiction (such as GDPR, CCPA, or applicable regional privacy laws), you have rights to:
                        </p>
                        <ul className="list-disc space-y-1 pl-6 text-xs sm:text-sm text-slate-600">
                            <li>Access and request a copy of your personal data;</li>
                            <li>Request correction of inaccurate or incomplete records;</li>
                            <li>Request deletion of your account and personal information;</li>
                            <li>Export student grades, attendance, and fee invoices in standard formats.</li>
                        </ul>
                    </div>

                    {/* Section 6 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <HelpCircle className="size-5 text-[#078675]" />
                            <h2 className="text-lg font-bold text-[#173A5E] sm:text-xl">
                                6. Contacting Us About Privacy
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            If you have questions, concerns, or requests regarding this Privacy Policy or how your educational data is handled, please reach out via our{' '}
                            <Link href="/contact" className="font-semibold text-[#078675] hover:underline">
                                Contact Portal
                            </Link>
                            .
                        </p>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                            <p className="font-medium text-slate-700">Data Controller Information:</p>
                            <p className="mt-1">
                                <strong>InstitutoPropio</strong> acts as the Data Controller for general platform accounts and as a Data Processor on behalf of educational institutions that enter student and staff records into their private tenant workspaces. [Corporate Entity Name: Pending Official Filing].
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}

