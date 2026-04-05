import { useEffect, useState, useCallback } from 'react';
import { AxiosError } from 'axios';
import { useSearchParams } from 'react-router-dom';
import { semesterService, type Semester, type PagedResult, type Whitelist } from '../../services/semesterService';
import { thesisFormService } from '../../services/thesisFormService';
import { authService } from '../../services/authService';
import { calculateSemesterStatus, getSemesterSeason } from '../../utils/semesterHelpers';
import { SEMESTER_STATUS_COLORS } from '../../constants/semesterConstants';
import Swal from '../../utils/swal';

import PremiumBreadcrumb from '../../components/Common/PremiumBreadcrumb';
import SemesterStats from '../../components/Semester/SemesterStats';
import SemesterTeamsTable from '../../components/Semester/SemesterTeamsTable';
import SemesterWhitelistsTable from '../../components/Semester/SemesterWhitelistsTable';
import SemesterModal from '../../components/Semester/SemesterModal';
import ReviewerModal from '../../components/Semester/ReviewerModal';
import ImportWhitelistModal from '../../components/Semester/ImportWhitelistModal';
import WhitelistStudentModal from '../../components/Semester/WhitelistStudentModal';
import ForceCreateTeamModal from '../../components/Semester/ForceCreateTeamModal';
import ThesisFormModal from '../../components/Thesis/ThesisFormModal';
import ThesisFormVersionsModal from '../../components/Thesis/ThesisFormVersionsModal';
import type { ThesisForm } from '../../types/thesisForm';

type SemesterSeasonName = 'Spring' | 'Summer' | 'Fall';

const SEASON_HEADER_THEME: Record<SemesterSeasonName, { container: string; orbPrimary: string; orbSecondary: string }> = {
    Spring: {
        container: 'bg-gradient-to-br from-emerald-200 via-green-200 to-teal-200 border-emerald-300',
        orbPrimary: 'bg-emerald-500/45',
        orbSecondary: 'bg-teal-400/45'
    },
    Summer: {
        container: 'bg-gradient-to-br from-yellow-200 via-amber-200 to-orange-200 border-amber-300',
        orbPrimary: 'bg-amber-500/45',
        orbSecondary: 'bg-yellow-400/45'
    },
    Fall: {
        container: 'bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200 border-orange-300',
        orbPrimary: 'bg-orange-500/45',
        orbSecondary: 'bg-amber-400/45'
    }
};

const SEASON_HEADER_ICON: Record<SemesterSeasonName, { icon: string; className: string }> = {
    Spring: {
        icon: 'local_florist',
        className: 'text-emerald-700 bg-emerald-100/90 border-emerald-200'
    },
    Summer: {
        icon: 'light_mode',
        className: 'text-amber-700 bg-amber-100/90 border-amber-200'
    },
    Fall: {
        icon: 'eco',
        className: 'text-orange-700 bg-orange-100/90 border-orange-200'
    }
};

const renderHeaderSeasonDecoration = (semesterSeason: SemesterSeasonName) => {
    if (semesterSeason === 'Spring') {
        return (
            <svg className="absolute -left-10 -bottom-10 text-emerald-400/30 w-72 h-72 -rotate-12 animate-pulse [animation-duration:5s]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12,22C12,22 4,16 4,10C4,5 8,2 12,2C16,2 20,5 20,10C20,16 12,22 12,22M12,19.2C13.84,17.2 18,13.62 18,10C18,6.37 15.65,4 12,4C8.35,4 6,6.37 6,10C6,13.62 10.16,17.2 12,19.2Z"></path>
            </svg>
        );
    }

    if (semesterSeason === 'Summer') {
        return (
            <svg className="absolute -left-10 -top-10 text-yellow-500/30 w-80 h-80 animate-[spin_32s_linear_infinite]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,5.29C7.24,6.03 7.1,6.84 7.1,7.66C7.1,8.47 7.24,9.28 7.5,10.03L3.34,8.31V7M3.34,17L7.5,15.29C7.24,16.03 7.1,16.84 7.1,17.66C7.1,18.47 7.24,19.28 7.5,20.03L3.34,18.31V17M12,22L9.61,18.58C10.35,18.85 11.16,19 12,19C12.84,19 13.65,18.85 14.39,18.58L12,22M20.66,17L16.5,15.29C16.76,16.03 16.9,16.84 16.9,17.66C16.9,18.47 16.76,19.28 16.5,20.03L20.66,18.31V17M20.66,7L16.5,5.29C16.76,6.03 16.9,6.84 16.9,7.66C16.9,8.47 16.76,9.28 16.5,10.03L20.66,8.31V7Z"></path>
            </svg>
        );
    }

    return (
        <svg className="absolute -right-10 -bottom-8 text-orange-700/25 w-80 h-80 rotate-12 animate-pulse [animation-duration:5.5s]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"></path>
        </svg>
    );
};

const SemesterDetailPage = () => {
    const [searchParams] = useSearchParams();
    const semesterId = Number(searchParams.get('id'));
    const user = authService.getUser();
    const canManage = user?.roleName === 'HOD' || user?.roleName === 'Admin';
    const canPropose = user?.roleName === 'Student' || user?.roleName === 'Lecturer';

    const [semester, setSemester] = useState<Semester | null>(null);
    const [loading, setLoading] = useState(true);
    const [latestForm, setLatestForm] = useState<ThesisForm | null>(null);
    const [activeTab, setActiveTab] = useState<'whitelists' | 'lecturers' | 'students' | 'teams' | 'orphaned'>('whitelists');
    const [showWarning, setShowWarning] = useState(true);

    // Whitelist pagination states
    const [whitelistData, setWhitelistData] = useState<PagedResult<Whitelist> | null>(null);
    const [lecturerData, setLecturerData] = useState<PagedResult<Whitelist> | null>(null);
    const [studentData, setStudentData] = useState<PagedResult<Whitelist> | null>(null);
    const [isWhitelistsLoading, setIsWhitelistsLoading] = useState(false);

    // Orphaned students state
    const [orphanedData, setOrphanedData] = useState<PagedResult<Whitelist> | null>(null);
    const [isForceCreateOpen, setIsForceCreateOpen] = useState(false);
    const [isOrphanedLoading, setIsOrphanedLoading] = useState(false);

    const [whitelistPage, setWhitelistPage] = useState(1);
    const [lecturerPage, setLecturerPage] = useState(1);
    const [studentPage, setStudentPage] = useState(1);
    const [orphanedPage, setOrphanedPage] = useState(1);
    const pageSize = 10;

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isReviewerModalOpen, setIsReviewerModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    const [isThesisFormModalOpen, setIsThesisFormModalOpen] = useState(false);
    const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Whitelist | null>(null);

    const fetchSemesterDetail = useCallback(async () => {
        if (!semesterId) return;
        try {
            setLoading(true);
            const data = await semesterService.getSemesterById(semesterId);
            setSemester(data);
        } catch (error) {
            console.error('Failed to fetch semester detail', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load semester details' });
        } finally {
            setLoading(false);
        }
    }, [semesterId]);

    const fetchLatestForm = useCallback(async () => {
        try {
            const response = await thesisFormService.getLatestForm();
            setLatestForm(response.data);
        } catch (error) {
            console.error('Failed to fetch latest thesis form', error);
        }
    }, []);

    const fetchWhitelists = useCallback(async (role?: string) => {
        if (!semesterId) return;
        try {
            setIsWhitelistsLoading(true);
            let page = 1;
            if (role === 'Lecturer') page = lecturerPage;
            else if (role === 'Student') page = studentPage;
            else page = whitelistPage;

            const data = await semesterService.getWhitelistsPaginated(semesterId, {
                page,
                pageSize,
                role: role || undefined,
                search: debouncedSearch || undefined
            });

            if (role === 'Lecturer') setLecturerData(data);
            else if (role === 'Student') setStudentData(data);
            else setWhitelistData(data);
        } catch (error) {
            console.error('Failed to fetch whitelists', error);
        } finally {
            setIsWhitelistsLoading(false);
        }
    }, [semesterId, whitelistPage, lecturerPage, studentPage, debouncedSearch]);

    useEffect(() => {
        fetchSemesterDetail();
        fetchLatestForm();
    }, [fetchSemesterDetail, fetchLatestForm]);

    const fetchOrphanedStudents = useCallback(async () => {
        if (!semesterId) return;
        try {
            setIsOrphanedLoading(true);
            const data = await semesterService.getOrphanedStudents(semesterId, orphanedPage, pageSize, debouncedSearch || undefined);
            setOrphanedData(data);
        } catch (error) {
            console.error('Failed to fetch orphaned students', error);
        } finally {
            setIsOrphanedLoading(false);
        }
    }, [semesterId, orphanedPage, debouncedSearch]);

    useEffect(() => {
        if (activeTab === 'orphaned') {
            fetchOrphanedStudents();
            return;
        }
        const role = activeTab === 'lecturers' ? 'Lecturer' : activeTab === 'students' ? 'Student' : undefined;
        if (activeTab !== 'teams') {
            fetchWhitelists(role);
        }
    }, [activeTab, fetchWhitelists, fetchOrphanedStudents]);

    // Handle debounced search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            // Reset pages to 1 when search term changes
            setWhitelistPage(1);
            setLecturerPage(1);
            setStudentPage(1);
            setOrphanedPage(1);
        }, 500);

        return () => clearTimeout(handler);
    }, [searchTerm]);


    const handleStartSemester = async () => {
        if (!semester) return;
        const result = await Swal.fire({
            title: 'Start Semester?',
            text: "This will allow students and lecturers to propose theses.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Yes, Start'
        });

        if (result.isConfirmed) {
            try {
                await semesterService.startSemester(semester.semesterId);
                Swal.fire({ icon: 'success', title: 'Started!', text: 'Semester is now Active.' });
                fetchSemesterDetail();
            } catch (error) {
                console.error('Failed to start semester', error);
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to start semester' });
            }
        }
    };

    const handleLockSubmission = async () => {
        if (!semester) return;
        const result = await Swal.fire({
            title: 'Lock Submissions?',
            text: "Students will no longer be able to propose new theses. Ongoing proposals can still be updated.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            confirmButtonText: 'Yes, Lock Submissions'
        });

        if (result.isConfirmed) {
            try {
                await semesterService.lockSubmission(semester.semesterId);
                Swal.fire({ icon: 'success', title: 'Locked!', text: 'Thesis submissions are now locked.' });
                fetchSemesterDetail();
            } catch (err: unknown) {
                const error = err as AxiosError<{ message?: string }>;
                console.error('Failed to lock submissions', error);
                const errorMessage = error.response?.data?.message || error.message || 'Failed to lock submissions';
                Swal.fire({ icon: 'error', title: 'Error', text: errorMessage });
            }
        }
    };

    const handleLockUpdates = async () => {
        if (!semester) return;
        const result = await Swal.fire({
            title: 'Lock All Updates?',
            text: "This will prevent ALL updates to teams and theses. This is a hard lock before closing the semester.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#8b5cf6',
            confirmButtonText: 'Yes, Lock All'
        });

        if (result.isConfirmed) {
            try {
                await semesterService.lockAllUpdates(semester.semesterId);
                Swal.fire({ icon: 'success', title: 'Locked!', text: 'All updates are now locked.' });
                fetchSemesterDetail();
            } catch (err: unknown) {
                const error = err as AxiosError<{ message?: string }>;
                console.error('Failed to lock updates', error);
                const errorMessage = error.response?.data?.message || error.message || 'Failed to lock updates';
                Swal.fire({ icon: 'error', title: 'Error', text: errorMessage });
            }
        }
    };

    const handleCloseSemester = async () => {
        if (!semester) return;
        const result = await Swal.fire({
            title: 'Close Semester?',
            text: "Closing the semester is irreversible. The semester will be moved to history/read-only mode.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, Close Semester'
        });

        if (result.isConfirmed) {
            try {
                await semesterService.closeSemester(semester.semesterId);
                Swal.fire({ icon: 'success', title: 'Closed!', text: 'Semester has been closed.' });
                fetchSemesterDetail();
            } catch (err: unknown) {
                const error = err as AxiosError<{ message?: string }>;
                console.error('Failed to close semester', error);
                const errorMessage = error.response?.data?.message || error.message || 'Failed to close semester';
                Swal.fire({ icon: 'error', title: 'Error', text: errorMessage });
            }
        }
    };

    const handleEditSuccess = () => {
        setIsEditModalOpen(false);
        fetchSemesterDetail();
    };

    const refreshActiveTab = () => {
        const role = activeTab === 'lecturers' ? 'Lecturer' : activeTab === 'students' ? 'Student' : undefined;
        fetchWhitelists(role);
        fetchSemesterDetail();
    };

    if (loading || !semester) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    const semesterStatus = calculateSemesterStatus(semester.status);
    const isClosed = semester.status === 'Closed';
    const isUpcoming = semester.status === 'Upcoming';
    const isActive = semester.status === 'Active';
    const isReviewThesis = semester.status === 'Review Thesis';
    const isReviewMiddle = semester.status === 'Review Middle Semester';

    // UI flags
    const isEnded = isClosed;
    const isOngoing = isActive || isReviewThesis || isReviewMiddle;
    const semesterSeason = getSemesterSeason(semester.semesterName) as SemesterSeasonName;
    const headerTheme = SEASON_HEADER_THEME[semesterSeason] || SEASON_HEADER_THEME.Fall;
    const headerSeasonIcon = SEASON_HEADER_ICON[semesterSeason] || SEASON_HEADER_ICON.Fall;
    const semesterStatusColors = SEMESTER_STATUS_COLORS[semesterStatus];

    const breadcrumbItems = [
        { label: 'Home', to: '/home' },
        { label: 'Semesters', to: '/semesters' },
        { label: `${semester.semesterName} Detail` }
    ];

    return (
        <div className="min-h-screen bg-white">
            <main className="max-w-[1200px] mx-auto w-full px-6 py-6">

                {/* Breadcrumb */}
                <div className="mb-6">
                    <PremiumBreadcrumb items={breadcrumbItems} />
                </div>

                {/* Header Section */}
                <div className={`group relative overflow-hidden rounded-3xl border p-8 mb-8 shadow-lg ${isEnded ? 'bg-gradient-to-br from-slate-100 via-gray-100 to-zinc-100 border-gray-300' : headerTheme.container}`}>
                    {isEnded && (
                        <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${headerTheme.container}`}></div>
                    )}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className={`absolute -top-10 -right-10 w-[600px] h-[600px] rounded-full blur-3xl ${isEnded ? 'bg-slate-300/35 transition-all duration-300 group-hover:bg-transparent' : headerTheme.orbPrimary}`}></div>
                        <div className={`absolute top-20 right-20 w-[400px] h-[400px] rounded-full blur-3xl ${isEnded ? 'bg-gray-300/40 transition-all duration-300 group-hover:bg-transparent' : headerTheme.orbSecondary}`}></div>
                        {renderHeaderSeasonDecoration(semesterSeason)}
                    </div>

                    <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                        <div className={`inline-flex items-center justify-center rounded-xl border p-2 shadow-sm ${headerSeasonIcon.className}`}>
                            <span className="material-symbols-outlined text-[20px]">{headerSeasonIcon.icon}</span>
                        </div>
                        {canManage && !isEnded && !isOngoing && (
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white/90 p-2 text-gray-700 shadow-sm transition-all hover:bg-white hover:border-gray-300"
                                aria-label="Edit semester"
                                title="Edit semester"
                            >
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                        )}
                    </div>

                    <div className="relative z-10 flex flex-wrap justify-between items-start md:items-end gap-6">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <h1 className="text-gray-900 text-4xl font-black tracking-tight">{semester.semesterName}</h1>
                                <span className={`px-3 py-1 rounded-full ${semesterStatusColors.bg} ${semesterStatusColors.border} ${semesterStatusColors.text} text-xs font-bold uppercase tracking-wider shadow-sm border`}>
                                    {semesterStatus}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-gray-600">
                                <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-3 py-1 rounded-lg shadow-sm border border-gray-100">
                                    <span className="material-symbols-outlined text-base text-orange-500">calendar_today</span>
                                    <p className="text-sm font-medium">{new Date(semester.startDate).toLocaleDateString()} - {new Date(semester.endDate).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-3 py-1 rounded-lg shadow-sm border border-gray-100">
                                    <span className="material-symbols-outlined text-base text-blue-500">history_edu</span>
                                    <p className="text-sm font-medium">Code: {semester.semesterCode}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                            {(canManage || canPropose) && latestForm && (
                                <div
                                    className="flex-1 min-w-[200px] max-w-full sm:max-w-[240px] bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center transition-all hover:border-primary/50 group cursor-pointer shadow-sm hover:shadow"
                                    onClick={() => {
                                        if (canManage) setIsVersionsModalOpen(true);
                                        else window.open(latestForm.fileUrl, '_blank');
                                    }}
                                >
                                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 w-full text-center border-b border-slate-100 pb-2">
                                        Thesis Form
                                    </h3>
                                    <i className="pi pi-file-word text-3xl text-slate-300 group-hover:text-blue-500 mb-2 transition-colors mt-2" />
                                    <p className="font-semibold text-slate-700 text-sm text-center">Version {latestForm.versionNumber}</p>
                                    <div className="mt-3 flex items-center justify-center gap-1.5 text-primary text-xs font-semibold group-hover:underline">
                                        <span>Download Form</span>
                                        <i className="pi pi-download text-[10px]"></i>
                                    </div>
                                </div>
                            )}

                            {canManage && (
                                <div
                                    className={`flex-1 min-w-[200px] max-w-full sm:max-w-[240px] rounded-2xl p-4 flex flex-col items-center justify-center transition-all group shadow-sm ${isEnded ? 'bg-gray-100 border border-gray-300 cursor-not-allowed opacity-75' : 'bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 hover:border-indigo-300 hover:shadow-indigo-500/10 cursor-pointer hover:shadow'}`}
                                    onClick={() => {
                                        if (isEnded) return;
                                        setIsThesisFormModalOpen(true);
                                    }}
                                >
                                    <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 w-full text-center border-b pb-2 ${isEnded ? 'text-gray-500 border-gray-200' : 'text-indigo-400/70 border-indigo-100/50'}`}>
                                        Upload
                                    </h3>
                                    <i className={`pi pi-cloud-upload text-3xl mb-2 transition-colors mt-2 ${isEnded ? 'text-gray-400' : 'text-indigo-300 group-hover:text-indigo-500'}`} />
                                    <p className={`font-semibold text-sm text-center ${isEnded ? 'text-gray-600' : 'text-indigo-700'}`}>Upload New Version</p>
                                    {isEnded ? (
                                        <div className="mt-3 flex items-center justify-center gap-1.5 text-gray-500 text-xs font-semibold">
                                            <span>Disabled for Ended Semester</span>
                                        </div>
                                    ) : (
                                        <div className="mt-3 flex items-center justify-center gap-1.5 text-indigo-600 text-xs font-semibold group-hover:underline">
                                            <span>Update Template</span>
                                            <i className="pi pi-arrow-right text-[10px]"></i>
                                        </div>
                                    )}
                                </div>
                            )}

                            {canManage && (
                                <div className="flex flex-row sm:flex-col gap-3 justify-center w-full sm:w-auto mt-2 sm:mt-0 sm:ml-2 sm:border-l border-gray-100 sm:pl-6">
                                    {isUpcoming && (
                                        <button onClick={handleStartSemester} className="cursor-pointer flex items-center gap-2 px-5 h-11 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-500/20 transition-all">
                                            <span className="material-symbols-outlined text-lg">play_arrow</span>
                                            Start Semester
                                        </button>
                                    )}
                                    {isActive && (
                                        <button onClick={handleLockSubmission} className="cursor-pointer flex items-center gap-2 px-5 h-11 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">
                                            <span className="material-symbols-outlined text-lg">lock</span>
                                            Lock Submission
                                        </button>
                                    )}
                                    {isReviewThesis && (
                                        <button onClick={handleLockUpdates} className="cursor-pointer flex items-center gap-2 px-5 h-11 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all">
                                            <span className="material-symbols-outlined text-lg">gavel</span>
                                            Lock All Updates
                                        </button>
                                    )}
                                    {isReviewMiddle && (
                                        <button onClick={handleCloseSemester} className="cursor-pointer flex items-center gap-2 px-5 h-11 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all">
                                            <span className="material-symbols-outlined text-lg">event_busy</span>
                                            Close Semester
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <SemesterStats
                    totalTeams={semester.teamCount || 0}
                    totalWhitelisted={whitelistData?.totalCount ?? semester.whitelistCount ?? 0}
                    activeTeams={semester.activeTeamCount || 0}
                />

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('whitelists')}
                        className={`cursor-pointer px-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'whitelists' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">verified_user</span>
                        All Whitelist
                    </button>
                    <button
                        onClick={() => setActiveTab('lecturers')}
                        className={`cursor-pointer px-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'lecturers' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">school</span>
                        Lecturers
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`cursor-pointer px-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'students' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">person</span>
                        Students
                    </button>
                    {canManage && (
                        <button
                            onClick={() => setActiveTab('orphaned')}
                            className={`cursor-pointer px-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'orphaned' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                        >
                            <span className="material-symbols-outlined text-[18px]">person_off</span>
                            Orphaned Students
                        </button>
                    )}
                    <div className="flex-1 hidden sm:block"></div>
                    <button
                        onClick={() => setActiveTab('teams')}
                        className={`cursor-pointer px-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'teams' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">groups</span>
                        Teams
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'teams' && (
                    <>
                        {canManage && !isEnded && (
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={() => setIsForceCreateOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-sm font-bold hover:bg-orange-100 transition-colors border border-orange-200 shadow-sm cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-lg">group_add</span>
                                    Force Create Team
                                </button>
                            </div>
                        )}
                        <SemesterTeamsTable teams={semester.teams || []} onRefresh={fetchSemesterDetail} semesterEnded={isEnded} />
                    </>
                )}
                {(activeTab === 'whitelists' || activeTab === 'lecturers' || activeTab === 'students') && (
                    <SemesterWhitelistsTable
                        key="whitelist-table"
                        whitelists={
                            activeTab === 'whitelists' ? (whitelistData?.items || []) :
                            activeTab === 'lecturers' ? (lecturerData?.items || []) :
                            (studentData?.items || [])
                        }
                        isLoading={isWhitelistsLoading}
                        totalCount={
                            activeTab === 'whitelists' ? (whitelistData?.totalCount ?? 0) :
                            activeTab === 'lecturers' ? (lecturerData?.totalCount ?? 0) :
                            (studentData?.totalCount ?? 0)
                        }
                        page={
                            (activeTab === 'whitelists' ? whitelistPage :
                             activeTab === 'lecturers' ? lecturerPage :
                             studentPage) - 1
                        }
                        onPageChange={(p: number) => {
                            if (activeTab === 'whitelists') setWhitelistPage(p + 1);
                            else if (activeTab === 'lecturers') setLecturerPage(p + 1);
                            else setStudentPage(p + 1);
                        }}
                        headerAction={
                            canManage && !isEnded ? (
                                activeTab === 'whitelists' ? (
                                    <button
                                        onClick={() => setIsImportModalOpen(true)}
                                        className="group relative flex items-center gap-2 px-5 py-2.5 bg-white text-gray-800 rounded-xl text-sm font-bold hover:text-green-600 transition-all border border-gray-200 shadow-sm hover:shadow-md hover:border-green-200 cursor-pointer overflow-hidden"
                                    >
                                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                                        <span className="material-symbols-outlined text-xl text-green-500 group-hover:rotate-12 transition-transform">upload_file</span>
                                        <span>Import Whitelist</span>
                                    </button>
                                ) : activeTab === 'lecturers' ? (
                                    <button
                                        onClick={() => setIsReviewerModalOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-sm font-bold hover:bg-orange-100 transition-colors border border-orange-200 shadow-sm cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-lg">settings_account_box</span>
                                        Reviewer List
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { setSelectedStudent(null); setIsStudentModalOpen(true); }}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-lg">person_add</span>
                                        Add Student
                                    </button>
                                )
                            ) : undefined
                        }
                        onUpdate={refreshActiveTab}
                        onEdit={activeTab === 'students' ? (student) => { setSelectedStudent(student); setIsStudentModalOpen(true); } : undefined}
                        showStudentCode={activeTab === 'students'}
                        isEnded={isEnded}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                    />
                )}
                {activeTab === 'orphaned' && (
                    <SemesterWhitelistsTable
                        whitelists={orphanedData?.items || []}
                        isLoading={isOrphanedLoading}
                        totalCount={orphanedData?.totalCount ?? 0}
                        page={orphanedPage - 1}
                        onPageChange={(p: number) => setOrphanedPage(p + 1)}
                        onUpdate={() => fetchOrphanedStudents()}
                        showStudentCode={true}
                        isEnded={isEnded}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                    />
                )}

                <div className={`transition-all duration-500 ease-in-out overflow-hidden transform ${showWarning ? 'max-h-[300px] opacity-100 mt-8' : 'max-h-0 opacity-0 mt-0'}`}>
                    <div className="p-5 bg-orange-50/80 rounded-2xl border border-orange-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg shrink-0">
                            <span className="material-symbols-outlined text-xl">info</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-gray-900">Semester Lifecycle Management</h3>
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">Transitions are irreversible. 
                                <br />• <b>Lock Submission:</b> Stops receiving new thesis proposals.
                                <br />• <b>Lock All Updates:</b> Prevents all edits to teams and theses.
                                <br />• <b>Close Semester:</b> Finalizes everything and moves to history.</p>
                        </div>
                        <button
                            onClick={() => setShowWarning(false)}
                            className="cursor-pointer text-xs font-bold text-orange-700 hover:text-white hover:bg-orange-500 px-3 py-1.5 rounded-lg transition-all"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </main>
            {semester && (
                <SemesterModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={handleEditSuccess}
                    semesterData={semester}
                />
            )}
            {semester && (
                <ReviewerModal
                    isOpen={isReviewerModalOpen}
                    onClose={() => setIsReviewerModalOpen(false)}
                    lecturers={lecturerData?.items || []}
                    onUpdate={refreshActiveTab}
                />
            )}
            <ImportWhitelistModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                semesterId={semester?.semesterId || 0}
                onSuccess={refreshActiveTab}
            />
            {semester && (
                <ThesisFormModal
                    isOpen={isThesisFormModalOpen}
                    onClose={() => setIsThesisFormModalOpen(false)}
                    onSuccess={() => { fetchLatestForm(); setIsThesisFormModalOpen(false); }}
                    semesterId={semester.semesterId}
                    isSemesterEnded={isEnded}
                />
            )}
            <ThesisFormVersionsModal
                isOpen={isVersionsModalOpen}
                onClose={() => setIsVersionsModalOpen(false)}
            />
            {semester && (
                <WhitelistStudentModal
                    isOpen={isStudentModalOpen}
                    onClose={() => setIsStudentModalOpen(false)}
                    onSuccess={() => { setIsStudentModalOpen(false); refreshActiveTab(); }}
                    semesterId={semester.semesterId}
                    studentData={selectedStudent}
                />
            )}

            {semester && (
                <ForceCreateTeamModal
                    isOpen={isForceCreateOpen}
                    onClose={() => setIsForceCreateOpen(false)}
                    onSuccess={() => { fetchOrphanedStudents(); refreshActiveTab(); }}
                    semesterId={semester.semesterId}
                />
            )}
        </div>
    );
};

export default SemesterDetailPage;
