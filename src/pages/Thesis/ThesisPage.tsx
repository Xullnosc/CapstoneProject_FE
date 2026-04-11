import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { ProgressSpinner } from 'primereact/progressspinner';
import type { Thesis, ThesisStatus } from '../../types/thesis';
import { thesisService } from '../../services/thesisService';
import { authService } from '../../services/authService';
import { checklistService } from '../../services/checklistService';
import { semesterService, type Semester } from '../../services/semesterService';
import type { ChecklistDTO } from '../../types/checklist';
import ThesisCard from '../../components/Thesis/ThesisCard';
import HodDecisionModal from '../../components/Thesis/HodDecisionModal';
import PremiumBreadcrumb from '../../components/Common/PremiumBreadcrumb';
import Swal from '../../utils/swal';
import styles from './Thesis.module.css';

const VERIFIED_STATUSES: ThesisStatus[] = ['Published', 'Need Update'];

// Define base status options outside for reference if needed, but we'll filter inside the component
const RAW_STATUS_OPTIONS: { label: string; value: ThesisStatus | 'Verified' | '' }[] = [
    { label: 'All Proposals', value: '' },
    { label: 'Verified Only', value: 'Verified' },
    { label: 'Published', value: 'Published' },
    { label: 'On Mentor Inviting', value: 'On Mentor Inviting' },
    { label: 'Reviewing', value: 'Reviewing' },
    { label: 'Need Update', value: 'Need Update' },
    { label: 'Registered', value: 'Registered' },
];

const ThesisPage = () => {
    const navigate = useNavigate();
    const user = authService.getUser();
    const isHOD = user?.roleName === 'HOD' || user?.roleName === 'Head of Department';
    const isReviewer = (user as { isReviewer?: boolean } | null)?.isReviewer === true;
 
    // Filter status options based on role
    const statusOptions = RAW_STATUS_OPTIONS.filter(opt => {
        if (opt.value === 'On Mentor Inviting' && !isHOD) return false;
        return true;
    });

    // Redirect if not HOD or Reviewer
    useEffect(() => {
        if (!isHOD && !isReviewer) {
            navigate('/my-thesis', { replace: true });
        }
    }, [isHOD, isReviewer, navigate]);

    const [theses, setTheses] = useState<Thesis[]>([]);
    const [allTheses, setAllTheses] = useState<Thesis[]>([]); // For stats
    const [loading, setLoading] = useState(true);
    const [searchTitle, setSearchTitle] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<ThesisStatus | 'Verified' | ''>('');
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);

    // Stats (calculated from allTheses to remain consistent)
    const totalCount = allTheses.length;
    const verifiedCount = allTheses.filter((t) => VERIFIED_STATUSES.includes(t.status)).length;
    const reviewingCount = allTheses.filter((t) => t.status === 'Reviewing').length;

    // Criteria State
    const [criteriaList, setCriteriaList] = useState<ChecklistDTO[]>([]);
    const [criteriaDialogVisible, setCriteriaDialogVisible] = useState(false);
    const [newCriteriaContent, setNewCriteriaContent] = useState('');
    const [editingCriteriaId, setEditingCriteriaId] = useState<number | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [isAddingCriteria, setIsAddingCriteria] = useState(false);

    // HOD Decision Modal State
    const [hodDecisionVisible, setHodDecisionVisible] = useState(false);
    const [selectedThesisId, setSelectedThesisId] = useState<string | null>(null);
    const [selectedThesisFileUrl, setSelectedThesisFileUrl] = useState<string | null>(null);

    const handleHodDecision = (thesis: Thesis) => {
        setSelectedThesisId(thesis.thesisId);
        setSelectedThesisFileUrl(thesis.fileUrl);
        setHodDecisionVisible(true);
    };

    const fetchTheses = useCallback(async () => {
        setLoading(true);
        // Removed setLoading(true) as `loading` state was removed.
        try {
            // Fetch with semester filter if selected
            const fullData = await thesisService.getAllTheses({
                semesterId: selectedSemesterId || undefined
            });

            const filteredRepoData = fullData.filter(t => {
                // Removed !isMentor filter. We want mentors to see their theses in the global list, 
                // but we block them from evaluating on the detail page.
                return t.userId !== user?.userId && t.status !== 'Cancelled';
            });


            setAllTheses(filteredRepoData);

            // Now, apply the UI filters (search and status)
            let displayData = [...filteredRepoData];

            if (searchTitle) {
                displayData = displayData.filter(t => t.title.toLowerCase().includes(searchTitle.toLowerCase()));
            }

            if (statusFilter === 'Verified') {
                displayData = displayData.filter(t => VERIFIED_STATUSES.includes(t.status));
            } else if (statusFilter) {
                displayData = displayData.filter(t => t.status === statusFilter);
            }

            setTheses(displayData);
        } catch (err) {
            console.error('Failed to fetch theses', err);
            setTheses([]);
            setAllTheses([]);
        } finally {
            setLoading(false);
        }
    }, [searchTitle, statusFilter, user?.userId, selectedSemesterId]);

    const fetchSemesters = useCallback(async () => {
        try {
            const data = await semesterService.getAllSemesters();
            setSemesters(data);
            
            // Set default selected semester to the active one (Open) if not already set
            if (!selectedSemesterId) {
                const active = data.find(s => s.status === 'Open' || s.status === 'Active');
                if (active) {
                    setSelectedSemesterId(active.semesterId);
                }
            }
        } catch (err) {
            console.error('Failed to fetch semesters', err);
        }
    }, [selectedSemesterId]);

    const fetchCriteria = useCallback(async () => {
        try {
            const data = await checklistService.getAll();
            setCriteriaList(data);
        } catch (err) {
            console.error('Failed to fetch criteria', err);
        }
    }, []);

    useEffect(() => {
        fetchSemesters();
    }, [fetchSemesters]);

    useEffect(() => {
        fetchTheses();
        fetchCriteria();
    }, [fetchTheses, fetchCriteria]);

    useEffect(() => {
        const t = setTimeout(() => setSearchTitle(debouncedSearch), 500);
        return () => clearTimeout(t);
    }, [debouncedSearch]);

    // Criteria Handlers
    const addCriteria = async () => {
        if (!newCriteriaContent.trim()) return;
        try {
            const created = await checklistService.create({
                content: newCriteriaContent.trim()
            });
            setCriteriaList(prev => [...prev, created]);
            setNewCriteriaContent('');
            Swal.fire({ icon: 'success', title: 'Criteria Added', timer: 1500, showConfirmButton: false });
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to add criteria', 'error');
        }
    };

    const deleteCriteria = async (id: number) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This evaluation rule will be permanently removed.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f26e21',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await checklistService.delete(id);
                setCriteriaList(prev => prev.filter((c) => c.checklistId !== id));
                Swal.fire('Deleted!', 'Criteria removed successfully.', 'success');
            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'Failed to delete criteria', 'error');
            }
        }
    };

    const updateCriteria = async () => {
        if (!editingCriteriaId || !editingContent.trim()) return;
        try {
            await checklistService.update(editingCriteriaId, {
                content: editingContent.trim()
            });
            setCriteriaList(prev => prev.map(c =>
                c.checklistId === editingCriteriaId
                    ? { ...c, content: editingContent.trim(), updatedAt: new Date().toISOString() }
                    : c
            ));
            setEditingCriteriaId(null);
            Swal.fire({ icon: 'success', title: 'Criteria Updated', timer: 1500, showConfirmButton: false });
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to update criteria', 'error');
        }
    };

    const breadcrumbItems = [
        { label: 'Home', to: '/home' },
        { label: 'Thesis Management' }
    ];

    return (
        <div className={`min-h-screen bg-[#fafbfc] ${styles.thesisContainer}`}>
            {/* Page Header Area */}
            <div className="bg-white border-b border-gray-100 pt-6 pb-12">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    {/* Breadcrumb */}
                    <div className="mb-6">
                        <PremiumBreadcrumb items={breadcrumbItems} />
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Thesis Administration</h1>
                            </div>
                            <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
                                Review and manage all pending and verified thesis proposals submitted to the department.
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {isHOD && semesters.length > 0 && (
                                <div className="relative group">
                                    <Dropdown
                                        value={selectedSemesterId}
                                        options={semesters}
                                        onChange={(e) => setSelectedSemesterId(e.value)}
                                        optionLabel="semesterCode"
                                        optionValue="semesterId"
                                        placeholder="Select Semester"
                                        appendTo="self"
                                        className="w-full min-w-[180px] h-[48px] bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold text-slate-700 text-sm shadow-sm"
                                        pt={{
                                            root: { className: 'flex items-center shadow-none' },
                                            input: { className: '!pl-11 pr-4 font-bold text-slate-700 border-none' },
                                            trigger: { className: 'pr-4' },
                                            item: { className: 'text-sm font-bold text-slate-700' },
                                            list: { className: 'p-2' },
                                            panel: { className: 'rounded-2xl border-slate-100 shadow-xl overflow-hidden' }
                                        }}
                                        itemTemplate={(option: Semester) => (
                                            <div className="flex items-center justify-between gap-4">
                                                <span>{option.semesterCode}</span>
                                                {(option.status === 'Open' || option.status === 'Active') && (
                                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase rounded-full">Open</span>
                                                )}
                                            </div>
                                        )}
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                        <i className="pi pi-calendar text-orange-500" />
                                    </div>
                                </div>
                            )}

                            {(isHOD || isReviewer) && (
                                <button
                                    onClick={() => setCriteriaDialogVisible(true)}
                                    className="h-[48px] flex items-center gap-2 px-6 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-md text-sm whitespace-nowrap"
                                >
                                    <i className="pi pi-cog" />
                                    <span>Evaluation Checklist</span>
                                </button>
                            )}
                            
                            {isHOD && (
                                <button
                                    onClick={() => navigate('/propose-thesis')}
                                    className="h-[48px] flex items-center gap-2 px-6 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 transition-all shadow-md text-sm whitespace-nowrap"
                                    title="Propose New Thesis"
                                >
                                    <i className="pi pi-plus" />
                                    <span>Propose</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                        <StatCard label="Total Submissions" value={totalCount} icon="pi-copy" color="blue" />
                        <StatCard label="Reviewing" value={reviewingCount} icon="pi-clock" color="amber" />
                        <StatCard label="Verified" value={verifiedCount} icon="pi-verified" color="emerald" />
                        <StatCard
                            label={isHOD ? "HOD Authority" : "Active Reviewer"}
                            value={user?.fullName?.split(' ')[0] || 'Member'}
                            icon={isHOD ? "pi-shield" : "pi-users"}
                            color="purple"
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className="w-full lg:w-72 shrink-0 space-y-8">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Search & Filter</h3>
                            <div className="space-y-4">
                                <div className="group relative">
                                    <i className="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search titles..."
                                        value={debouncedSearch}
                                        onChange={(e) => setDebouncedSearch(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 transition-all font-medium text-slate-700 text-sm"
                                    />
                                    {debouncedSearch && (
                                        <button
                                            onClick={() => setDebouncedSearch('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                                        >
                                            <i className="pi pi-times-circle" />
                                        </button>
                                    )}
                                </div>


                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-600 px-1">Current Status</label>
                                    <div className="flex flex-col gap-1.5">
                                        {statusOptions.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setStatusFilter(opt.value)}
                                                className={`flex items-center justify-between px-4 py-2.5 rounded-xl font-medium transition-all text-sm group ${statusFilter === opt.value
                                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'
                                                    }`}
                                            >
                                                <span>{opt.label}</span>
                                                {statusFilter !== opt.value && (
                                                    <i className="pi pi-chevron-right text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main List */}
                    <main className="flex-1">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                                <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" fill="transparent" animationDuration=".5s" />
                                <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">Scanning repository...</p>
                            </div>
                        ) : theses.length === 0 ? (
                            <div className="bg-white border border-dashed border-slate-200 rounded-[2.5rem] py-24 flex flex-col items-center justify-center text-center px-6">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    <i className="pi pi-search-plus text-5xl text-slate-300" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">No matching outcomes</h3>
                                <p className="text-slate-500 max-w-sm mx-auto">
                                    
                                </p>
                                <button
                                    onClick={() => { setDebouncedSearch(''); setStatusFilter(''); }}
                                    className="mt-8 text-orange-600 font-bold hover:underline"
                                >
                                    Reset all parameters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20 items-start">
                                {theses.map((t) => (
                                    <ThesisCard 
                                        key={t.thesisId} 
                                        thesis={t} 
                                        canUpload={false} 
                                        isHOD={isHOD}
                                        showLockStatus={isHOD}
                                        onHodDecisionClick={handleHodDecision}
                                    />
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Criteria Management Dialog */}
            <Dialog
                header={
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-900">
                            <i className="pi pi-list" />
                        </div>
                        <span className="text-xl font-bold text-slate-900">Evaluation Criteria</span>
                    </div>
                }
                visible={criteriaDialogVisible}
                style={{ width: '90vw', maxWidth: '650px' }}
                onHide={() => setCriteriaDialogVisible(false)}
                className="font-sans"
                pt={{
                    header: { className: 'p-6 border-b border-slate-100 bg-white rounded-t-[2.5rem]' },
                    content: { className: 'p-8 bg-white rounded-b-[2.5rem]' },
                    mask: { className: 'backdrop-blur-sm bg-slate-900/40' }
                }}
            >
                <div>
                    <div className="mb-6">
                        <p className="text-slate-500 text-[13px] mb-6 px-1">
                            {isHOD
                                ? "Define quality standards that reviewers must validate for each thesis proposal."
                                : "Standard metrics used to validate and approve academic thesis proposals."}
                        </p>
                        {isHOD && (
                            <div className="space-y-4">
                                {!isAddingCriteria ? (
                                    <button
                                        onClick={() => setIsAddingCriteria(true)}
                                        className="w-full py-3 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 hover:border-orange-500 hover:text-orange-500 hover:bg-orange-50/20 transition-all flex items-center justify-center gap-2 group border-spacing-4"
                                    >
                                        <i className="pi pi-plus-circle text-lg" />
                                        <span className="font-bold text-sm">Add New Criteria</span>
                                    </button>
                                ) : (
                                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                                <i className="pi pi-plus-circle text-orange-500" />
                                                New Criteria
                                            </h3>
                                            <button
                                                onClick={() => { setIsAddingCriteria(false); setNewCriteriaContent(''); }}
                                                className="text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 p-1 transition-colors"
                                            >
                                                <i className="pi pi-times text-[10px]" />
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            <textarea
                                                value={newCriteriaContent}
                                                onChange={(e) => setNewCriteriaContent(e.target.value)}
                                                placeholder="Describe the evaluation criteria in detail..."
                                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-orange-500 focus:outline-none transition-all text-sm min-h-[100px] resize-none shadow-none font-bold"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => setIsAddingCriteria(false)}
                                                    className="flex-1 !bg-white !text-slate-500 !border-slate-200 !rounded-xl !py-2 !text-xs font-bold hover:!bg-slate-50"
                                                    label="Discard"
                                                />
                                                <Button
                                                    onClick={() => { addCriteria(); setIsAddingCriteria(false); }}
                                                    disabled={!newCriteriaContent.trim()}
                                                    className="flex-[2] !bg-orange-600 !border-none !rounded-xl !py-2 !text-xs font-bold"
                                                    icon="pi pi-check"
                                                    label="Save Criteria"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                        {criteriaList.length === 0 ? (
                            <div className="py-12 text-center opacity-30">
                                <i className="pi pi-list text-4xl mb-3" />
                                <p className="font-bold">No evaluation criteria defined yet.</p>
                            </div>
                        ) : (
                            criteriaList.map((item) => (
                                <div
                                    key={item.checklistId}
                                    className={`group p-5 rounded-2xl border transition-all duration-300 ${editingCriteriaId === item.checklistId
                                        ? 'bg-white border-orange-500 shadow-xl ring-4 ring-orange-500/5'
                                        : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-md'
                                        }`}
                                >
                                    {editingCriteriaId === item.checklistId ? (
                                        <div className="space-y-3 p-2 bg-orange-50/30 rounded-2xl border border-orange-100">
                                            <div className="flex items-center justify-between mb-1 px-1">
                                                <div className="flex items-center gap-2 text-orange-600">
                                                    <i className="pi pi-pencil text-[10px]" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Edit Criteria</span>
                                                </div>
                                                <button onClick={() => setEditingCriteriaId(null)} className="text-slate-400 hover:text-slate-600">
                                                    <i className="pi pi-times text-[10px]" />
                                                </button>
                                            </div>
                                            <textarea
                                                value={editingContent}
                                                onChange={(e) => setEditingContent(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-orange-500 focus:outline-none transition-all text-sm min-h-[100px] resize-none shadow-none font-bold"
                                                placeholder="Criteria Description"
                                            />
                                            <div className="flex gap-2 pt-1">
                                                <Button
                                                    label="Cancel"
                                                    onClick={() => setEditingCriteriaId(null)}
                                                    className="flex-1 !bg-white !text-slate-500 !border-slate-200 !rounded-xl !py-2 !text-xs font-bold"
                                                />
                                                <Button
                                                    label="Update"
                                                    onClick={updateCriteria}
                                                    className="flex-[2] !bg-orange-600 !border-none !rounded-xl !py-2 !text-xs font-bold"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                                                <i className="pi pi-check-circle text-sm" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-slate-800 text-sm font-black leading-relaxed">{item.content}</p>
                                            </div>
                                            {isHOD && (
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all -mr-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingCriteriaId(item.checklistId);
                                                            setEditingContent(item.content);
                                                        }}
                                                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                        title="Edit"
                                                    >
                                                        <i className="pi pi-pencil text-xs" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteCriteria(item.checklistId)}
                                                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Delete"
                                                    >
                                                        <i className="pi pi-trash text-xs" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </Dialog>

            {selectedThesisId && (
                <HodDecisionModal
                    visible={hodDecisionVisible}
                    onHide={() => {
                        setHodDecisionVisible(false);
                        setSelectedThesisId(null);
                        setSelectedThesisFileUrl(null);
                    }}
                    thesisId={selectedThesisId}
                    thesisFileUrl={selectedThesisFileUrl ?? undefined}
                    onSuccess={fetchTheses}
                />
            )}
        </div>
    );
};

// Sub-component for Stats
const StatCard = ({ label, value, icon, color }: { label: string; value: string | number, icon: string, color: string }) => {
    const colorClasses: Record<string, string> = {
        blue: 'text-blue-600 bg-blue-50',
        amber: 'text-amber-600 bg-amber-50',
        emerald: 'text-emerald-600 bg-emerald-50',
        purple: 'text-purple-600 bg-purple-50'
    };

    return (
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${colorClasses[color]}`}>
                    <i className={`pi ${icon} text-lg`} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className="text-xl font-black text-slate-800 leading-none">{value}</p>
                </div>
            </div>
        </div>
    );
};

export default ThesisPage;

