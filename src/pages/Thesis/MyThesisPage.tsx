import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Thesis, ThesisStatus } from '../../types/thesis';
import { thesisService } from '../../services/thesisService';
import { authService } from '../../services/authService';
import ThesisCard from '../../components/Thesis/ThesisCard';
import UpdateThesisModal from '../../components/Thesis/UpdateThesisModal';
import PremiumBreadcrumb from '../../components/Common/PremiumBreadcrumb';
import { Dropdown } from 'primereact/dropdown';
import Swal from '../../utils/swal';
import styles from './Thesis.module.css';

const THESIS_STATUSES: { label: string; value: ThesisStatus | '' }[] = [
    { label: 'All Statuses', value: '' },
    { label: 'On Mentor Inviting', value: 'On Mentor Inviting' },
    { label: 'Registered', value: 'Registered' },
    { label: 'Reviewing', value: 'Reviewing' },
    { label: 'Need Update', value: 'Need Update' },
    { label: 'Updated', value: 'Updated' },
    { label: 'Published', value: 'Published' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'Cancelled', value: 'Cancelled' },
];

const MyThesisPage = () => {
    const navigate = useNavigate();
    const user = authService.getUser();
    const isStudent = user?.roleName === 'Student';
    const isLecturer = user?.roleName === 'Lecturer';
    const isHOD = user?.roleName === 'HOD' || user?.roleName === 'Head of Department';
    const canUpload = isStudent; // Only students (team leader) upload
    const canProposeNew = isLecturer || isHOD; // Both lecturers and HODs can submit new theses

    const [theses, setTheses] = useState<Thesis[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTitle, setSearchTitle] = useState('');
    const [statusFilter, setStatusFilter] = useState<ThesisStatus | ''>('');
    const [selectedThesis, setSelectedThesis] = useState<Thesis | null>(null);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [lockingId, setLockingId] = useState<string | null>(null);

    const handleToggleLock = async (thesis: Thesis) => {
        setLockingId(thesis.thesisId);
        try {
            const updated = await thesisService.toggleThesisLock(thesis.thesisId);
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: `Thesis ${updated.isLocked ? 'locked' : 'unlocked'} successfully`,
                timer: 2000,
                showConfirmButton: false
            });
            // Update local state instead of full fetch for better UX
            setTheses(prev => prev.map(t => t.thesisId === updated.thesisId ? { ...t, isLocked: updated.isLocked } : t));
        } catch (err: unknown) {
            console.error('Failed to toggle lock', err);
            const message = err.response?.data?.Message || 'Failed to toggle thesis lock';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: message
            });
        } finally {
            setLockingId(null);
        }
    };

    const fetchTheses = useCallback(async () => {
        setLoading(true);
        try {
            const data = await thesisService.getMyTheses({
                searchTitle: searchTitle || undefined,
                status: statusFilter || undefined,
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

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const t = setTimeout(() => setSearchTitle(debouncedSearch), 400);
        return () => clearTimeout(t);
    }, [debouncedSearch]);

    const handleUploadClick = (thesis: Thesis) => {
        setSelectedThesis(thesis);
        setUploadModalVisible(true);
    };

    const hasFilters = debouncedSearch !== '' || statusFilter !== '';

    const breadcrumbItems = [
        { label: 'Home', to: '/home' },
        { label: 'My Thesis' }
    ];

    return (
        <div className={`p-6 lg:p-10 font-sans text-gray-800 ${styles.thesisContainer}`}>
            {/* Breadcrumb */}
            <div className="mb-4">
                <PremiumBreadcrumb items={breadcrumbItems} />
            </div>

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Thesis</h1>
                    <p className="text-slate-500 mt-1">Manage and track your own academic research proposals.</p>
                </div>
                {canProposeNew && (
                    <button
                        onClick={() => navigate('/propose-thesis')}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-all"
                    >
                        <i className="pi pi-plus" />
                        New Submission
                    </button>
                )}
            </div>

            {/* Filter Bar */}
            {!isStudent && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-8">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
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
                            {/* Status dropdown */}
                            <Dropdown
                                value={statusFilter}
                                options={THESIS_STATUSES}
                                onChange={(e) => setStatusFilter(e.value as ThesisStatus | '')}
                                placeholder="Filter Status"
                                className="min-w-[170px] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 text-slate-900"
                                pt={{
                                    root: { className: 'h-[48px] flex items-center shadow-none' },
                                    input: { className: 'font-medium py-0 px-4' },
                                    trigger: { className: 'px-4' }
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                /* Skeleton */
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
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <i className="pi pi-book text-4xl text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">No thesis found</h3>
                    <p className="text-slate-400 text-sm">
                        {hasFilters ? 'Try adjusting your search or filters.' : 'You have not submitted any thesis yet.'}
                    </p>
                </div>
            ) : (
                /* Card Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {theses.map((thesis) => (
                        <ThesisCard
                            key={thesis.thesisId}
                            thesis={thesis}
                            canUpload={canUpload}
                            onUploadClick={handleUploadClick}
                            canLock={(isLecturer || isHOD) && thesis.userId === user?.userId}
                            onToggleLock={handleToggleLock}
                            isLocking={lockingId === thesis.thesisId}
                        />
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            <UpdateThesisModal
                visible={uploadModalVisible}
                thesis={selectedThesis}
                onHide={() => setUploadModalVisible(false)}
                onSuccess={fetchTheses}
            />
        </div>
    );
};

export default MyThesisPage;

