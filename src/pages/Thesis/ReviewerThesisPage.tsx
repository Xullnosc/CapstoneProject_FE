import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Thesis, ThesisStatus } from '../../types/thesis';
import { thesisService } from '../../services/thesisService';
import { authService } from '../../services/authService';
import ThesisCard from '../../components/Thesis/ThesisCard';

const THESIS_STATUSES: { label: string; value: ThesisStatus | '' }[] = [
    { label: 'All Statuses', value: '' },
    { label: 'Registered', value: 'Registered' },
    { label: 'Reviewing', value: 'Reviewing' },
    { label: 'Need Update', value: 'Need Update' },
    { label: 'Updated', value: 'Updated' },
    { label: 'Published', value: 'Published' },
    { label: 'Rejected', value: 'Rejected' },
];

const ReviewerThesisPage = () => {
    const user = authService.getUser();
    const isReviewer = user?.roleName === 'Lecturer' && (user as { isReviewer?: boolean }).isReviewer;

    const [theses, setTheses] = useState<Thesis[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTitle, setSearchTitle] = useState('');
    const [statusFilter, setStatusFilter] = useState<ThesisStatus | ''>('');

    const fetchTheses = useCallback(async () => {
        setLoading(true);
        try {
            const data = await thesisService.getAllTheses({
                searchTitle: searchTitle || undefined,
                status: statusFilter || undefined,
            });
            setTheses(data);
        } catch (err) {
            console.error('Failed to fetch theses for review', err);
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

    const handleClearFilters = () => {
        setDebouncedSearch('');
        setStatusFilter('');
    };
    const hasFilters = debouncedSearch !== '' || statusFilter !== '';

    if (user && !isReviewer) {
        return (
            <div className="p-6 lg:p-10 flex flex-col items-center justify-center min-h-[50vh]">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-md text-center">
                    <i className="pi pi-lock text-4xl text-amber-500 mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Access restricted</h2>
                    <p className="text-slate-600 text-sm">Only reviewers (Lecturers assigned as reviewer) can view this page.</p>
                    <Link to="/home" className="inline-block mt-6 px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90">Back to Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-10 font-sans text-gray-800">
            <nav className="flex mb-4">
                <ol className="flex items-center space-x-2 text-sm text-slate-500">
                    <li><Link to="/home" className="hover:text-primary transition-colors">Home</Link></li>
                    <li><i className="pi pi-chevron-right text-xs" /></li>
                    <li className="font-medium text-primary">Review Thesis</li>
                </ol>
            </nav>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Theses to Review</h1>
                    <p className="text-slate-500 mt-1">View and review submitted theses as a reviewer</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-8">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={debouncedSearch}
                                onChange={(e) => setDebouncedSearch(e.target.value)}
                                placeholder="Search by title..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4 items-center">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as ThesisStatus | '')}
                            className="min-w-[170px] py-3 px-4 bg-slate-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 font-medium cursor-pointer"
                        >
                            {THESIS_STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                        {hasFilters && (
                            <button onClick={handleClearFilters} className="text-slate-500 hover:text-primary px-4 py-3 font-medium transition-colors">
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse">
                            <div className="h-5 bg-slate-200 rounded w-3/4 mb-4" />
                            <div className="h-4 bg-slate-100 rounded w-1/2 mb-3" />
                            <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                            <div className="h-3 bg-slate-100 rounded w-5/6" />
                        </div>
                    ))}
                </div>
            ) : theses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <i className="pi pi-book text-4xl text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">No theses found</h3>
                    <p className="text-slate-400 text-sm">
                        {hasFilters ? 'Try adjusting your search or filters.' : 'There are no theses to review at the moment.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {theses.map((thesis) => (
                        <ThesisCard
                            key={thesis.thesisId}
                            thesis={thesis}
                            canUpload={false}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReviewerThesisPage;
