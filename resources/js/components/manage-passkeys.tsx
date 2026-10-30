import { router } from '@inertiajs/react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { destroy } from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController';
import PasskeyItem from '@/components/passkey-item';
import PasskeyRegistration from '@/components/passkey-register';
import type { Passkey } from '@/types/auth';

export type Props = {
    canManagePasskeys?: boolean;
    passkeys?: Passkey[];
};

const EmptyState = () => {
    return (
        <div className="p-8 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
                <KeyRound className="size-6 text-purple-400" />
            </div>
            <p className="text-sm font-semibold text-white">No passkeys configured</p>
            <p className="mt-1 text-xs text-slate-400">
                Register a passkey on your device for instant, passwordless biometric sign-in
            </p>
        </div>
    );
};

export default function ManagePasskeys(props: Props) {
    const passkeys = props.passkeys ?? [];

    const handleDelete = (id: number, onError: () => void) => {
        router.delete(destroy.url(id), {
            preserveScroll: true,
            onError,
        });
    };

    const handleRegisterSuccess = () => {
        router.reload();
    };

    if (!(props.canManagePasskeys ?? false)) {
        return null;
    }

    return (
        <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-6 shadow-xl sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
                        <KeyRound className="size-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">
                            Passkeys & Passwordless Sign-In
                        </h3>
                        <p className="text-xs text-slate-400">
                            Authenticate securely with Touch ID, Face ID, Windows Hello, or hardware security keys
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold text-purple-300">
                    <ShieldCheck className="size-3.5 text-purple-400" />
                    <span>FIDO2 / WebAuthn</span>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/40">
                {passkeys.length > 0 ? (
                    passkeys.map((passkey) => (
                        <PasskeyItem
                            key={passkey.id}
                            passkey={passkey}
                            onDelete={handleDelete}
                        />
                    ))
                ) : (
                    <EmptyState />
                )}
            </div>

            <div className="mt-6">
                <PasskeyRegistration onSuccess={handleRegisterSuccess} />
            </div>
        </div>
    );
}
