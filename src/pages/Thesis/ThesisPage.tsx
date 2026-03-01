import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Thesis, ThesisStatus } from '../../types/thesis';
import { thesisService } from '../../services/thesisService';
import { checklistService, type ChecklistItem } from '../../services/checklistService';
import ThesisCard from '../../components/Thesis/ThesisCard';

const VERIFIED_STATUSES: ThesisStatus[] = ['Published', 'Rejected', 'Need Update'];

const STATUS_OPTIONS: { label: string; value: ThesisStatus | 'Verified' | '' }[] = [
    { label: 'All', value: '' },
    { label: 'Verified by reviewer', value: 'Verified' },
    { label: 'Published', value: 'Published' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'Need Update', value: 'Need Update' },
    { label: 'Reviewing', value: 'Reviewing' },
    { label: 'Registered', value: 'Registered' },
];

const ThesisPage = () => {
    const [theses, setTheses] = useState<Thesis[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTitle, setSearchTitle] = useState('');
    const [statusFilter, setStatusFilter] = useState<ThesisStatus | 'Verified' | ''>('Verified');
    const [criteriaList, setCriteriaList] = useState<ChecklistItem[]>([]);
    const [criteriaDialogVisible, setCriteriaDialogVisible] = useState(false);

    const fetchTheses = useCallback(async () => {
        setLoading(true);
        try {
            const data = await thesisService.getAllTheses({
                searchTitle: searchTitle || undefined,
                status: statusFilter === 'Verified' ? undefined : statusFilter || undefined,
            });
            setTheses(data);
        } catch (err) {
            console.error('Failed to fetch theses', err);
            setTheses([]);
        } finally {
            setLoading(false);
        }
    }, [searchTitle, statusFilter]);

    useEffect(() => {
        fetchTheses();
    }, [fetchTheses]);

    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const t = setTimeout(() => setSearchTitle(debouncedSearch), 400);
        return () => clearTimeout(t);
    }, [debouncedSearch]);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await checklistService.getAll();
                setCriteriaList(data);
            } catch (e) {
                console.error('Failed to fetch criteria', e);
            }
        };
        load();
    }, [criteriaDialogVisible]);

    const displayedTheses =
        statusFilter === 'Verified'
            ? theses.filter((t) => VERIFIED_STATUSES.includes(t.status))
            : theses;

    const verifiedCount = theses.filter((t) => VERIFIED_STATUSES.includes(t.status)).length;
    const reviewingCount = theses.filter((t) => t.status === 'Reviewing').length;

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-[1200px] mx-auto p-8 lg:p-12 space-y-8">
                {/* Breadcrumb */}
                <nav className="flex text-sm text-slate-500">
                    <Link to="/semesters" className="hover:text-orange-600 transition-colors">Semesters</Link>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-orange-600">Thesis List</span>
                </nav>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-900">Thesis List</h1>
                        <p className="text-gray-500 mt-1">View theses verified by reviewer (Published, Rejected, Need Update)</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total</p>
                            <p className="text-2xl font-bold text-gray-900">{theses.length}</p>
                        </div>
                        <span className="material-symbols-outlined text-3xl text-gray-300">description</span>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Verified by reviewer</p>
                            <p className="text-2xl font-bold text-orange-600">{verifiedCount}</p>
                        </div>
                        <span className="material-symbols-outlined text-3xl text-orange-200">verified</span>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reviewing</p>
                            <p className="text-2xl font-bold text-amber-600">{reviewingCount}</p>
                        </div>
                        <span className="material-symbols-outlined text-3xl text-amber-200">schedule</span>
                    </div>
                </div>

                {/* Filters + Criteria action */}
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                            <input
                                type="text"
                                value={debouncedSearch}
                                onChange={(e) => setDebouncedSearch(e.target.value)}
                                placeholder="Search by title..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as ThesisStatus | 'Verified' | '')}
                            className="min-w-[200px] py-2.5 px-4 border border-gray-200 rounded-xl text-gray-700 font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    {/* <button
                        type="button"
                        onClick={() => setCriteriaDialogVisible(true)}
                        className="cursor-pointer flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">checklist</span>
                        Evaluation criteria
                    </button> */}
                </div>

                {/* Thesis grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
                                <div className="h-5 bg-gray-200 rounded w-3/4 mb-4" />
                                <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
                                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                                <div className="h-3 bg-gray-100 rounded w-5/6" />
                            </div>
                        ))}
                    </div>
                ) : displayedTheses.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
                        <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">description</span>
                        <p className="text-gray-500 font-medium">
                            {statusFilter === 'Verified'
                                ? 'No theses verified by reviewer yet.'
                                : 'No theses match the current filters.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {displayedTheses.map((t) => (
                            <ThesisCard key={t.thesisId} thesis={t} canUpload={false} />
                        ))}
                    </div>
                )}
            </div>

            {/* Evaluation criteria dialog - reuse ChecklistPage style or simple list */}
            {criteriaDialogVisible && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40" onClick={() => setCriteriaDialogVisible(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Evaluation criteria</h3>
                            <button type="button" onClick={() => setCriteriaDialogVisible(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <p className="text-sm text-gray-500 mb-4">Manage checklist in the dedicated Checklist page.</p>
                            <Link
                                to="/checklists"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600"
                            >
                                <span className="material-symbols-outlined text-lg">open_in_new</span>
                                Open Checklist
                            </Link>
                            {criteriaList.length > 0 && (
                                <ul className="mt-6 space-y-2">
                                    {criteriaList.slice(0, 10).map((c) => (
                                        <li key={c.checklistId} className="flex items-start gap-2 text-sm text-gray-700 p-2 rounded-lg bg-gray-50">
                                            <span className="text-orange-500 font-bold">{c.displayOrder + 1}.</span>
                                            <span className="font-medium">{c.title || c.content}</span>
                                        </li>
                                    ))}
                                    {criteriaList.length > 10 && (
                                        <li className="text-xs text-gray-400">+ {criteriaList.length - 10} more</li>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThesisPage;
