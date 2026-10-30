import { Form } from '@inertiajs/react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <div className="rounded-2xl border border-rose-900/30 bg-[#0B1220] p-6 shadow-xl sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-rose-900/20 pb-5">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
                        <AlertTriangle className="size-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">
                            Danger Zone: Delete Account
                        </h3>
                        <p className="text-xs text-slate-400">
                            Permanently delete your personal profile and all associated learning records
                        </p>
                    </div>
                </div>

                <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-rose-400 uppercase">
                    Irreversible Action
                </span>
            </div>

            <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300">
                <p className="font-semibold text-rose-200">Warning: Please proceed with caution</p>
                <p className="mt-1 text-slate-300">
                    Deleting your account is permanent. All course progress, certificates, student enrollments, exam records, and institutional roles will be completely wiped from the database.
                </p>
            </div>

            <Dialog>
                <DialogTrigger asChild>
                    <button
                        type="button"
                        data-test="delete-user-button"
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-600/15 px-4 py-2.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-600 hover:text-white"
                    >
                        <Trash2 className="size-4" />
                        <span>Delete Account</span>
                    </button>
                </DialogTrigger>

                <DialogContent className="border border-slate-800 bg-[#0B1220] text-slate-100 sm:max-w-md">
                    <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-white">
                        <AlertTriangle className="size-5 text-rose-400" />
                        <span>Are you sure you want to delete your account?</span>
                    </DialogTitle>

                    <DialogDescription className="text-xs text-slate-400">
                        Once your account is deleted, all of its resources, courses, and data will be permanently removed. Please enter your password to confirm.
                    </DialogDescription>

                    <Form
                        {...ProfileController.destroy.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        onError={() => passwordInput.current?.focus()}
                        resetOnSuccess
                        className="mt-4 space-y-4"
                    >
                        {({ resetAndClearErrors, processing, errors }) => (
                            <>
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="password"
                                        className="block text-xs font-semibold tracking-wider text-slate-300 uppercase"
                                    >
                                        Account Password *
                                    </label>

                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        ref={passwordInput}
                                        placeholder="Confirm your password"
                                        autoComplete="current-password"
                                        className="w-full"
                                    />

                                    <InputError message={errors.password} className="mt-1 text-xs text-rose-400" />
                                </div>

                                <DialogFooter className="gap-2 sm:gap-2">
                                    <DialogClose asChild>
                                        <button
                                            type="button"
                                            onClick={() => resetAndClearErrors()}
                                            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                                        >
                                            Cancel
                                        </button>
                                    </DialogClose>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        data-test="confirm-delete-user-button"
                                        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/30 transition hover:bg-rose-500 disabled:opacity-50"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="size-3.5 animate-spin" />
                                                <span>Deleting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="size-3.5" />
                                                <span>Confirm Deletion</span>
                                            </>
                                        )}
                                    </button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
