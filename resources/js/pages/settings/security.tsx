import { Form, Head } from '@inertiajs/react';
import { useRef } from 'react';
import { Lock, Save, Loader2, CheckCircle2 } from 'lucide-react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { edit } from '@/routes/security';
import type { Props as ManagePasskeysProps } from '@/components/manage-passkeys';
import ManagePasskeys from '@/components/manage-passkeys';
import type { Props as ManageTwoFactorProps } from '@/components/manage-two-factor';
import ManageTwoFactor from '@/components/manage-two-factor';

type Props = {
    passwordRules: string;
} & ManagePasskeysProps &
    ManageTwoFactorProps;

export default function Security(props: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <>
            <Head title="Security Settings" />

            <div className="space-y-8">
                {/* Password Update Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8 dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl">
                    <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5 dark:border-slate-800/80">
                        <div className="flex size-10 items-center justify-center rounded-xl border border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400">
                            <Lock className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Update Account Password
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Ensure your account is protected with a long, unique password to prevent unauthorized access
                            </p>
                        </div>
                    </div>

                    <Form
                        {...SecurityController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        resetOnError={[
                            'password',
                            'password_confirmation',
                            'current_password',
                        ]}
                        resetOnSuccess
                        onError={(errors) => {
                            if (errors.password) {
                                passwordInput.current?.focus();
                            }

                            if (errors.current_password) {
                                currentPasswordInput.current?.focus();
                            }
                        }}
                        className="space-y-6"
                    >
                        {({ errors, processing, recentlySuccessful }) => (
                            <>
                                <div>
                                    <label
                                        htmlFor="current_password"
                                        className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-300"
                                    >
                                        Current Password *
                                    </label>

                                    <PasswordInput
                                        id="current_password"
                                        ref={currentPasswordInput}
                                        name="current_password"
                                        autoComplete="current-password"
                                        placeholder="Enter your current password"
                                    />

                                    <InputError
                                        message={errors.current_password}
                                        className="mt-1.5 text-xs text-rose-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="password"
                                            className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-300"
                                        >
                                            New Password *
                                        </label>

                                        <PasswordInput
                                            id="password"
                                            ref={passwordInput}
                                            name="password"
                                            autoComplete="new-password"
                                            placeholder="Enter strong new password"
                                            passwordrules={props.passwordRules}
                                        />

                                        <InputError
                                            message={errors.password}
                                            className="mt-1.5 text-xs text-rose-500"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="password_confirmation"
                                            className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-300"
                                        >
                                            Confirm New Password *
                                        </label>

                                        <PasswordInput
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            autoComplete="new-password"
                                            placeholder="Re-type new password"
                                            passwordrules={props.passwordRules}
                                        />

                                        <InputError
                                            message={errors.password_confirmation}
                                            className="mt-1.5 text-xs text-rose-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-2">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        data-test="update-password-button"
                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                <span>Updating password...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="size-4" />
                                                <span>Save Password</span>
                                            </>
                                        )}
                                    </button>

                                    {recentlySuccessful && (
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 animate-in fade-in">
                                            <CheckCircle2 className="size-3.5" />
                                            <span>Password updated successfully</span>
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                {/* Two-Factor Authentication Card */}
                <ManageTwoFactor
                    canManageTwoFactor={props.canManageTwoFactor}
                    requiresConfirmation={props.requiresConfirmation}
                    twoFactorEnabled={props.twoFactorEnabled}
                />

                {/* Passkeys Card */}
                <ManagePasskeys
                    canManagePasskeys={props.canManagePasskeys}
                    passkeys={props.passkeys}
                />
            </div>
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Security settings',
            href: edit(),
        },
    ],
};
