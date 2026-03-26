import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { semesterService, type Semester, type PagedResult, type Whitelist } from '../../services/semesterService';
import { thesisFormService } from '../../services/thesisFormService';
import { authService } from '../../services/authService';
import { calculateSemesterStatus } from '../../utils/semesterHelpers';
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
    const [orphanedData, setOrphanedData] = useState<Whitelist[]>([]);
    const [isForceCreateOpen, setIsForceCreateOpen] = useState(false);
    const [isOrphanedLoading, setIsOrphanedLoading] = useState(false);

    const [whitelistPage, setWhitelistPage] = useState(1);
    const [lecturerPage, setLecturerPage] = useState(1);
    const [studentPage, setStudentPage] = useState(1);
    const pageSize = 10;

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
                role: role || undefined
            });

            if (role === 'Lecturer') setLecturerData(data);
            else if (role === 'Student') setStudentData(data);
            else setWhitelistData(data);
        } catch (error) {
            console.error('Failed to fetch whitelists', error);
        } finally {
            setIsWhitelistsLoading(false);
        }
    }, [semesterId, whitelistPage, lecturerPage, studentPage]);

    useEffect(() => {
        fetchSemesterDetail();
        fetchLatestForm();
    }, [fetchSemesterDetail, fetchLatestForm]);

    const fetchOrphanedStudents = useCallback(async () => {
        if (!semesterId) return;
        try {
            setIsOrphanedLoading(true);
            const data = await semesterService.getOrphanedStudents(semesterId);
            setOrphanedData(data);
        } catch (error) {
            console.error('Failed to fetch orphaned students', error);
        } finally {
            setIsOrphanedLoading(false);
        }
    }, [semesterId]);

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


    const handleEndSemester = async () => {
        if (!semester) return;
        const result = await Swal.fire({
            title: 'End Semester?',
            text: "Ending the semester is irreversible. Ensure all grades are finalized.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            confirmButtonText: 'Yes, End Semester'
        });

        if (result.isConfirmed) {
            try {
                await semesterService.endSemester(semester.semesterId);
                Swal.fire({ icon: 'success', title: 'Ended!', text: 'Semester has been ended.' });
                fetchSemesterDetail();
            } catch (error) {
                console.error('Failed to end semester', error);
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to end semester' });
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
    const isEnded = semester.status === 'Ended';

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
                        <SemesterTeamsTable teams={semester.teams || []} onRefresh={fetchSemesterDetail} />
                    </>
                )}
                {activeTab === 'whitelists' && (
                    <SemesterWhitelistsTable
                        whitelists={whitelistData?.items || []}
                        isLoading={isWhitelistsLoading}
                        totalCount={whitelistData?.totalCount ?? 0}
                        page={whitelistPage - 1}
                        onPageChange={(p: number) => setWhitelistPage(p + 1)}
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
                        whitelists={lecturerData?.items || []}
                        isLoading={isWhitelistsLoading}
                        totalCount={lecturerData?.totalCount ?? 0}
                        page={lecturerPage - 1}
                        onPageChange={(p: number) => setLecturerPage(p + 1)}
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
                        whitelists={studentData?.items || []}
                        isLoading={isWhitelistsLoading}
                        totalCount={studentData?.totalCount ?? 0}
                        page={studentPage - 1}
                        onPageChange={(p: number) => setStudentPage(p + 1)}
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
                {activeTab === 'orphaned' && (
                    <SemesterWhitelistsTable
                        whitelists={orphanedData}
                        isLoading={isOrphanedLoading}
                        totalCount={orphanedData.length}
                        page={0}
                        onPageChange={() => {}}
                        onUpdate={() => fetchOrphanedStudents()}
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
