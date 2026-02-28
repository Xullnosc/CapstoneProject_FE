import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Thesis } from '../../types/thesis';
import { thesisService } from '../../services/thesisService';
import { authService } from '../../services/authService';
import ThesisStatusBadge from '../../components/Thesis/ThesisStatusBadge';
import ThesisHistoryTable from '../../components/Thesis/ThesisHistoryTable';
import UpdateThesisModal from '../../components/Thesis/UpdateThesisModal';

const ThesisDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = authService.getUser();
    const isStudent = user?.roleName === 'Student';
    const isReviewer = (user as { isReviewer?: boolean } | null)?.isReviewer === true;

    const [thesis, setThesis] = useState<Thesis | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);

    const fetchThesis = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const data = await thesisService.getThesisById(id);
            setThesis(data);
        } catch (err) {
            console.error('Failed to fetch thesis detail', err);
            setError('Could not load thesis details. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchThesis();
    }, [fetchThesis]);

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

    // Determine latest version from histories
    const latestVersion = thesis?.histories?.length
        ? Math.max(...thesis.histories.map(h => h.versionNumber))
        : null;

    // Submission date: upDate or updateDate
    const submissionDateStr = thesis?.upDate ?? thesis?.updateDate;

    // ─── Loading ─────────────────────────────────────────────────────────────
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

    // ─── Error ────────────────────────────────────────────────────────────────
    if (error || !thesis) {
        return (
            <div className="flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-200 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="pi pi-exclamation-circle text-red-500 text-3xl" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Thesis not found</h2>
                    <p className="text-gray-500 text-sm mb-6">{error}</p>
                    <button
                        onClick={() => navigate(isReviewer ? '/review-thesis' : '/my-thesis')}
                        className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                    >
                        {isReviewer ? 'Back to Review Thesis' : 'Back to My Thesis'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-10 font-sans text-gray-800">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <nav className="flex text-sm text-slate-500">
                        <Link to={isReviewer ? '/review-thesis' : '/my-thesis'} className="hover:text-primary transition-colors cursor-pointer">
                            {isReviewer ? 'Review Thesis' : 'My Thesis'}
                        </Link>
                        <span className="mx-2">/</span>
                        <span className="text-primary font-medium">Detail</span>
                    </nav>
                    <div className="hidden sm:block">
                        <ThesisStatusBadge status={thesis.status} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ── Main content ─────────────────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Title + Description + PDF Preview */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-2xl font-bold text-slate-900 leading-tight flex-1 pr-4">
                                    {thesis.title}
                                </h2>
                                <div className="sm:hidden">
                                    <ThesisStatusBadge status={thesis.status} />
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Description */}
                                <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                        Description
                                    </h3>
                                    <p className="text-slate-600 leading-relaxed text-sm">
                                        {thesis.shortDescription ?? 'No description provided.'}
                                    </p>
                                </div>

                                {/* PDF Preview */}
                                <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                        Document Preview
                                    </h3>
                                    <div
                                        className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50/50 transition-all hover:border-primary/50 group cursor-pointer"
                                        onClick={() => thesis.fileUrl && window.open(thesis.fileUrl, '_blank')}
                                    >
                                        <i className="pi pi-file-pdf text-5xl text-slate-300 group-hover:text-primary mb-3 transition-colors" />
                                        {thesis.fileUrl ? (
                                            <>
                                                <p className="font-medium text-slate-700 mb-1 text-sm">
                                                    {`thesis_v${latestVersion ?? 1}.pdf`}
                                                </p>
                                                {latestVersion && (
                                                    <p className="text-xs text-slate-400 mb-4">Version {latestVersion}</p>
                                                )}
                                                <a
                                                    href={thesis.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-primary font-semibold text-sm hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <span>Open in new tab</span>
                                                    <i className="pi pi-external-link text-xs" />
                                                </a>
                                            </>
                                        ) : (
                                            <p className="text-slate-400 text-sm">No file uploaded yet</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Version History */}
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-900">Version History</h3>
                                <span className="text-xs text-slate-400">
                                    {thesis.histories?.length ?? 0} total versions
                                </span>
                            </div>
                            <ThesisHistoryTable histories={thesis.histories ?? []} />
                        </div>
                    </div>

                    {/* ── Sidebar ──────────────────────────────────────── */}
                    <div className="space-y-6">
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">
                                Submission Details
                            </h3>

                            <div className="space-y-6">
                                {/* Submitted by */}
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-full overflow-hidden bg-orange-100 flex-shrink-0 flex items-center justify-center text-orange-600 font-bold text-lg">
                                        {thesis.ownerName?.charAt(0).toUpperCase() ?? 'S'}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium">Submitted By</p>
                                        <p className="font-bold text-slate-900">{thesis.ownerName ?? '—'}</p>
                                        {thesis.ownerEmail && (
                                            <p className="text-xs text-slate-500">{thesis.ownerEmail}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Submission date */}
                                <div className="flex items-center gap-4 border-t border-slate-200 pt-6">
                                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <i className="pi pi-calendar" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium">Submission Date</p>
                                        <p className="font-bold text-slate-900">{formatDate(submissionDateStr)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Upload new version button (students only) */}
                            {isStudent && (
                                <div className="mt-8">
                                    <button
                                        onClick={() => setUploadModalVisible(true)}
                                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <i className="pi pi-cloud-upload" />
                                        <span>Upload New Version</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Next Steps info box */}
                        <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                            <h4 className="font-bold text-primary mb-2 flex items-center gap-2 text-sm">
                                <i className="pi pi-info-circle text-sm" />
                                Next Steps
                            </h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {thesis.status === 'Reviewing'
                                    ? 'Your thesis is currently under review. You will be notified once feedback is available.'
                                    : thesis.status === 'Need Update'
                                        ? 'Your lecturer has requested updates. Please upload a revised version.'
                                        : thesis.status === 'Rejected'
                                            ? 'Your thesis was not approved. Please review feedback and consider revising.'
                                            : thesis.status === 'Published'
                                                ? 'Your thesis has been published. Congratulations!'
                                                : thesis.status === 'Registered'
                                                    ? 'Your thesis has been registered and is awaiting review.'
                                                    : 'Keep track of your thesis status here.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Modal */}
            <UpdateThesisModal
                visible={uploadModalVisible}
                thesis={thesis}
                onHide={() => setUploadModalVisible(false)}
                onSuccess={fetchThesis}
            />
        </div>
    );
};

export default ThesisDetailPage;
