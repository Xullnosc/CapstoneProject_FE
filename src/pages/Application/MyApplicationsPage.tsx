import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Application } from '../../types/application';
import { applicationService } from '../../services/applicationService';
import PremiumBreadcrumb from '../../components/Common/PremiumBreadcrumb';
import MemberAvatar from '../../components/team/MemberAvatar';
import { authService } from '../../services/authService';
import Swal from '../../utils/swal';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: string }> = {
    Pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'pi pi-clock' },
    Approved: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'pi pi-check-circle' },
    Rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'pi pi-times-circle' },
    Cancelled: { label: 'Cancelled', bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', icon: 'pi pi-ban' },
};

const MyApplicationsPage = () => {
    const navigate = useNavigate();
    const user = authService.getUser();
    const hasTeam = user?.hasTeam;
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        try {
            const data = await applicationService.getMyApplications();
            setApplications(data);
        } catch (err) {
            console.error('Failed to fetch applications', err);
            setApplications([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const handleCancel = async (app: Application) => {
        const result = await Swal.fire({
            title: 'Cancel Application?',
            html: `Are you sure you want to cancel your application for <strong>"${app.thesisTitle}"</strong>?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, cancel it',
            cancelButtonText: 'No, keep it',
        });

        if (!result.isConfirmed) return;

        try {
            await applicationService.cancelApplication(app.id);
            Swal.fire({
                icon: 'success',
                title: 'Cancelled',
                text: 'Your application has been cancelled.',
                timer: 2000,
                showConfirmButton: false,
            });
            fetchApplications();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to cancel application.';
            const axiosMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: axiosMsg || message,
            });
        }
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const breadcrumbItems = [
        { label: 'Home', to: '/home' },
        { label: 'Thesis Assignments' },
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
                        Thesis Assignments
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Track the status of your team's thesis assignments.
                    </p>
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
            ) : applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <i className={`${!hasTeam ? 'pi pi-users' : 'pi pi-inbox'} text-4xl text-slate-300`} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">
                        {!hasTeam ? 'No Team Yet' : 'No assignments yet'}
                    </h3>
                    <p className="text-slate-400 text-sm">
                        {!hasTeam 
                            ? 'You don’t have a team yet. Please create or join a team first.' 
                            : "Your team hasn't submitted any thesis assignments yet."}
                    </p>
                    <button
                        onClick={() => navigate(!hasTeam ? '/teams' : '/published-thesis')}
                        className="mt-6 px-6 py-3 bg-orange-500 text-white font-bold rounded-xl cursor-pointer hover:bg-orange-600 transition-colors shadow-sm text-sm"
                    >
                        {!hasTeam ? 'Go to Team Management' : 'Browse Available Theses'}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {applications.map((app) => {
                        const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.Pending;
                        return (
                            <div
                                key={app.id}
                                className="bg-white border rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
                            >
                                <div className="p-6 flex-1">
                                    {/* Header with Status */}
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <h3 className="text-slate-900 font-bold text-base leading-snug line-clamp-2 flex-1">
                                            {app.thesisTitle || 'Untitled Thesis'}
                                        </h3>
                                        <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}>
                                            <i className={`${statusCfg.icon} text-[10px]`} />
                                            {statusCfg.label}
                                        </span>
                                    </div>

                                    {/* Thesis Owner */}
                                    {app.thesisOwnerName && (
                                        <div className="flex items-center gap-2 mb-3">
                                            <MemberAvatar
                                                email={""}
                                                fullName={app.thesisOwnerName ?? "Author"}
                                                avatarUrl={app.thesisOwnerAvatar ?? undefined}
                                                className="size-7 rounded-full shrink-0"
                                            />
                                            <p className="text-slate-700 text-sm font-medium">{app.thesisOwnerName}</p>
                                        </div>
                                    )}

                                    {/* Team Name */}
                                    {app.teamName && (
                                        <div className="flex items-center gap-2 mb-3 text-sm text-slate-500">
                                            <i className="pi pi-users text-xs" />
                                            <span>{app.teamName}</span>
                                        </div>
                                    )}

                                    {/* Date */}
                                    <div className="flex items-center text-xs text-slate-400 gap-1 mt-auto">
                                        <i className="pi pi-calendar text-xs" />
                                        <span>Applied {formatDate(app.createdAt)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="px-6 pb-6 pt-2 flex gap-3">
                                    <button
                                        onClick={() => navigate(`/thesis/${app.thesisId}`)}
                                        className="flex-1 py-2.5 border-2 border-orange-500 text-orange-600 font-bold rounded-xl cursor-pointer hover:bg-orange-50 transition-colors text-sm"
                                    >
                                        View Thesis
                                    </button>
                                    {app.status === 'Pending' && (
                                        <button
                                            onClick={() => handleCancel(app)}
                                            className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl cursor-pointer hover:bg-red-600 transition-colors shadow-sm text-sm"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyApplicationsPage;
