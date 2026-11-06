import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import Navbar from '@/components/lms/navbar';
import Footer from '@/components/lms/footer';
import type { Auth } from '@/types';

interface PublicLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function PublicLayout({ children, title }: PublicLayoutProps) {
    const { auth } = usePage<{ auth?: Auth }>().props;
    const user = auth?.user ?? null;

    // Enforce consistent light theme across all public marketing pages
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
        }
    }, []);

    return (
        <div className="flex min-h-screen flex-col bg-white font-sans text-[#172B3D] selection:bg-[#078675] selection:text-white">
            {title && <Head title={title} />}
            <Navbar user={user} />
            <main className="flex-1 bg-white">{children}</main>
            <Footer />
        </div>
    );
}
