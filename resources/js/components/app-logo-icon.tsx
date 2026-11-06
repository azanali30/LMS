import type { HTMLAttributes } from 'react';

export default function AppLogoIcon({ className, ...props }: HTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/images/logo-emblem.png"
            alt="InstitutoPropio"
            className={`inline-block object-contain ${className || 'size-6'}`}
            {...props}
        />
    );
}
