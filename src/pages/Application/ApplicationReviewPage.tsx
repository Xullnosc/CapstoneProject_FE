import { useState, useEffect, useCallback } from 'react';
import { applicationService } from '../../services/applicationService';
import type { ApplicationWithMembers, ApplicationsByThesisResponse } from '../../services/applicationService';
import { thesisService } from '../../services/thesisService';
import type { Thesis } from '../../types/thesis';
import PremiumBreadcrumb from '../../components/Common/PremiumBreadcrumb';
import { Dropdown } from 'primereact/dropdown';
import Swal from '../../utils/swal';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: string }> = {
    Pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'pi pi-clock' },
    Approved: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'pi pi-check-circle' },
    Rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'pi pi-times-circle' },
    Cancelled: { label: 'Cancelled', bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', icon: 'pi pi-ban' },
};

const FILTER_STATUSES = [
    { label: 'All Statuses', value: '' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' },
];

const ApplicationReviewPage = () => {
    const [theses, setTheses] = useState<Thesis[]>([]);
    const [selectedThesisId, setSelectedThesisId] = useState<string>('');
    const [data, setData] = useState<ApplicationsByThesisResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [thesesLoading, setThesesLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Pending');
    const [page, setPage] = useState(1);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // Fetch lecturer's Published theses
    useEffect(() => {
        (async () => {
            setThesesLoading(true);
            try {
                const list = await thesisService.getMyTheses({ status: 'Published' });
                setTheses(list);
                if (list.length > 0) setSelectedThesisId(list[0].thesisId);
            } catch {
                setTheses([]);
            } finally {
                setThesesLoading(false);
            }
        })();
    }, []);

    const fetchApplications = useCallback(async () => {
        if (!selectedThesisId) return;
        setLoading(true);
        try {
            const result = await applicationService.getApplicationsByThesis(selectedThesisId, {
                status: statusFilter || undefined,
                search: search || undefined,
                page,
                limit: 10,
            });
            setData(result);
        } catch {
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [selectedThesisId, statusFilter, search, page]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const handleApprove = async (app: ApplicationWithMembers) => {
        const result = await Swal.fire({
            title: 'Approve Application?',
            html: `Approve team <strong>${app.teamName}</strong>?<br/><small class="text-slate-500">Other pending applications for this thesis will be automatically rejected.</small>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Approve',
            cancelButtonText: 'Cancel',
        });
        if (!result.isConfirmed) return;

        setActionLoading(app.id);
        try {
            await applicationService.approveApplication(app.id);
            Swal.fire({ icon: 'success', title: 'Success', text: `Approved team ${app.teamName}.`, timer: 2000, showConfirmButton: false });
            fetchApplications();
        } catch (err: unknown) {
            const axiosMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            Swal.fire({ icon: 'error', title: 'Error', text: axiosMsg || 'Failed to approve application.' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (app: ApplicationWithMembers) => {
        const result = await Swal.fire({
            title: 'Reject Application?',
            html: `Reject team <strong>${app.teamName}</strong>?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Reject',
            cancelButtonText: 'Cancel',
        });
        if (!result.isConfirmed) return;

        setActionLoading(app.id);
        try {
            await applicationService.rejectApplication(app.id);
            Swal.fire({ icon: 'success', title: 'Rejected', text: `Application from team ${app.teamName} has been rejected.`, timer: 2000, showConfirmButton: false });
            fetchApplications();
        } catch (err: unknown) {
            const axiosMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            Swal.fire({ icon: 'error', title: 'Error', text: axiosMsg || 'Failed to reject application.' });
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('vi-VN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const breadcrumbItems = [
        { label: 'Home', to: '/home' },
        { label: 'Assignment Review' },
    ];

    const thesisOptions = theses.map(t => ({ label: t.title, value: t.thesisId }));

    return (
        <div className="p-6 lg:p-10 font-sans text-gray-800">
            <div className="mb-6">
                <PremiumBreadcrumb items={breadcrumbItems} />
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Assignment Review
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Review and assign thesis requests from student teams.
                    </p>
                </div>
            </div>

            {/* Thesis Selector + Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Thesis Dropdown */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1.5">Thesis</label>
                        <Dropdown
                            value={selectedThesisId}
                            options={thesisOptions}
                            onChange={(e) => { setSelectedThesisId(e.value); setPage(1); }}
                            placeholder={thesesLoading ? "Loading..." : (thesisOptions.length === 0 ? "No published thesis" : "Select a thesis")}
                            disabled={thesesLoading || thesisOptions.length === 0}
                            className="w-full border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-sm text-slate-900"
                            pt={{
                                root: { className: 'h-[42px] flex items-center shadow-none' },
                                input: { className: 'font-medium py-0 px-3' },
                                trigger: { className: 'px-3' }
                            }}
                        />
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1.5">Status</label>
                        <Dropdown
                            value={statusFilter}
                            options={FILTER_STATUSES}
                            onChange={(e) => { setStatusFilter(e.value); setPage(1); }}
                            placeholder="Filter Status"
                            className="w-full border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-sm text-slate-900"
                            pt={{
                                root: { className: 'h-[42px] flex items-center shadow-none' },
                                input: { className: 'font-medium py-0 px-3' },
                                trigger: { className: 'px-3' }
                            }}
                        />
                    </div>

                    {/* Search */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1.5">Search Team</label>
                        <div className="relative">
                            <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                            <input
                                type="text"
                                placeholder="Search by team name..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="w-full pl-9 pr-3 py-[9px] border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse">
                            <div className="h-5 bg-slate-200 rounded w-1/3 mb-3" />
                            <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
                            <div className="h-3 bg-slate-100 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : !data || data.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <i className="pi pi-inbox text-4xl text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">No assignments found</h3>
                    <p className="text-slate-400 text-sm">
                        No team has requested this thesis assignment yet.
                    </p>
                </div>
            ) : (
                <>
                    {/* Application Cards */}
                    <div className="space-y-4">
                        {data.items.map((app) => {
                            const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.Pending;
                            const isActing = actionLoading === app.id;

                            return (
                                <div
                                    key={app.id}
                                    className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                                >
                                    <div className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            {/* Team Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="size-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                                                        <i className="pi pi-users" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-slate-900 font-bold text-base">{app.teamName}</h3>
                                                        <p className="text-slate-400 text-xs">{app.teamCode} · Leader: {app.leaderName}</p>
                                                    </div>
                                                    <span className={`ml-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}>
                                                        <i className={`${statusCfg.icon} text-[10px]`} />
                                                        {statusCfg.label}
                                                    </span>
                                                </div>

                                                {/* Members */}
                                                <div className="ml-13">
                                                    <p className="text-xs text-slate-500 font-semibold mb-2">
                                                        Members ({app.members?.length || 0})
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {app.members?.map((m) => (
                                                            <span
                                                                key={m.studentId}
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600"
                                                            >
                                                                <i className="pi pi-user text-[10px] text-slate-400" />
                                                                {m.fullName}
                                                                <span className="text-slate-400">({m.studentCode})</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Date */}
                                                <div className="flex items-center text-xs text-slate-400 gap-1 mt-3 ml-13">
                                                    <i className="pi pi-calendar text-xs" />
                                                    <span>Applied {formatDate(app.createdAt)}</span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {app.status === 'Pending' && (
                                                <div className="flex md:flex-col gap-2 shrink-0">
                                                    <button
                                                        onClick={() => handleApprove(app)}
                                                        disabled={isActing}
                                                        className="px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl cursor-pointer hover:bg-emerald-600 transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isActing ? <i className="pi pi-spin pi-spinner" /> : <><i className="pi pi-check mr-1.5" />Approve</>}
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(app)}
                                                        disabled={isActing}
                                                        className="px-5 py-2.5 border-2 border-red-400 text-red-500 font-bold rounded-xl cursor-pointer hover:bg-red-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <i className="pi pi-times mr-1.5" />Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {data.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <i className="pi pi-chevron-left text-xs mr-1" />Prev
                            </button>
                            <span className="text-sm text-slate-500 px-3">
                                Page {data.page} of {data.totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                                disabled={page >= data.totalPages}
                                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                Next<i className="pi pi-chevron-right text-xs ml-1" />
                            </button>
                        </div>
                    )}

                    {/* Summary */}
                    <p className="text-center text-xs text-slate-400 mt-3">
                        Total {data.totalCount} assignment{data.totalCount !== 1 ? 's' : ''}
                    </p>
                </>
            )}
        </div>
    );
};

export default ApplicationReviewPage;
