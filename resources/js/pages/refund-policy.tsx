import { Link } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import {
    RotateCcw,
    CreditCard,
    ShieldAlert,
    CheckCircle2,
    Calendar,
    HelpCircle,
    FileText,
} from 'lucide-react';

export default function RefundPolicyPage() {
    return (
        <PublicLayout title="Refund Policy — InstitutoPropio">
            <div className="border-b border-slate-100 bg-white py-14 sm:py-20">
                {/* Header */}
                <section className="mx-auto w-full max-w-[1720px] px-6 text-center sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="mx-auto max-w-3xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#078675]/20 bg-[#078675]/10 px-3.5 py-1 text-xs font-semibold text-[#078675]">
                            <RotateCcw className="size-3.5" />
                            <span>Billing Transparency & Cancellations</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-[#173A5E] sm:text-4xl lg:text-5xl">
                            Refund Policy
                        </h1>
                        <p className="mt-3 text-xs text-slate-500 sm:text-sm">
                            Last Updated: November 2026 &bull; Clear guidelines for SaaS subscription cancellations and refund inquiries
                        </p>
                    </div>
                </section>

                {/* Paddle Merchant of Record Callout */}
                <section className="mx-auto mt-10 w-full max-w-4xl px-6 sm:px-8">
                    <div className="flex items-start gap-4 rounded-2xl border border-[#078675]/30 bg-[#078675]/5 p-5 sm:p-6 text-left">
                        <CreditCard className="mt-0.5 size-6 shrink-0 text-[#078675]" />
                        <div className="text-xs sm:text-sm leading-relaxed text-slate-700">
                            <span className="font-bold text-[#173A5E]">Merchant of Record & Refund Handling: </span>
                            All InstitutoPropio subscription orders and digital transactions are processed by our online reseller and Merchant of Record,{' '}
                            <strong className="text-slate-900">Paddle.com Market Ltd</strong>. As the Merchant of Record, Paddle is responsible for billing inquiries, order disputes, and processing refunds in cooperation with InstitutoPropio.
                        </div>
                    </div>
                </section>

                {/* Refund Policy Body */}
                <section className="mx-auto mt-12 w-full max-w-4xl space-y-10 px-6 text-slate-700 sm:px-8">
                    {/* Section 1 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <Calendar className="size-5 text-[#078675]" />
                            <h2 className="text-lg font-bold text-[#173A5E] sm:text-xl">
                                1. Subscription Cancellation
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            You may cancel your InstitutoPropio subscription at any time directly through the Organization Billing portal or by contacting our support team:
                        </p>
                        <ul className="list-disc space-y-1.5 pl-6 text-xs sm:text-sm text-slate-600">
                            <li>
                                <strong>No Cancellation Penalties:</strong> There are no cancellation fees, hidden termination charges, or lock-in penalties.
                            </li>
                            <li>
                                <strong>Active Access Until Period Ends:</strong> When you cancel a recurring monthly or annual subscription, your workspace remains fully active with all plan features until the end of the current pre-paid billing cycle.
                            </li>
                            <li>
                                <strong>No Automatic Renewal Post-Cancellation:</strong> Once a cancellation request is logged, your payment method will not be charged again for subsequent billing periods.
                            </li>
                        </ul>
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <RotateCcw className="size-5 text-[#078675]" />
                            <h2 className="text-lg font-bold text-[#173A5E] sm:text-xl">
                                2. Refund Eligibility & Request Procedures
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            Because InstitutoPropio provides immediate digital access to software infrastructure and cloud workspaces upon payment, refunds are evaluated on a case-by-case basis in accordance with Paddle&rsquo;s standard buyer terms and regional consumer protection statutes:
                        </p>
                        <ul className="list-disc space-y-2 pl-6 text-xs sm:text-sm text-slate-600">
                            <li>
                                <strong>Billing Errors or Duplicate Charges:</strong> If an administrative error or technical defect results in duplicate billing or an incorrect charge, a full refund for the duplicated amount will be processed upon verification.
                            </li>
                            <li>
                                <strong>Technical Non-Performance:</strong> If a persistent, critical technical issue attributable to InstitutoPropio completely prevents your institution from using the core platform and our engineering team cannot resolve the defect within a reasonable window, you may be eligible for a pro-rated refund for the impacted service duration.
                            </li>
                            <li>
                                <strong>Statutory Consumer Rights:</strong> Customers residing in the European Union, United Kingdom, and other jurisdictions with statutory withdrawal or cooling-off periods are entitled to their statutory consumer rights as administered by Paddle.
                            </li>
                            <li>
                                <strong>Non-Refundable Circumstances:</strong> Refunds are generally not granted for change-of-mind after substantial platform usage, failure to cancel prior to an automated renewal date when reminders were sent, or account terminations arising from material violations of our Acceptable Use Policy.
                            </li>
                        </ul>
                    </div>

                    {/* Section 3 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <CreditCard className="size-5 text-[#078675]" />
                            <h2 className="text-lg font-bold text-[#173A5E] sm:text-xl">
                                3. How to Submit a Refund Request
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            To ensure swift processing of your request, please provide:
                        </p>
                        <ol className="list-decimal space-y-1.5 pl-6 text-xs sm:text-sm text-slate-600">
                            <li>The registered email address associated with your organization owner account;</li>
                            <li>Your Paddle order or transaction number (found on your payment receipt email);</li>
                            <li>Your organization name and campus tenant slug;</li>
                            <li>A brief description of the reason for the refund request.</li>
                        </ol>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            You may submit your refund request directly to Paddle via{' '}
                            <a
                                href="https://paddle.net"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-[#078675] hover:underline"
                            >
                                paddle.net
                            </a>
                            {' '}or contact our team via the{' '}
                            <Link href="/contact" className="font-semibold text-[#078675] hover:underline">
                                InstitutoPropio Contact Portal
                            </Link>
                            . We will coordinate with Paddle to process approved refunds back to your original payment method.
                        </p>
                    </div>

                    {/* Section 4 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <HelpCircle className="size-5 text-[#078675]" />
                            <h2 className="text-lg font-bold text-[#173A5E] sm:text-xl">
                                4. Processing Timeframes
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                            Once an authorized refund has been approved by Paddle, funds are remitted back to the original payment instrument. Processing times depend on your financial institution or card issuer, typically appearing on your statement within 5 to 10 business days.
                        </p>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                            <p className="font-medium text-slate-700">Notice on Verified Timelines:</p>
                            <p className="mt-1">
                                Exact refund receipt timeframes are determined by the customer&rsquo;s acquiring bank and card network rules. Neither InstitutoPropio nor Paddle can expedite banking clearing schedules once a refund authorization has been dispatched.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}

