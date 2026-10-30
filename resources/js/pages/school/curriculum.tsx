import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    BookOpen,
    Plus,
    Pencil,
    Trash2,
    X,
    CheckCircle2,
    Clock,
    ChevronLeft,
    CheckCircle,
    Circle,
    Layers,
    FileText,
    Sparkles,
    Share2,
    Loader2,
    AlertCircle,
} from 'lucide-react';

interface TopicProgress {
    id: number;
    status: string; // in_progress, completed
    notes?: string;
    completed_at?: string;
    class_section_id: number;
    teacher?: {
        name: string;
    };
}

interface TopicItem {
    id: number;
    title: string;
    learning_objectives?: string;
    content_summary?: string;
    order: number;
    status: string; // draft, published
    progress?: TopicProgress[];
}

interface UnitItem {
    id: number;
    title: string;
    description?: string;
    order: number;
    estimated_periods?: number;
    topics: TopicItem[];
}

interface CurriculumItem {
    id: number;
    title: string;
    description?: string;
    status: string; // draft, published, archived
    units: UnitItem[];
}

interface CurriculumProps {
    subject: {
        id: number;
        name: string;
        code?: string;
        type?: string;
        school_class?: {
            id: number;
            name: string;
        };
    };
    curriculum: CurriculumItem | null;
    canManage: boolean;
    isTeacher: boolean;
    isStudent: boolean;
    sections?: Array<{
        id: number;
        name: string;
        school_class?: {
            name: string;
        };
    }>;
    studentEnrollment?: {
        class_section_id: number;
        class_section: {
            name: string;
            school_class: {
                name: string;
            };
        };
    } | null;
}

export default function CurriculumPage({
    subject,
    curriculum,
    canManage,
    isTeacher,
    isStudent,
    sections = [],
    studentEnrollment,
}: CurriculumProps) {
    // Modals
    const [showEditCurriculum, setShowEditCurriculum] = useState(false);
    const [showCreateUnit, setShowCreateUnit] = useState(false);
    const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null);
    const [unitForNewTopic, setUnitForNewTopic] = useState<UnitItem | null>(null);
    const [editingTopic, setEditingTopic] = useState<TopicItem | null>(null);
    const [progressModalTopic, setProgressModalTopic] = useState<TopicItem | null>(null);

    // Curriculum metadata form
    const curriculumForm = useForm({
        title: curriculum?.title || `${subject.name} Curriculum`,
        description: curriculum?.description || '',
        status: curriculum?.status || 'draft',
    });

    // Unit form
    const unitForm = useForm({
        title: '',
        description: '',
        estimated_periods: 6,
        order: (curriculum?.units.length || 0) + 1,
    });

    const editUnitForm = useForm({
        title: '',
        description: '',
        estimated_periods: 6,
        order: 1,
    });

    const deleteUnitForm = useForm({});

    // Topic form
    const topicForm = useForm({
        title: '',
        learning_objectives: '',
        content_summary: '',
        order: 1,
        status: 'published',
    });

    const editTopicForm = useForm({
        title: '',
        learning_objectives: '',
        content_summary: '',
        order: 1,
        status: 'published',
    });

    const deleteTopicForm = useForm({});

    // Teacher progress form
    const progressForm = useForm({
        class_section_id: studentEnrollment?.class_section_id || sections[0]?.id || 0,
        status: 'completed',
        notes: '',
    });

    // Actions
    const submitUpdateCurriculum = (e: React.FormEvent) => {
        e.preventDefault();
        if (curriculum) {
            curriculumForm.put(`/school/curriculums/${curriculum.id}`, {
                onSuccess: () => setShowEditCurriculum(false),
            });
        } else {
            curriculumForm.post(`/school/subjects/${subject.id}/curriculum`, {
                onSuccess: () => setShowEditCurriculum(false),
            });
        }
    };

    const togglePublishStatus = () => {
        if (!curriculum) return;
        const newStatus = curriculum.status === 'published' ? 'draft' : 'published';
        curriculumForm.setData('status', newStatus);
        curriculumForm.put(`/school/curriculums/${curriculum.id}`);
    };

    const submitCreateUnit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!curriculum) return;
        unitForm.post(`/school/curriculums/${curriculum.id}/units`, {
            onSuccess: () => {
                setShowCreateUnit(false);
                unitForm.reset();
            },
        });
    };

    const startEditingUnit = (unit: UnitItem) => {
        setEditingUnit(unit);
        editUnitForm.setData({
            title: unit.title,
            description: unit.description || '',
            estimated_periods: unit.estimated_periods || 6,
            order: unit.order,
        });
    };

    const submitUpdateUnit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUnit) return;
        editUnitForm.put(`/school/curriculums/units/${editingUnit.id}`, {
            onSuccess: () => setEditingUnit(null),
        });
    };

    const submitDeleteUnit = (unitId: number) => {
        if (!confirm('Are you sure you want to delete this unit and all its topics?')) return;
        deleteUnitForm.delete(`/school/curriculums/units/${unitId}`);
    };

    const openAddTopic = (unit: UnitItem) => {
        setUnitForNewTopic(unit);
        topicForm.setData({
            title: '',
            learning_objectives: '',
            content_summary: '',
            order: unit.topics.length + 1,
            status: 'published',
        });
    };

    const submitCreateTopic = (e: React.FormEvent) => {
        e.preventDefault();
        if (!unitForNewTopic) return;
        topicForm.post(`/school/curriculums/units/${unitForNewTopic.id}/topics`, {
            onSuccess: () => {
                setUnitForNewTopic(null);
                topicForm.reset();
            },
        });
    };

    const startEditingTopic = (topic: TopicItem) => {
        setEditingTopic(topic);
        editTopicForm.setData({
            title: topic.title,
            learning_objectives: topic.learning_objectives || '',
            content_summary: topic.content_summary || '',
            order: topic.order,
            status: topic.status,
        });
    };

    const submitUpdateTopic = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTopic) return;
        editTopicForm.put(`/school/curriculums/topics/${editingTopic.id}`, {
            onSuccess: () => setEditingTopic(null),
        });
    };

    const submitDeleteTopic = (topicId: number) => {
        if (!confirm('Are you sure you want to delete this topic?')) return;
        deleteTopicForm.delete(`/school/curriculums/topics/${topicId}`);
    };

    const openProgressModal = (topic: TopicItem) => {
        setProgressModalTopic(topic);
        const currentProg = topic.progress?.[0];
        progressForm.setData({
            class_section_id: currentProg?.class_section_id || studentEnrollment?.class_section_id || sections[0]?.id || 0,
            status: currentProg?.status || 'completed',
            notes: currentProg?.notes || '',
        });
    };

    const submitProgress = (e: React.FormEvent) => {
        e.preventDefault();
        if (!progressModalTopic) return;
        progressForm.post(`/school/curriculums/topics/${progressModalTopic.id}/progress`, {
            onSuccess: () => setProgressModalTopic(null),
        });
    };

    // Calculate completion metrics
    const totalTopics = curriculum?.units.reduce((acc, u) => acc + u.topics.length, 0) || 0;
    const completedTopics =
        curriculum?.units.reduce(
            (acc, u) =>
                acc +
                u.topics.filter((t) => t.progress && t.progress.some((p) => p.status === 'completed'))
                    .length,
            0
        ) || 0;
    const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    return (
        <TenantLayout title="Curriculum & Syllabus">
            <Head title={`${subject.name} Curriculum`} />

            {/* Top Navigation & Breadcrumb */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/school/subjects"
                        className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-[#0B1220] dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <ChevronLeft className="size-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                                {subject.code || 'ACADEMIC'}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-xs font-semibold text-slate-500">
                                {subject.school_class?.name || 'All Classes'}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {subject.name} Syllabus & Lesson Framework
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Status badge */}
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold ${
                            curriculum?.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                        }`}
                    >
                        <span className="size-2 rounded-full bg-current" />
                        <span>{curriculum?.status === 'published' ? 'Published' : 'Draft'}</span>
                    </span>

                    {canManage && curriculum && (
                        <>
                            <button
                                onClick={togglePublishStatus}
                                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                                    curriculum.status === 'published'
                                        ? 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300'
                                        : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300'
                                }`}
                            >
                                {curriculum.status === 'published' ? 'Revert to Draft' : 'Publish Curriculum'}
                            </button>

                            <button
                                onClick={() => setShowEditCurriculum(true)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0B1220] dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Edit Details
                            </button>

                            <button
                                onClick={() => setShowCreateUnit(true)}
                                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/25 transition hover:bg-purple-500"
                            >
                                <Plus className="size-3.5" />
                                <span>Add Unit</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Curriculum Summary Card */}
            <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {curriculum?.title || `${subject.name} Official Syllabus`}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {curriculum?.description || 'Standardized curriculum outline, module units, and lesson milestones.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Completion Rate
                            </span>
                            <span className="font-mono text-lg font-bold text-purple-600 dark:text-purple-400">
                                {progressPercent}%
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Total Units / Topics
                            </span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                {curriculum?.units.length || 0} Units • {totalTopics} Topics
                            </span>
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Units & Topics List */}
            {(!curriculum || curriculum.units.length === 0) ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-[#0B1220]">
                    <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <Layers className="size-7" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        No Curriculum Units Created Yet
                    </h3>
                    <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                        {canManage
                            ? 'Start structuring this subject by creating units, learning objectives, and topical milestones.'
                            : 'The syllabus for this subject is currently being assembled by faculty.'}
                    </p>
                    {canManage && (
                        <button
                            onClick={() => setShowCreateUnit(true)}
                            className="mt-4 flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-purple-500"
                        >
                            <Plus className="size-3.5" />
                            <span>Create First Unit</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {curriculum.units.map((unit, unitIdx) => (
                        <div
                            key={unit.id}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-[#0B1220]"
                        >
                            {/* Unit Header */}
                            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/40">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-md bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                            UNIT {unitIdx + 1}
                                        </span>
                                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                            {unit.title}
                                        </h4>
                                    </div>
                                    {unit.description && (
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {unit.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    {unit.estimated_periods && (
                                        <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            <Clock className="size-3 text-purple-500" />
                                            <span>~{unit.estimated_periods} periods</span>
                                        </span>
                                    )}

                                    {canManage && (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openAddTopic(unit)}
                                                className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-900/40 dark:bg-purple-950/20 dark:text-purple-300"
                                            >
                                                <Plus className="size-3" />
                                                <span>Add Topic</span>
                                            </button>
                                            <button
                                                onClick={() => startEditingUnit(unit)}
                                                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                                title="Edit Unit"
                                            >
                                                <Pencil className="size-3.5" />
                                            </button>
                                            <button
                                                onClick={() => submitDeleteUnit(unit.id)}
                                                className="rounded-lg p-1 text-rose-400 hover:text-rose-600"
                                                title="Delete Unit"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Topics List */}
                            <div className="divide-y divide-slate-100 p-2 dark:divide-slate-800/60">
                                {unit.topics.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-slate-400 italic">
                                        No topics added to this unit yet.
                                    </div>
                                ) : (
                                    unit.topics.map((topic, tIdx) => {
                                        const isCompleted =
                                            topic.progress &&
                                            topic.progress.some((p) => p.status === 'completed');

                                        return (
                                            <div
                                                key={topic.id}
                                                className="flex flex-wrap items-start justify-between gap-4 rounded-xl p-3.5 transition hover:bg-slate-50/70 dark:hover:bg-slate-900/30"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5">
                                                        {isCompleted ? (
                                                            <CheckCircle2 className="size-4 text-emerald-500" />
                                                        ) : (
                                                            <Circle className="size-4 text-slate-300 dark:text-slate-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                                Topic {tIdx + 1}: {topic.title}
                                                            </span>
                                                            <span
                                                                className={`rounded-md px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                                                                    topic.status === 'published'
                                                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                                }`}
                                                            >
                                                                {topic.status}
                                                            </span>
                                                        </div>

                                                        {topic.learning_objectives && (
                                                            <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                                                <span className="font-semibold text-purple-600 dark:text-purple-400">
                                                                    Objectives:{' '}
                                                                </span>
                                                                {topic.learning_objectives}
                                                            </div>
                                                        )}

                                                        {topic.content_summary && (
                                                            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                                {topic.content_summary}
                                                            </div>
                                                        )}

                                                        {topic.progress && topic.progress.length > 0 && (
                                                            <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400">
                                                                <CheckCircle className="size-3" />
                                                                <span>
                                                                    Completed for section{' '}
                                                                    {topic.progress[0]?.notes &&
                                                                        `("${topic.progress[0].notes}")`}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    {(canManage || isTeacher) && (
                                                        <button
                                                            onClick={() => openProgressModal(topic)}
                                                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-purple-950/30"
                                                        >
                                                            {isCompleted ? 'Update Progress' : 'Mark Completed'}
                                                        </button>
                                                    )}

                                                    {canManage && (
                                                        <>
                                                            <button
                                                                onClick={() => startEditingTopic(topic)}
                                                                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                                                title="Edit Topic"
                                                            >
                                                                <Pencil className="size-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => submitDeleteTopic(topic.id)}
                                                                className="rounded-lg p-1 text-rose-400 hover:text-rose-600"
                                                                title="Delete Topic"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CREATE UNIT MODAL */}
            {showCreateUnit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Add Curriculum Unit / Chapter
                            </h3>
                            <button
                                onClick={() => setShowCreateUnit(false)}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={submitCreateUnit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Unit Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Unit 1: Introduction to Mechanics"
                                    value={unitForm.data.title}
                                    onChange={(e) => unitForm.setData('title', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Estimated Periods
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={unitForm.data.estimated_periods}
                                        onChange={(e) =>
                                            unitForm.setData('estimated_periods', parseInt(e.target.value))
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Display Order
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={unitForm.data.order}
                                        onChange={(e) => unitForm.setData('order', parseInt(e.target.value))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Description / Scope
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Chapter summary and expected outcomes..."
                                    value={unitForm.data.description}
                                    onChange={(e) => unitForm.setData('description', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateUnit(false)}
                                    className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={unitForm.processing}
                                    className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500"
                                >
                                    Save Unit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATE TOPIC MODAL */}
            {unitForNewTopic && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Add Topic to: {unitForNewTopic.title}
                            </h3>
                            <button
                                onClick={() => setUnitForNewTopic(null)}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={submitCreateTopic} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Topic Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Velocity and Acceleration"
                                    value={topicForm.data.title}
                                    onChange={(e) => topicForm.setData('title', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Learning Objectives
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Students will be able to calculate velocity from distance-time graphs..."
                                    value={topicForm.data.learning_objectives}
                                    onChange={(e) => topicForm.setData('learning_objectives', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Content Summary & Recommended Exercises
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Textbook pages 45-52, Lab apparatus #3..."
                                    value={topicForm.data.content_summary}
                                    onChange={(e) => topicForm.setData('content_summary', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Order
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={topicForm.data.order}
                                        onChange={(e) => topicForm.setData('order', parseInt(e.target.value))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Status
                                    </label>
                                    <select
                                        value={topicForm.data.status}
                                        onChange={(e) => topicForm.setData('status', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setUnitForNewTopic(null)}
                                    className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={topicForm.processing}
                                    className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500"
                                >
                                    Add Topic
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TOPIC PROGRESS MODAL */}
            {progressModalTopic && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Record Lesson Progress
                                </h3>
                                <p className="text-xs text-slate-500">{progressModalTopic.title}</p>
                            </div>
                            <button
                                onClick={() => setProgressModalTopic(null)}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={submitProgress} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Section Cohort *
                                </label>
                                <select
                                    value={progressForm.data.class_section_id}
                                    onChange={(e) =>
                                        progressForm.setData('class_section_id', parseInt(e.target.value))
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    {sections.map((sec) => (
                                        <option key={sec.id} value={sec.id}>
                                            {sec.school_class?.name || 'Class'} — {sec.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Milestone Status *
                                </label>
                                <select
                                    value={progressForm.data.status}
                                    onChange={(e) => progressForm.setData('status', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    <option value="completed">Completed in Class</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="not_started">Not Started</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Faculty Remarks / Homework Given
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="e.g. Exercises 1-5 assigned as homework, lab demonstration concluded..."
                                    value={progressForm.data.notes}
                                    onChange={(e) => progressForm.setData('notes', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setProgressModalTopic(null)}
                                    className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={progressForm.processing}
                                    className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500"
                                >
                                    Save Progress
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}
