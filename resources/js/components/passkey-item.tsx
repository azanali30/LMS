import { KeyRound, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import type { Passkey } from '@/types/auth';

type Props = {
    passkey: Passkey;
    onDelete: (id: number, onError: () => void) => void;
};

export default function PasskeyItem({ passkey, onDelete }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        onDelete(passkey.id, () => setIsDeleting(false));
    };

    return (
        <div className="flex items-center justify-between border-b border-slate-800/80 p-4 transition-colors hover:bg-slate-900/40 last:border-b-0">
            <div className="flex items-center gap-3.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10">
                    <KeyRound className="size-5 text-purple-400" />
                </div>
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">
                            {passkey.name}
                        </p>
                        {passkey.authenticator && (
                            <span className="inline-flex items-center rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-slate-300 uppercase">
                                {passkey.authenticator}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-400">
                        Added {passkey.created_at_diff}
                        {passkey.last_used_at_diff && (
                            <>
                                <span className="mx-1.5 text-slate-600">&bull;</span>
                                Last used {passkey.last_used_at_diff}
                            </>
                        )}
                    </p>
                </div>
            </div>

            <Dialog>
                <DialogTrigger asChild>
                    <button
                        type="button"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400"
                        title="Remove passkey"
                    >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Remove</span>
                    </button>
                </DialogTrigger>
                <DialogContent className="border border-slate-800 bg-[#0B1220] text-slate-100 sm:max-w-md">
                    <DialogTitle className="text-base font-bold text-white">
                        Remove Passkey
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-400">
                        Are you sure you want to remove the "{passkey.name}" passkey? You will no longer be able to use it for biometric sign-in.
                    </DialogDescription>
                    <DialogFooter className="gap-2 sm:gap-2">
                        <DialogClose asChild>
                            <button
                                type="button"
                                className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                            >
                                Cancel
                            </button>
                        </DialogClose>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/30 transition hover:bg-rose-500 disabled:opacity-50"
                        >
                            {isDeleting ? 'Removing...' : 'Remove Passkey'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
