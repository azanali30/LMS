import { Form, Head, usePage, Link } from '@inertiajs/react';
import { User, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';
import { send } from '@/routes/verification';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const currentOrg = auth.currentOrganization;

    return (
        <>
            <Head title="Profile Settings" />

            <div className="space-y-8">
                {/* Profile Information Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8 dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800/80">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl border border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400">
                                <User className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Profile Information
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Update your account display name and registered email address
                                </p>
                            </div>
                        </div>

                        {/* User Identity Pill */}
                        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                            <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-xs font-bold text-white shadow-sm ring-1 ring-purple-500/30">
                                {auth.user?.name ? auth.user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="font-semibold text-slate-900 dark:text-white">{auth.user?.name}</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {currentOrg?.name ? `${currentOrg.name} (${auth.organizationRole || 'member'})` : auth.user?.email}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, errors, recentlySuccessful }) => (
                            <>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="name"
                                            className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-300"
                                        >
                                            Full Name *
                                        </label>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            defaultValue={auth.user.name}
                                            required
                                            autoComplete="name"
                                            placeholder="Full name"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                                        />
                                        <InputError
                                            className="mt-1.5 text-xs text-rose-500"
                                            message={errors.name}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-300"
                                        >
                                            Email Address *
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            defaultValue={auth.user.email}
                                            required
                                            autoComplete="username"
                                            placeholder="Email address"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                                        />
                                        <InputError
                                            className="mt-1.5 text-xs text-rose-500"
                                            message={errors.email}
                                        />
                                    </div>
                                </div>

                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500 dark:text-amber-400" />
                                                <div className="space-y-1">
                                                    <p className="font-semibold text-slate-900 dark:text-white">
                                                        Your email address is unverified
                                                    </p>
                                                    <p className="text-slate-600 dark:text-slate-300">
                                                        Please confirm your email address to ensure full access to institution services and grade notifications.{' '}
                                                        <Link
                                                            href={send()}
                                                            as="button"
                                                            className="font-semibold text-amber-400 underline underline-offset-2 transition hover:text-amber-300"
                                                        >
                                                            Click here to re-send verification email.
                                                        </Link>
                                                    </p>
                                                    {status === 'verification-link-sent' && (
                                                        <p className="mt-2 text-xs font-medium text-emerald-400">
                                                            A new verification link has been sent to your email address.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                <div className="flex items-center gap-4 pt-2">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        data-test="update-profile-button"
                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                <span>Saving changes...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="size-4" />
                                                <span>Save Changes</span>
                                            </>
                                        )}
                                    </button>

                                    {recentlySuccessful && (
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 animate-in fade-in">
                                            <CheckCircle2 className="size-3.5" />
                                            <span>Profile saved successfully</span>
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                {/* Danger Zone: Delete Account */}
                <DeleteUser />
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
