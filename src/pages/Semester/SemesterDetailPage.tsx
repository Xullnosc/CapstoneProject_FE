import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import SemesterStats from '../../components/Semester/SemesterStats';
import SemesterTeamsTable from '../../components/Semester/SemesterTeamsTable';
import SemesterWhitelistsTable from '../../components/Semester/SemesterWhitelistsTable';
import { semesterService } from '../../services/semesterService';
import type { Semester } from '../../services/semesterService';
import Swal from '../../utils/swal';

import SemesterModal from '../../components/Semester/SemesterModal';

import { authService } from '../../services/authService';

const SemesterDetailPage = () => {
    const user = authService.getUser();
    const canManage = user?.roleName === 'HOD' || user?.roleName === 'Admin';
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');

    const [semester, setSemester] = useState<Semester | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'teams' | 'whitelists'>('teams');

    useEffect(() => {
        if (id) {
            fetchSemester(parseInt(id));
        }
    }, [id]);

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
                fetchSemester(semester.semesterId); // Refresh data
            } catch {
                Swal.fire('Error', 'Failed to end semester.', 'error');
            }
        }
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

    return (
        <div className="min-h-screen bg-white">
            <main className="max-w-[1200px] mx-auto w-full px-6 py-12">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-6">
                    <Link className="text-gray-500 text-sm font-medium hover:text-orange-600 transition-colors" to="/semesters">Semesters</Link>
                    <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
                    <span className="text-gray-900 text-sm font-semibold">{semester.semesterName} Detail</span>
                </div>

                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-gray-50 border border-gray-100 p-8 mb-8 shadow-sm">
                    {/* Background Decor */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-[600px] h-[600px] bg-orange-200/30 rounded-full blur-3xl"></div>
                        <div className="absolute top-20 right-20 w-[400px] h-[400px] bg-amber-100/40 rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative z-10 flex flex-wrap justify-between items-end gap-6">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <h1 className="text-gray-900 text-4xl font-black tracking-tight">{semester.semesterName}</h1>
                                {semester.isActive ? (
                                    <span className="px-3 py-1 rounded-full bg-emerald-50/80 backdrop-blur-sm border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider shadow-sm">Active</span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full bg-gray-100/80 backdrop-blur-sm border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider shadow-sm">Inactive</span>
                                )}
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
                        <div className="flex gap-3">
                            {canManage && (
                                <>
                                    <button
                                        onClick={() => setIsEditModalOpen(true)}
                                        className="cursor-pointer flex items-center gap-2 px-5 h-11 bg-white/80 backdrop-blur-md border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-white hover:border-gray-300 transition-all shadow-sm hover:shadow"
                                    >
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                        Edit Semester
                                    </button>
                                    {semester.isActive && (
                                        <button onClick={handleEndSemester} className="cursor-pointer flex items-center gap-2 px-5 h-11 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all hover:translate-y-[-1px]">
                                            <span className="material-symbols-outlined text-lg">event_busy</span>
                                            End Semester
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <SemesterStats
                    totalTeams={semester.teams ? semester.teams.length : 0}
                    totalWhitelisted={semester.whitelists ? semester.whitelists.length : 0}
                    activeTeams={semester.teams ? semester.teams.filter(t => t.status !== 'Disbanded').length : 0}
                />

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab('teams')}
                        className={`cursor-pointer px-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'teams' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                    >
                        <span className="material-symbols-outlined text-lg">groups</span>
                        Teams
                    </button>
                    <button
                        onClick={() => setActiveTab('whitelists')}
                        className={`cursor-pointer px-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'whitelists' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                    >
                        <span className="material-symbols-outlined text-lg">verified_user</span>
                        Whitelist
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'teams' ? (
                    <SemesterTeamsTable teams={semester.teams || []} />
                ) : (
                    <SemesterWhitelistsTable whitelists={semester.whitelists || []} />
                )}

                {/* Warning Note */}
                <div className="mt-8 p-5 bg-orange-50/80 rounded-2xl border border-orange-100 shadow-sm flex items-start gap-4">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                        <span className="material-symbols-outlined text-xl">info</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-900">Note regarding End Semester</h3>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">Ending the semester will automatically freeze all team updates and finalize the whitelists. This action is <span className="font-semibold text-orange-700">irreversible</span> and should only be done after final grades are submitted.</p>
                    </div>
                    <button className="cursor-pointer text-xs font-bold text-orange-700 hover:text-orange-800 hover:underline">
                        Dismiss
                    </button>
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
        </div>
    );
};

export default SemesterDetailPage;
