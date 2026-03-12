import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Thesis } from '../../types/thesis';
import { thesisService } from '../../services/thesisService';
import { authService } from '../../services/authService';
import { teamService } from '../../services/teamService';
import ThesisStatusBadge from '../../components/Thesis/ThesisStatusBadge';
import ThesisHistoryTable from '../../components/Thesis/ThesisHistoryTable';
import UpdateThesisModal from '../../components/Thesis/UpdateThesisModal';
import ReviewSubmissionModal from '../../components/Thesis/ReviewSubmissionModal';
import PremiumBreadcrumb from '../../components/Common/PremiumBreadcrumb';
import { Button as PrimeButton } from 'primereact/button';
import type { SweetAlertResult } from 'sweetalert2';
import Swal from '../../utils/swal';
import styles from './Thesis.module.css';

const ThesisDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = authService.getUser();
    const isStudent = user?.roleName === 'Student';
    const isLecturer = user?.roleName === 'Lecturer';
    const isReviewer = (user as { isReviewer?: boolean } | null)?.isReviewer === true;
    const isHOD = user?.roleName === 'HOD' || user?.roleName === 'Head of Department';

    const [thesis, setThesis] = useState<Thesis | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [isLeader, setIsLeader] = useState(false);
    const [locking, setLocking] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [evaluating] = useState(false);

    const showSuccess = (message: string) => {
        Swal.fire({ icon: 'success', title: 'Success', text: message, timer: 3000, showConfirmButton: false });
    };

    const showError = (message: string) => {
        Swal.fire({ icon: 'error', title: 'Error', text: message });
    };

    const fetchThesis = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const data = await thesisService.getThesisById(id);
            setThesis(data);

            if (isStudent) {
                const team = await teamService.getMyTeam();
                const curUser = authService.getUser();
                if (team && curUser) {
                    const member = team.members.find(m => m.studentCode === curUser.studentCode);
                    if (member?.role === 'Leader') {
                        setIsLeader(true);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch thesis detail', err);
            setError('Could not load thesis details. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [id, isStudent]);

    useEffect(() => {
        fetchThesis();
    }, [fetchThesis]);

    const handleCancelClick = () => {
        Swal.fire({
            title: 'Cancel Proposal?',
            text: "Are you sure you want to cancel this thesis proposal? This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Yes, cancel it!'
        }).then((result: SweetAlertResult) => {
            if (result.isConfirmed) {
                executeCancel();
            }
        });
    };

    const executeCancel = async () => {
        if (!id) return;
        setCancelling(true);
        try {
            await thesisService.cancelThesis(id);
            showSuccess('Thesis proposal has been cancelled.');
            fetchThesis();
        } catch (err) {
            console.error('Failed to cancel thesis', err);
            const axiosError = err as { response?: { data?: { Message?: string } } };
            const message = axiosError.response?.data?.Message || 'Failed to cancel thesis.';
            showError(message);
        } finally {
            setCancelling(false);
        }
    };

    const handleToggleLockClick = () => {
        if (!thesis) return;
        Swal.fire({
            title: thesis.isLocked ? 'Unlock Thesis?' : 'Lock Thesis?',
            text: thesis.isLocked
                ? 'Unlocking will allow students to register for it once published.'
                : 'Locking will prevent students from registering, even if published.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: thesis.isLocked ? '#10b981' : '#f59e0b',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: thesis.isLocked ? 'Yes, Unlock' : 'Yes, Lock'
        }).then((result: SweetAlertResult) => {
            if (result.isConfirmed) {
                executeToggleLock();
            }
        });
    };

    const executeToggleLock = async () => {
        if (!id) return;
        setLocking(true);
        try {
            const updatedThesis = await thesisService.toggleThesisLock(id);
            showSuccess(`Thesis ${updatedThesis.isLocked ? 'locked' : 'unlocked'} successfully.`);
            await fetchThesis();
        } catch (err) {
            console.error('Failed to toggle lock', err);
            const axiosError = err as { response?: { data?: { Message?: string } } };
            const message = axiosError.response?.data?.Message || 'Failed to toggle thesis lock.';
            showError(message);
        } finally {
            setLocking(false);
        }
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const submissionDateStr = thesis?.upDate ?? thesis?.updateDate;


    if (loading) {
        return (
            <div className="p-6 lg:p-10">
                <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-48 mb-6" />
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 space-y-4">
                        <div className="h-8 bg-slate-200 rounded w-3/4" />
                        <div className="h-4 bg-slate-100 rounded w-full" />
                        <div className="h-4 bg-slate-100 rounded w-5/6" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !thesis) {
        return (
            <div className="flex items-center justify-center p-6 bg-slate-50 min-h-[60vh]">
                <div className="bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 max-w-md w-full text-center border border-slate-100">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="pi pi-exclamation-circle text-red-500 text-4xl" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Thesis not found</h2>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">{error}</p>
                    <button
                        onClick={() => navigate(isHOD || isReviewer ? '/thesis' : '/my-thesis')}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-sm"
                    >
                        Return to List
                    </button>
                </div>
            </div>
        );
    }

    const breadcrumbItems = [
        { label: isHOD || isReviewer ? 'Thesis Repository' : 'My Thesis', to: isHOD || isReviewer ? '/thesis' : '/my-thesis' },
        { label: 'Proposal Detail' }
    ];

    return (
        <div className={`p-6 lg:p-10 font-sans text-gray-800 bg-[#fafbfc] min-h-screen ${styles.thesisContainer}`}>
            <div className="max-w-5xl mx-auto">
                {/* Header Navigation */}
                <div className="flex items-center justify-between mb-8">
                    <PremiumBreadcrumb items={breadcrumbItems} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-4xl shadow-sm p-8 border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8">
                                <ThesisStatusBadge status={thesis.status} />
                            </div>

                            <h2 className="text-3xl font-black text-slate-900 mb-6 leading-tight pr-24">
                                {thesis.title}
                            </h2>

                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
                                        <i className="pi pi-align-left text-xs" />
                                        Abstract & Scope
                                    </h3>
                                    <p className="text-slate-600 leading-relaxed font-medium">
                                        {thesis.shortDescription ?? 'No description provided.'}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
                                        <i className="pi pi-file text-xs" />
                                        Research Document
                                    </h3>
                                    <div
                                        className="group relative border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center bg-slate-50/30 transition-all hover:bg-orange-50/10 hover:border-orange-200 cursor-pointer"
                                        onClick={() => thesis.fileUrl && window.open(thesis.fileUrl, '_blank')}
                                    >
                                        <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-orange-500 group-hover:shadow-orange-100 transition-all mb-4">
                                            <i className="pi pi-file-pdf text-4xl" />
                                        </div>
                                        {thesis.fileUrl ? (
                                            <>
                                                <p className="font-bold text-slate-800 mb-1 text-sm group-hover:text-orange-600 transition-colors">
                                                    Open Proposal PDF
                                                </p>
                                                <span className="text-primary font-bold text-xs flex items-center gap-1">
                                                    View in Browser <i className="pi pi-external-link text-[10px]" />
                                                </span>
                                            </>
                                        ) : (
                                            <p className="text-slate-400 text-sm font-bold">No file uploaded</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-4xl shadow-sm overflow-hidden border border-slate-100">
                            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                <h3 className="font-black text-slate-900 tracking-tight">Reviewer Feedback</h3>
                                <div className="px-3 py-1 bg-orange-100 rounded-full text-[10px] font-black text-orange-600 uppercase">
                                    Official Evaluation
                                </div>
                            </div>
                            <div className="p-8 space-y-6">
                                {(!thesis.reviews || thesis.reviews.length === 0) ? (
                                    <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-slate-400 text-sm font-medium">Evaluation in progress. Waiting for reviewers...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {thesis.reviews.map((rev, idx) => (
                                            <div key={rev.reviewId} className="p-6 bg-white rounded-3xl border-2 border-slate-50 shadow-sm transition-all hover:border-slate-100">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Reviewer {idx + 1}</p>
                                                        <p className="text-sm font-black text-slate-800">{rev.reviewerName || `Lecturer ${idx + 1}`}</p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${rev.status === 'Approve' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {rev.status}
                                                    </span>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="p-4 bg-slate-50 rounded-2xl relative">
                                                        <i className="pi pi-quote-right absolute top-2 right-2 text-slate-200 text-xl" />
                                                        <p className="text-slate-600 text-xs leading-relaxed italic font-medium">
                                                            {rev.comment || 'No specific comments provided.'}
                                                        </p>
                                                    </div>

                                                    {rev.fileUrl && (
                                                        <button
                                                            onClick={() => window.open(rev.fileUrl!, '_blank')}
                                                            className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                                                                <i className="pi pi-file-pdf" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Feedback Attachment</p>
                                                                <p className="text-xs font-bold text-slate-700 truncate max-w-37.5">Open Guidelines</p>
                                                            </div>
                                                        </button>
                                                    )}

                                                    <div className="pt-2 border-t border-slate-100">
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase text-right">
                                                            Evaluated on {formatDate(rev.reviewDate)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Version History */}
                        <div className="bg-white rounded-4xl shadow-sm overflow-hidden border border-slate-100">
                            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                <h3 className="font-black text-slate-900 tracking-tight">Iteration Log</h3>
                                <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase">
                                    {thesis.histories?.length ?? 0} Phases
                                </div>
                            </div>
                            <ThesisHistoryTable histories={thesis.histories ?? []} />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-4xl p-8 border border-slate-100 shadow-sm sticky top-8">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Metadata</h3>

                            <div className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-lg shadow-slate-200">
                                        {thesis.ownerName?.charAt(0).toUpperCase() ?? 'S'}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Submitted By</p>
                                        <p className="font-bold text-slate-900">{thesis.ownerName ?? '—'}</p>
                                        <p className="text-xs text-slate-500 font-medium">{thesis.ownerEmail || 'No contact provided'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                                        <i className="pi pi-calendar-plus text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Submission Date</p>
                                        <p className="font-bold text-slate-900">{formatDate(submissionDateStr)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Reviewer Actions */}
                            {/* Reviewer Actions - Don't show if user is the owner (unless owner is Lecturer) or already reviewed */}
                            {(() => {
                                const hasReviewed = thesis.reviews?.some(rev => rev.reviewerId === user?.userId);
                                const isOwner = thesis.userId === user?.userId;
                                // Only block if user is owner AND NOT a lecturer
                                const canEvaluate = isReviewer && thesis.status === 'Reviewing' && (!isOwner || isLecturer) && !hasReviewed;

                                if (canEvaluate) {
                                    return (
                                        <div className="mt-10 pt-10 border-t border-slate-100">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5">Decision Center</h3>
                                            <PrimeButton
                                                label="Submit My Evaluation"
                                                icon="pi pi-check-square"
                                                onClick={() => setReviewModalVisible(true)}
                                                loading={evaluating}
                                                className="p-button-sm p-button-orange w-full font-bold uppercase tracking-wider py-3"
                                                style={{ backgroundColor: '#f26f21', borderColor: '#f26f21' }}
                                            />
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            {(isLecturer || isHOD) && thesis.userId === user?.userId && (
                                <div className="mt-10 pt-10 border-t border-slate-100">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5">Access Management</h3>
                                    <PrimeButton
                                        label={thesis.isLocked ? 'Release Lock' : 'Enable Lock'}
                                        icon={thesis.isLocked ? 'pi pi-lock-open' : 'pi pi-lock'}
                                        onClick={handleToggleLockClick}
                                        loading={locking}
                                        className={`p-button-sm w-full font-bold uppercase tracking-wider py-3 ${thesis.isLocked ? 'p-button-success' : 'p-button-warning'}`}
                                    />
                                </div>
                            )}

                            {isStudent && isLeader && (thesis.status === 'Reviewing' || thesis.status === 'Registered' || thesis.status === 'On Mentor Inviting' || thesis.status === 'Need Update') && (
                                <div className="mt-8">
                                    <PrimeButton
                                        label={cancelling ? 'Cancelling...' : 'Revoke Proposal'}
                                        icon="pi pi-trash"
                                        onClick={handleCancelClick}
                                        loading={cancelling}
                                        className="p-button-sm p-button-danger p-button-text w-full font-bold uppercase tracking-wider"
                                    />
                                </div>
                            )}

                            {isStudent && (
                                <PrimeButton
                                    label="Submit Revision"
                                    icon="pi pi-upload"
                                    onClick={() => setUploadModalVisible(true)}
                                    className="p-button-sm p-button-orange w-full font-bold uppercase tracking-wider py-3 mt-4"
                                    style={{ backgroundColor: '#f26f21', borderColor: '#f26f21' }}
                                />
                            )}

                            {/* Info Context */}
                            <div className="mt-10 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                    <i className="pi pi-info-circle mr-1" />
                                    {isReviewer
                                        ? 'Reviewers should evaluate proposals based on academic rigor and technical feasibility.'
                                        : 'Status updates will be reflected in your Iteration Log automatically.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <UpdateThesisModal
                visible={uploadModalVisible}
                thesis={thesis}
                onHide={() => setUploadModalVisible(false)}
                onSuccess={fetchThesis}
            />

            <ReviewSubmissionModal
                visible={reviewModalVisible}
                thesisId={id || ''}
                onHide={() => setReviewModalVisible(false)}
                onSuccess={fetchThesis}
            />
        </div>
    );
};

export default ThesisDetailPage;
