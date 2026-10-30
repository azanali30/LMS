import { usePasskeyRegister } from '@laravel/passkeys/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    onSuccess: () => void;
};

export default function PasskeyRegistration({ onSuccess }: Props) {
    const [name, setName] = useState(() => {
        const ua = navigator.userAgent;

        const browser = [
            { pattern: /Edg|Edge/, name: 'Edge' },
            { pattern: /OPR|Opera|OPiOS/, name: 'Opera' },
            { pattern: /Firefox|FxiOS/, name: 'Firefox' },
            { pattern: /Chrome|CriOS/, name: 'Chrome' },
            { pattern: /Safari/, name: 'Safari' },
        ].find(({ pattern }) => pattern.test(ua))?.name;

        const os = [
            { pattern: /iPhone/, name: 'iPhone' },
            { pattern: /iPad|Macintosh(?=.*Mobile)/, name: 'iPad' },
            { pattern: /Android/, name: 'Android' },
            { pattern: /Mac/, name: 'Mac' },
            { pattern: /Windows/, name: 'Windows' },
        ].find(({ pattern }) => pattern.test(ua))?.name;

        return [browser, os].filter(Boolean).join(' on ') || '';
    });

    const [showForm, setShowForm] = useState(false);
    const { register, isLoading, error, isSupported } = usePasskeyRegister({
        onSuccess: () => {
            setName('');
            setShowForm(false);
            onSuccess();
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            return;
        }

        await register(name);
    };

    const handleCancel = () => {
        setShowForm(false);
        setName('');
    };

    if (!isSupported) {
        return (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-400">
                Passkeys are not supported by this browser environment.
            </div>
        );
    }

    if (!showForm) {
        return (
            <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-600/10 px-4 py-2.5 text-xs font-semibold text-purple-300 transition hover:bg-purple-600/20"
            >
                <span>+ Register New Passkey</span>
            </button>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5"
        >
            <div className="space-y-1.5">
                <label
                    htmlFor="passkey-name"
                    className="block text-xs font-semibold tracking-wider text-slate-300 uppercase"
                >
                    Passkey Device Name
                </label>
                <input
                    id="passkey-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., MacBook Pro TouchID, iPhone FaceID"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    autoFocus
                />
                <p className="text-[11px] text-slate-400">
                    Give this passkey a recognizable name so you can identify it later.
                </p>
            </div>

            {error && <InputError message={error} className="text-xs text-rose-400" />}

            <div className="flex items-center gap-2 pt-1">
                <button
                    type="submit"
                    disabled={isLoading || !name.trim()}
                    className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/30 transition hover:bg-purple-500 disabled:opacity-50"
                >
                    {isLoading ? 'Verifying with authenticator...' : 'Register Passkey'}
                </button>
                <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
