export type Organization = {
    id: number;
    name: string;
    slug: string;
    organization_type?: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    logo_path?: string | null;
    primary_color?: string | null;
    accent_color?: string | null;
    timezone?: string;
    status?: 'active' | 'suspended' | 'trial';
    subdomain_url?: string;
    pivot?: {
        role?: 'owner' | 'admin' | 'teacher' | 'student' | 'parent' | string;
        title?: string;
        status?: string;
    };
};

export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    role?: 'student' | 'teacher' | 'admin' | 'super_admin';
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
    currentOrganization?: Organization | null;
    userOrganizations?: Organization[];
    organizationRole?:
        | 'owner'
        | 'admin'
        | 'teacher'
        | 'student'
        | 'parent'
        | 'super_admin'
        | null;
    isSuperAdmin?: boolean;
};

export type Flash = {
    success?: string | null;
    error?: string | null;
};

export type InAppNotification = {
    id: string;
    type: string;
    data: {
        type?: string;
        reminder_type?: string;
        recipient_role?: string;
        fee_invoice_id?: number;
        invoice_number?: string;
        student_id?: number;
        student_name?: string;
        billing_month?: string;
        due_date?: string;
        total_amount?: number;
        paid_amount?: number;
        balance_due?: number;
        currency?: string;
        title?: string;
        message?: string;
        url?: string;
        [key: string]: unknown;
    };
    read_at: string | null;
    created_at: string;
};

export type NotificationProps = {
    unreadCount: number;
    recent: InAppNotification[];
};

export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
