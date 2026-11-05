import { Head, useForm, router } from '@inertiajs/react';
import React, { useState } from 'react';
import PlatformAdminLayout from '@/layouts/platform-admin/platform-admin-layout';
import {
    Layers,
    Plus,
    Check,
    Edit2,
    CheckCircle2,
    X,
    Building2,
    DollarSign,
    ShieldCheck,
} from 'lucide-react';

interface PlanItem {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price_cents: number;
    price_annual_cents: number;
    price_monthly_formatted: string;
    price_annual_formatted: string;
    currency: string;
    billing_interval: string;
    max_organizations: number | null;
    features: string[];
    is_active: boolean;
    active_subscribers_count: number;
}

interface Props {
    plans: PlanItem[];
}

export default function PlatformPlansIndex({ plans = [] }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
        slug: '',
        description: '',
        price_cents: 1900,
        price_annual_cents: 19000,
        max_organizations: 1,
        features: ['1 Isolated institution workspace', 'Unlimited students & teachers'],
        is_active: true,
    });

    const [featureInput, setFeatureInput] = useState('');

    const openCreateModal = () => {
        setEditingPlan(null);
        reset();
        setShowModal(true);
    };

    const openEditModal = (plan: PlanItem) => {
        setEditingPlan(plan);
        setData({
            name: plan.name,
            slug: plan.slug,
            description: plan.description || '',
            price_cents: plan.price_cents,
            price_annual_cents: plan.price_annual_cents,
            max_organizations: plan.max_organizations ?? 1,
            features: plan.features || [],
            is_active: plan.is_active,
        });
        setShowModal(true);
    };

    const handleAddFeature = () => {
        if (!featureInput.trim()) return;
        setData('features', [...data.features, featureInput.trim()]);
        setFeatureInput('');
    };

    const handleRemoveFeature = (index: number) => {
        setData('features', data.features.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPlan) {
            put(`/platform-admin/plans/${editingPlan.id}`, {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        } else {
            post('/platform-admin/plans', {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    const togglePlan = (id: number) => {
        router.post(`/platform-admin/plans/${id}/toggle`);
    };

    return (
        <PlatformAdminLayout title="SaaS Pricing Plans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">SaaS Subscription Tiers</h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Configure institutional licensing limits (Bronze: 1, Silver: 1-5, Gold: 1-10, Premium: Unlimited)
                    </p>
                </div>

                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1769E0] hover:bg-[#1256B8] text-white text-xs font-bold shadow-md transition"
                >
                    <Plus className="size-4" />
                    <span>Create New Plan</span>
                </button>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {plans.map((plan) => {
                    const orgLimitLabel =
                        plan.max_organizations === null || plan.max_organizations <= 0
                            ? 'Unlimited Institutions'
                            : plan.max_organizations === 1
                            ? '1 Single Institution'
                            : `Up to ${plan.max_organizations} Institutions`;

                    return (
                        <div
                            key={plan.id}
                            className={`rounded-3xl bg-white border p-6 flex flex-col justify-between shadow-xs transition hover:shadow-md ${
                                plan.is_active ? 'border-slate-200/80' : 'border-rose-200 bg-rose-50/20 opacity-80'
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Slug: {plan.slug}
                                    </span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            plan.is_active
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                        }`}
                                    >
                                        {plan.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <h3 className="text-lg font-extrabold text-slate-900">{plan.name}</h3>
                                <p className="text-xs text-slate-500 mt-1 min-h-[32px] leading-relaxed">
                                    {plan.description || 'Enterprise educational management plan.'}
                                </p>

                                {/* Pricing Display */}
                                <div className="my-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                                    <div className="text-2xl font-black text-slate-900">
                                        {plan.price_monthly_formatted}
                                        <span className="text-xs text-slate-500 font-semibold"> /month</span>
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">
                                        or {plan.price_annual_formatted} billed annually
                                    </div>
                                </div>

                                {/* Organization Entitlement Badge */}
                                <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-[#1769E0] border border-blue-200/60 text-xs font-bold w-full justify-center">
                                    <Building2 className="size-3.5" />
                                    <span>{orgLimitLabel}</span>
                                </div>

                                {/* Features List */}
                                <div className="space-y-2 mb-6">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                        Included Features:
                                    </span>
                                    {plan.features?.slice(0, 5).map((feat, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                                            <Check className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                    {plan.features?.length > 5 && (
                                        <div className="text-[11px] text-slate-400 pl-5">
                                            +{plan.features.length - 5} more features
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Plan Card Actions */}
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-600">
                                    {plan.active_subscribers_count} subscribers
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => openEditModal(plan)}
                                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                        title="Edit Plan"
                                    >
                                        <Edit2 className="size-3.5" />
                                    </button>
                                    <button
                                        onClick={() => togglePlan(plan.id)}
                                        className={`px-2 py-1 rounded-lg font-bold text-[11px] transition ${
                                            plan.is_active
                                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                        }`}
                                    >
                                        {plan.is_active ? 'Disable' : 'Enable'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                            <h3 className="text-base font-extrabold text-slate-900">
                                {editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create New Subscription Plan'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Plan Display Name</label>
                                <input
                                    type="text"
                                    required
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Gold Campus Group"
                                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            {!editingPlan && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Unique Plan Slug</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value.toLowerCase())}
                                        placeholder="e.g. gold"
                                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                                    />
                                    {errors.slug && <p className="text-xs text-rose-500 mt-1">{errors.slug}</p>}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={2}
                                    placeholder="Summary of target institutions..."
                                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Price ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={(data.price_cents / 100).toFixed(2)}
                                        onChange={(e) => setData('price_cents', Math.round(parseFloat(e.target.value || '0') * 100))}
                                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Annual Price ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={(data.price_annual_cents / 100).toFixed(2)}
                                        onChange={(e) => setData('price_annual_cents', Math.round(parseFloat(e.target.value || '0') * 100))}
                                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Organization Entitlement Limit (Enter 0 or leave empty for Unlimited)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.max_organizations}
                                    onChange={(e) => setData('max_organizations', parseInt(e.target.value || '0', 10))}
                                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Features Editor */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Feature Bullet Points</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={featureInput}
                                        onChange={(e) => setFeatureInput(e.target.value)}
                                        placeholder="Add a feature item..."
                                        className="flex-1 p-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddFeature}
                                        className="px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="space-y-1 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                                    {data.features.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between p-1 text-xs text-slate-700">
                                            <span>• {f}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFeature(i)}
                                                className="text-rose-500 hover:text-rose-700 text-xs px-1 font-bold"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2.5 rounded-xl bg-[#1769E0] text-white text-xs font-bold hover:bg-[#1256B8] transition disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : 'Save Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PlatformAdminLayout>
    );
}
