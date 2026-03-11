import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import SemesterStats from '../../components/Semester/SemesterStats';
import SemesterTeamsTable from '../../components/Semester/SemesterTeamsTable';
import SemesterWhitelistsTable from '../../components/Semester/SemesterWhitelistsTable';
import { semesterService } from '../../services/semesterService';
import { whitelistService } from '../../services/whitelistService';
import type { Semester, Whitelist, PagedResult } from '../../services/semesterService';
import Swal from '../../utils/swal';

import SemesterModal from '../../components/Semester/SemesterModal';

import ReviewerModal from '../../components/Semester/ReviewerModal';
import ImportWhitelistModal from '../../components/Semester/ImportWhitelistModal';
import WhitelistStudentModal from '../../components/Semester/WhitelistStudentModal';
import { calculateSemesterStatus } from '../../utils/semesterHelpers';
import { SEMESTER_STATUS_COLORS } from '../../constants/semesterConstants';
import { authService } from '../../services/authService';
import ThesisFormModal from '../../components/Thesis/ThesisFormModal';
import ThesisFormVersionsModal from '../../components/Thesis/ThesisFormVersionsModal';
import { thesisFormService } from '../../services/thesisFormService';
import type { ThesisForm } from '../../types/thesisForm';

const SemesterDetailPage = () => {
    const user = authService.getUser();
    const canManage = user?.roleName === 'HOD' || user?.roleName === 'Admin';
    const canPropose = user?.roleName === 'Lecturer' || user?.roleName === 'Student';
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');

    const [semester, setSemester] = useState<Semester | null>(null);
    const [latestForm, setLatestForm] = useState<ThesisForm | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isReviewerModalOpen, setIsReviewerModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isThesisFormModalOpen, setIsThesisFormModalOpen] = useState(false);
    const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Whitelist | null>(null);
    const [activeTab, setActiveTab] = useState<'whitelists' | 'lecturers' | 'students' | 'teams'>('whitelists');
    const [showWarning, setShowWarning] = useState(true);

    // Pagination States
    const [whitelistData, setWhitelistData] = useState<PagedResult<Whitelist> | null>(null);
    const [lecturerData, setLecturerData] = useState<PagedResult<Whitelist> | null>(null);
    const [studentData, setStudentData] = useState<PagedResult<Whitelist> | null>(null);

    const [whitelistPage, setWhitelistPage] = useState(0); // PrimeReact is 0-indexed for Paginator but 1-indexed for backend usually? Need to check.
    const [lecturerPage, setLecturerPage] = useState(0);
    const [studentPage, setStudentPage] = useState(0);
    const [isWhitelistsLoading, setIsWhitelistsLoading] = useState(false);

    const PAGE_SIZE = 10;

    useEffect(() => {
        if (id) {
            fetchSemester(parseInt(id));
        }
        fetchLatestForm();
    }, [id]);

    const fetchWhitelists = useCallback(async (role?: string, page: number = 0) => {
        if (!id) return;
        try {
            setIsWhitelistsLoading(true);
            const data = await whitelistService.getWhitelistsPaginated(parseInt(id), {
                page: page + 1,
                pageSize: PAGE_SIZE,
                role: role
            });
            if (!role) setWhitelistData(data);
            else if (role.toLowerCase() === 'lecturer') setLecturerData(data);
            else if (role.toLowerCase() === 'student') setStudentData(data);
        } catch (error) {
            console.error(`Failed to fetch ${role || 'all'} whitelists`, error);
        } finally {
            setIsWhitelistsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        // Reset data when switching tabs (optional, but prevents showing old data while loading)
        // setWhitelistData(null); setLecturerData(null); setStudentData(null);

        if (activeTab === 'whitelists') fetchWhitelists(undefined, whitelistPage);
        if (activeTab === 'lecturers') fetchWhitelists('Lecturer', lecturerPage);
        if (activeTab === 'students') fetchWhitelists('Student', studentPage);
    }, [activeTab, whitelistPage, lecturerPage, studentPage, fetchWhitelists]);

    const fetchLatestForm = async () => {
        try {
            const data = await thesisFormService.getLatestForm();
            setLatestForm(data.data);
        } catch (error) {
            console.error("Failed to fetch latest thesis form", error);
        }
    };

    const fetchSemester = async (semesterId: number) => {
        try {
            setIsLoading(true);
            const data = await semesterService.getSemesterById(semesterId);
            setSemester(data);
        } catch (error: unknown) {
            console.error("Failed to fetch semester details", error);
            Swal.fire('Error', 'Failed to load semester details', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditSuccess = () => {
        if (semester) fetchSemester(semester.semesterId);
        setIsEditModalOpen(false);
    };

    const handleEndSemester = async () => {
        if (!semester) return;

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "Ending the semester is irreversible. Ensure all grades are finalized.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f26e21',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, End Semester!'
        });

        if (result.isConfirmed) {
            try {
                await semesterService.endSemester(semester.semesterId);
                Swal.fire('Ended!', 'The semester has been ended.', 'success');
                fetchSemester(semester.semesterId);
            } catch {
                Swal.fire('Error', 'Failed to end semester.', 'error');
            }
        }
    };

    const refreshActiveTab = () => {
        if (activeTab === 'whitelists') fetchWhitelists(undefined, whitelistPage);
        else if (activeTab === 'lecturers') fetchWhitelists('Lecturer', lecturerPage);
        else if (activeTab === 'students') fetchWhitelists('Student', studentPage);
        if (semester) fetchSemester(semester.semesterId); // stats might change
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (!semester) {
        return (
            <div className="min-h-screen bg-white flex justify-center items-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Semester Not Found</h2>
                    <Link to="/semesters" className="text-orange-500 hover:underline mt-2 block">Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    const semesterStatus = calculateSemesterStatus(semester.status);
    const isEnded = semesterStatus === 'Ended';

    return (
        <div className="min-h-screen bg-white">
            <main className="max-w-[1200px] mx-auto w-full px-6 py-6">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-6">
                    <Link className="text-gray-500 text-sm font-medium hover:text-orange-600 transition-colors" to="/semesters">Semesters</Link>
                    <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
                    <span className="text-gray-900 text-sm font-semibold">{semester.semesterName} Detail</span>
                </div>

                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-gray-50 border border-gray-100 p-8 mb-8 shadow-sm">
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-[600px] h-[600px] bg-orange-200/30 rounded-full blur-3xl"></div>
                        <div className="absolute top-20 right-20 w-[400px] h-[400px] bg-amber-100/40 rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative z-10 flex flex-wrap justify-between items-start md:items-end gap-6">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <h1 className="text-gray-900 text-4xl font-black tracking-tight">{semester.semesterName}</h1>
                                {(() => {
                                    const colors = SEMESTER_STATUS_COLORS[semesterStatus];
                                    return (
                                        <span className={`px-3 py-1 rounded-full ${colors.bg} ${colors.border} ${colors.text} text-xs font-bold uppercase tracking-wider shadow-sm border`}>
                                            {semesterStatus}
                                        </span>
                                    );
                                })()}
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
                                    className="flex-1 min-w-[200px] max-w-full sm:max-w-[240px] bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-4 flex flex-col items-center justify-center transition-all hover:border-indigo-300 hover:shadow-indigo-500/10 group cursor-pointer shadow-sm hover:shadow"
                                    onClick={() => setIsThesisFormModalOpen(true)}
                                >
                                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400/70 mb-2 w-full text-center border-b border-indigo-100/50 pb-2">
                                        Upload
                                    </h3>
                                    <i className="pi pi-cloud-upload text-3xl text-indigo-300 group-hover:text-indigo-500 mb-2 transition-colors mt-2" />
                                    <p className="font-semibold text-indigo-700 text-sm text-center">Upload New Version</p>
                                    <div className="mt-3 flex items-center justify-center gap-1.5 text-indigo-600 text-xs font-semibold group-hover:underline">
                                        <span>Update Template</span>
                                        <i className="pi pi-arrow-right text-[10px]"></i>
                                    </div>
                                </div>
                            )}

                            {canManage && (
                                <div className="flex flex-row sm:flex-col gap-3 justify-center w-full sm:w-auto mt-2 sm:mt-0 sm:ml-2 sm:border-l border-gray-100 sm:pl-6">
                                    {semester.status !== 'Ended' && (
                                        <button
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="cursor-pointer flex items-center gap-2 px-5 h-11 bg-white/80 backdrop-blur-md border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-white hover:border-gray-300 transition-all shadow-sm hover:shadow"
                                        >
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                            Edit Semester
                                        </button>
                                    )}
                                    {semester.status === 'Active' && (
                                        <button onClick={handleEndSemester} className="cursor-pointer flex items-center gap-2 px-5 h-11 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all">
                                            <span className="material-symbols-outlined text-lg">event_busy</span>
                                            End Semester
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <SemesterStats
                    totalTeams={semester.teamCount || 0}
                    totalWhitelisted={(whitelistData as any)?.totalCount ?? (whitelistData as any)?.TotalCount ?? semester.whitelistCount ?? 0}
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
                    <SemesterTeamsTable teams={semester.teams || []} />
                )}
                {activeTab === 'whitelists' && (
                    <SemesterWhitelistsTable
                        whitelists={(whitelistData as any)?.items || (whitelistData as any)?.Items || []}
                        isLoading={isWhitelistsLoading}
                        totalCount={(whitelistData as any)?.totalCount ?? (whitelistData as any)?.TotalCount ?? 0}
                        page={whitelistPage}
                        onPageChange={(p: number) => setWhitelistPage(p)}
                        headerAction={canManage && !isEnded ? (
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="group relative flex items-center gap-2 px-5 py-2.5 bg-white text-gray-800 rounded-xl text-sm font-bold hover:text-green-600 transition-all border border-gray-200 shadow-sm hover:shadow-md hover:border-green-200 cursor-pointer overflow-hidden"
                            >
                                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                                <span className="material-symbols-outlined text-xl text-green-500 group-hover:rotate-12 transition-transform">upload_file</span>
                                <span>Import Whitelist</span>
                            </button>
                        ) : undefined}
                        onUpdate={refreshActiveTab}
                        isEnded={isEnded}
                    />
                )}
                {activeTab === 'lecturers' && (
                    <SemesterWhitelistsTable
                        whitelists={(lecturerData as any)?.items || (lecturerData as any)?.Items || []}
                        isLoading={isWhitelistsLoading}
                        totalCount={(lecturerData as any)?.totalCount ?? (lecturerData as any)?.TotalCount ?? 0}
                        page={lecturerPage}
                        onPageChange={(p: number) => setLecturerPage(p)}
                        headerAction={canManage && !isEnded ? (
                            <button
                                onClick={() => setIsReviewerModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-sm font-bold hover:bg-orange-100 transition-colors border border-orange-200 shadow-sm cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-lg">settings_account_box</span>
                                Reviewer List
                            </button>
                        ) : undefined}
                        onUpdate={refreshActiveTab}
                        isEnded={isEnded}
                    />
                )}
                {activeTab === 'students' && (
                    <SemesterWhitelistsTable
                        whitelists={(studentData as any)?.items || (studentData as any)?.Items || []}
                        isLoading={isWhitelistsLoading}
                        totalCount={(studentData as any)?.totalCount ?? (studentData as any)?.TotalCount ?? 0}
                        page={studentPage}
                        onPageChange={(p: number) => setStudentPage(p)}
                        headerAction={canManage && !isEnded ? (
                            <button
                                onClick={() => { setSelectedStudent(null); setIsStudentModalOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-lg">person_add</span>
                                Add Student
                            </button>
                        ) : undefined}
                        onEdit={(student) => { setSelectedStudent(student); setIsStudentModalOpen(true); }}
                        onUpdate={refreshActiveTab}
                        showStudentCode={true}
                        isEnded={isEnded}
                    />
                )}

                <div className={`transition-all duration-500 ease-in-out overflow-hidden transform ${showWarning ? 'max-h-[300px] opacity-100 mt-8' : 'max-h-0 opacity-0 mt-0'}`}>
                    <div className="p-5 bg-orange-50/80 rounded-2xl border border-orange-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg shrink-0">
                            <span className="material-symbols-outlined text-xl">info</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-gray-900">Note regarding End Semester</h3>
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">Ending the semester will automatically freeze all team updates and finalize the whitelists. This action is <span className="font-semibold text-orange-700">irreversible</span> and should only be done after final grades are submitted.</p>
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
            <ThesisFormModal
                isOpen={isThesisFormModalOpen}
                onClose={() => setIsThesisFormModalOpen(false)}
                onSuccess={() => { fetchLatestForm(); setIsThesisFormModalOpen(false); }}
            />
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
        </div>
    );
};

export default SemesterDetailPage;
