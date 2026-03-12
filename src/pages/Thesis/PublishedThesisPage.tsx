import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Thesis } from '../../types/thesis';
import { thesisService } from '../../services/thesisService';
import PremiumBreadcrumb from '../../components/Common/PremiumBreadcrumb';
import Swal from '../../utils/swal';

const PublishedThesisPage = () => {
    const navigate = useNavigate();
    const [theses, setTheses] = useState<Thesis[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTitle, setSearchTitle] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const handleRegisterClick = (thesis: Thesis) => {
        Swal.fire({
            title: 'Registration',
            text: `Would you like to register your team for "${thesis.title}"? This feature will be available in the next update.`,
            icon: 'info',
            confirmButtonColor: '#f97415',
            confirmButtonText: 'Great, thanks!'
        });
    };

    // Debounce
    useEffect(() => {
        const t = setTimeout(() => setSearchTitle(debouncedSearch), 400);
        return () => clearTimeout(t);
    }, [debouncedSearch]);

    const fetchTheses = useCallback(async () => {
        setLoading(true);
        try {
            const data = await thesisService.getAllTheses({
                status: 'Published',
                isLocked: false,
                lecturerOnly: true,
                searchTitle: searchTitle || undefined,
            });
            setTheses(data);
        } catch (err) {
            console.error('Failed to fetch published theses', err);
            setTheses([]);
        } finally {
            setLoading(false);
        }
    }, [searchTitle]);

    useEffect(() => {
        fetchTheses();
    }, [fetchTheses]);

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const breadcrumbItems = [
        { label: 'Home', to: '/home' },
        { label: 'Register Approved Thesis' }
    ];

    return (
        <div className="p-6 lg:p-10 font-sans text-gray-800">
            {/* Breadcrumb */}
            <div className="mb-6">
                <PremiumBreadcrumb items={breadcrumbItems} />
            </div>

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Available Lecturer Theses
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Browse published, unlocked theses proposed by lecturers and register your team.
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-8">
                <div className="relative">
                    <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={debouncedSearch}
                        onChange={(e) => setDebouncedSearch(e.target.value)}
                        placeholder="Search thesis title..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 transition-all"
                    />
                </div>
            </div>

            {/* Content */}
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
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">No available theses</h3>
                    <p className="text-slate-400 text-sm">
                        {debouncedSearch
                            ? 'No theses match your search.'
                            : 'There are no published & unlocked lecturer theses at the moment.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {theses.map((thesis) => (
                        <div
                            key={thesis.thesisId}
                            className="bg-white border rounded-2xl border-slate-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col overflow-hidden"
                        >
                            <div className="p-6 flex-1">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <h3 className="text-slate-900 font-bold text-base leading-snug line-clamp-2 flex-1">
                                        {thesis.title}
                                    </h3>
                                    <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                        <i className="pi pi-check-circle text-[10px]" />
                                        Published
                                    </span>
                                </div>

                                {/* Lecturer */}
                                {thesis.ownerName && (
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="size-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                                            {thesis.ownerName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-slate-700 text-sm font-medium leading-none">{thesis.ownerName}</p>
                                            {thesis.ownerEmail && (
                                                <p className="text-slate-400 text-xs mt-0.5">{thesis.ownerEmail}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                {thesis.shortDescription && (
                                    <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">
                                        {thesis.shortDescription}
                                    </p>
                                )}

                                {/* Footer */}
                                <div className="flex items-center text-xs text-slate-400 gap-1 mt-auto">
                                    <i className="pi pi-calendar text-xs" />
                                    <span>Published {formatDate(thesis.updateDate ?? thesis.upDate)}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-6 pb-6 pt-2 flex gap-3">
                                <button
                                    onClick={() => navigate(`/thesis/${thesis.thesisId}`)}
                                    className="flex-1 py-2.5 border-2 border-primary text-primary font-bold rounded-xl cursor-pointer hover:bg-orange-50 transition-colors text-sm"
                                >
                                    View Details
                                </button>
                                <button
                                    onClick={() => handleRegisterClick(thesis)}
                                    className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl cursor-pointer hover:bg-primary/90 transition-colors shadow-sm text-sm"
                                >
                                    Register
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PublishedThesisPage;
