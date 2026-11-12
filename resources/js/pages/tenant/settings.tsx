import { Head, useForm, router } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    Settings,
    ShieldCheck,
    Save,
    Loader2,
    Upload,
    Image,
    Palette,
    DollarSign,
    Clock,
    Building2,
    Check,
} from 'lucide-react';

interface Organization {
    id: number;
    name: string;
    slug: string;
    organization_type: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    timezone?: string;
    currency?: string;
    primary_color?: string | null;
    accent_color?: string | null;
    logo_path?: string | null;
    status: string;
}

interface SettingsProps {
    organization: Organization;
}

const PRESET_COLORS = [
    { label: 'InstitutoPropio Purple', value: '#7c3aed' },
    { label: 'Royal Indigo', value: '#4f46e5' },
    { label: 'Ocean Blue', value: '#2563eb' },
    { label: 'Emerald Green', value: '#059669' },
    { label: 'Amber Gold', value: '#d97706' },
    { label: 'Slate Navy', value: '#1e293b' },
];

export default function OrganizationSettings({ organization }: SettingsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(
        organization.logo_path || null
    );

    useEffect(() => {
        setLogoPreview(organization.logo_path || null);
    }, [organization.logo_path]);

    const { data, setData, processing, errors } = useForm({
        name: organization.name || '',
        organization_type: organization.organization_type || 'school',
        email: organization.email || '',
        phone: organization.phone || '',
        address: organization.address || '',
        timezone: organization.timezone || 'UTC',
        currency: organization.currency || 'USD',
        primary_color: organization.primary_color || '#7c3aed',
        accent_color: organization.accent_color || '#f59e0b',
        logo: null as File | null,
    });

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('logo', file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setLogoPreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            '/organizations/settings',
            {
                _method: 'put',
                ...data,
            },
            {
                forceFormData: true,
                preserveScroll: true,
            }
        );
    };

    return (
        <TenantLayout title="Organization Settings">
            <Head title="Organization Settings" />

            <div className="mx-auto max-w-4xl pb-12">
                <div className="mb-8">
                    <div className="mb-1 flex items-center gap-2">
                        <Settings className="size-5 text-purple-600 dark:text-purple-400" />
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Institutional Profile & Branding
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Manage your school legal identity, official logo, brand colors, localization, and currency.
                    </p>
                </div>

                {/* Tenant Isolation Badge */}
                <div className="mb-6 flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50 p-4 text-xs text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="size-5 shrink-0 text-purple-600 dark:text-purple-400" />
                        <div>
                            <span className="block font-semibold text-slate-900 dark:text-white">
                                Multi-Tenant Isolation Enforced
                            </span>
                            <span>
                                Organization ID: #{organization.id} &bull; Workspace Identifier: {organization.slug}
                            </span>
                        </div>
                    </div>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                        {organization.status}
                    </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8 dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl">
                    <form onSubmit={submit} className="space-y-6">
                        {/* Section 1: Logo & Branding */}
                        <div className="border-b border-slate-100 pb-6 dark:border-slate-800/80">
                            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Palette className="size-4 text-purple-600 dark:text-purple-400" />
                                <span>Logo & Visual Branding</span>
                            </h3>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                {/* Logo Uploader */}
                                <div>
                                    <label className="mb-2 block text-xs font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-300">
                                        Official School Logo
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900">
                                            {logoPreview ? (
                                                <img
                                                    src={logoPreview}
                                                    alt="School Logo"
                                                    className="size-full object-contain rounded-xl"
                                                />
                                            ) : (
                                                <Image className="size-6 text-slate-400" />
                                            )}
                                        </div>
                                        <div>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleLogoChange}
                                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                            >
                                                <Upload className="size-3.5 text-purple-600 dark:text-purple-400" />
                                                <span>Upload New Logo</span>
                                            </button>
                                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                                PNG, JPG, SVG, or WEBP up to 2MB
                                            </p>
                                        </div>
                                    </div>
                                    {errors.logo && (
                                        <p className="mt-1 text-xs text-rose-500">{errors.logo}</p>
                                    )}
                                </div>

                                {/* Brand Color */}
                                <div>
                                    <label className="mb-2 block text-xs font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-300">
                                        Primary Brand Accent Color
                                    </label>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className="size-9 rounded-xl border border-slate-300 shadow-xs dark:border-slate-700"
                                            style={{ backgroundColor: data.primary_color || '#7c3aed' }}
                                        />
                                        <input
                                            type="text"
                                            value={data.primary_color}
                                            onChange={(e) => setData('primary_color', e.target.value)}
                                            placeholder="#7c3aed"
                                            className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 transition outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {PRESET_COLORS.map((preset) => (
                                            <button
                                                key={preset.value}
                                                type="button"
                                                onClick={() => setData('primary_color', preset.value)}
                                                className="group relative size-6 rounded-lg border border-white/20 transition-transform hover:scale-110"
                                                style={{ backgroundColor: preset.value }}
                                                title={preset.label}
                                            >
                                                {data.primary_color?.toLowerCase() === preset.value.toLowerCase() && (
                                                    <Check className="mx-auto size-3 text-white drop-shadow-sm" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    {errors.primary_color && (
                                        <p className="mt-1 text-xs text-rose-500">{errors.primary_color}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Identity & Classification */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-300">
                                    Organization Legal Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-xs text-rose-500">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-300">
                                    Organization Type *
                                </label>
                                <select
                                    value={data.organization_type}
                                    onChange={(e) => setData('organization_type', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    <option value="school">K-12 School</option>
                                    <option value="academy">Academic Academy</option>
                                    <option value="college">College / University</option>
                                    <option value="training_institute">Training Institute</option>
                                    <option value="coaching_center">Coaching / Tutoring Center</option>
                                    <option value="online_course_provider">Online Course Provider</option>
                                    <option value="other">Other Educational Institution</option>
                                </select>
                                {errors.organization_type && (
                                    <p className="mt-1 text-xs text-rose-500">{errors.organization_type}</p>
                                )}
                            </div>
                        </div>

                        {/* Section 3: Contact Details */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-300">
                                    Official Contact Email
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-xs text-rose-500">{errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-300">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-300">
                                Campus Address
                            </label>
                            <input
                                type="text"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                            />
                        </div>

                        {/* Section 4: Localization & Currency */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-300">
                                    Operational Timezone
                                </label>
                                <select
                                    value={data.timezone}
                                    onChange={(e) => setData('timezone', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                                    <option value="America/New_York">Eastern Time (US & Canada)</option>
                                    <option value="America/Chicago">Central Time (US & Canada)</option>
                                    <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                                    <option value="Europe/London">London (GMT/BST)</option>
                                    <option value="Asia/Karachi">Karachi, Islamabad (PKT)</option>
                                    <option value="Asia/Dubai">Dubai (GST)</option>
                                    <option value="Asia/Singapore">Singapore (SGT)</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-300">
                                    Billing & Fee Currency
                                </label>
                                <select
                                    value={data.currency}
                                    onChange={(e) => setData('currency', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    <option value="USD">USD ($) — US Dollar</option>
                                    <option value="EUR">EUR (€) — Euro</option>
                                    <option value="GBP">GBP (£) — British Pound</option>
                                    <option value="CAD">CAD ($) — Canadian Dollar</option>
                                    <option value="AUD">AUD ($) — Australian Dollar</option>
                                    <option value="PKR">PKR (Rs) — Pakistani Rupee</option>
                                    <option value="AED">AED (AED) — UAE Dirham</option>
                                    <option value="SGD">SGD ($) — Singapore Dollar</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500 disabled:opacity-60"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>Saving Settings...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="size-4" />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </TenantLayout>
    );
}
