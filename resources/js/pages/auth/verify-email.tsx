// Components
import { Form, Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <>
            <Head title="Email verification" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    A new verification link has been sent to the email address
                    you provided during registration.
                </div>
            )}

            <div className="space-y-4">
                <Button
                    asChild
                    className="h-10 w-full cursor-pointer rounded-xl bg-violet-600 font-semibold text-white shadow-md shadow-violet-500/20 hover:bg-violet-700"
                >
                    <a href="/email/verify-instant">
                        Instant Verify & Enter Dashboard &rarr;
                    </a>
                </Button>

                <Form {...send.form()} className="space-y-4 text-center">
                    {({ processing }) => (
                        <>
                            <Button
                                disabled={processing}
                                variant="secondary"
                                className="w-full text-xs"
                            >
                                {processing && <Spinner />}
                                Resend verification email
                            </Button>

                            <TextLink
                                href={logout()}
                                className="mx-auto block text-xs text-slate-400 hover:text-white"
                            >
                                Log out
                            </TextLink>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Email verification',
    description:
        'Please verify your email address by clicking on the link we just emailed to you.',
};
