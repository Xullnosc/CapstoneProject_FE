import { useState, useEffect } from 'react';
import ActiveSemesterBanner from '../../components/Semester/ActiveSemesterBanner';
import SemesterCard from '../../components/Semester/SemesterCard';
import SemesterModal from '../../components/Semester/SemesterModal';
import { semesterService } from '../../services/semesterService';
import type { Semester } from '../../services/semesterService';

import { authService } from '../../services/authService';
import { getSemesterSeason, getSeasonColor, calculateSemesterStatus, formatSemesterDate } from '../../utils/semesterHelpers';

const SemesterDashboardPage = () => {
    const user = authService.getUser();
    const canManage = user?.roleName === 'HOD' || user?.roleName === 'Admin';
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'All' | 'Ongoing' | 'Upcoming' | 'Ended'>('All');

    useEffect(() => {
        fetchSemesters();
    }, []);

    const fetchSemesters = async () => {
        try {
            setIsLoading(true);
            const data = await semesterService.getAllSemesters();
            setSemesters(data);
        } catch (error: unknown) {
            console.error("Failed to fetch semesters", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to map API data to UI format
    const mapToCardProps = (sem: Semester) => {
        const season = getSemesterSeason(sem.semesterName);
        return {
            id: sem.semesterId,
            code: sem.semesterCode,
            name: sem.semesterName,
            startDate: formatSemesterDate(sem.startDate),
            endDate: formatSemesterDate(sem.endDate),
            status: calculateSemesterStatus(sem.isActive, sem.startDate, sem.endDate, sem.isArchived),
            totalTeams: sem.teamCount, // Use optimized count from backend
            totalWhitelists: sem.whitelistCount,
            isArchived: sem.isArchived,
            season: season,
            seasonColor: getSeasonColor(season)
        };
    };

    const getFilteredSemesters = () => {
        if (filterStatus === 'All') return semesters;

        return semesters.filter(s => {
            const status = calculateSemesterStatus(s.isActive, s.startDate, s.endDate, s.isArchived);
            return status === filterStatus;
        });
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-[1200px] mx-auto p-8 lg:p-12 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-3xl font-black tracking-tight text-gray-900">Semester Management</h2>
                        <p className="text-gray-500 text-base font-normal">Manage and track academic cycles for the department</p>
                    </div>
                    <div className="flex gap-3">
                        {canManage && (
                            <>
                                <button className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm">
                                    <span className="material-symbols-outlined text-xl">ios_share</span>
                                    Export
                                </button>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all hover:translate-y-[-1px] active:translate-y-[1px]"
                                >
                                    <span className="material-symbols-outlined text-xl">add_circle</span>
                                    Create New Semester
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Banner */}
                <ActiveSemesterBanner semester={semesters.find(s => s.isActive) ? mapToCardProps(semesters.find(s => s.isActive)!) : null} />

                {/* Filters & Grid */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
                        <div className="flex gap-8 overflow-x-auto no-scrollbar">
                            {(['All', 'Ongoing', 'Upcoming', 'Ended'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`cursor-pointer border-b-2 pb-4 px-1 text-sm font-bold whitespace-nowrap transition-colors ${filterStatus === status
                                        ? 'border-orange-500 text-orange-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    {status === 'All' ? 'All Semesters' : status}
                                </button>
                            ))}
                        </div>
                        <div className="pb-3">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                                <input
                                    className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm w-full md:w-64 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder:text-gray-400"
                                    placeholder="Search semesters..."
                                    type="text"
                                />
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {getFilteredSemesters().map(sem => (
                                <SemesterCard key={sem.semesterId} semester={mapToCardProps(sem)} onRefresh={fetchSemesters} />
                            ))}
                        </div>
                    )}

                    {/* Pagination Mock */}
                    <div className="px-6 py-6 flex items-center justify-between border-t border-gray-100 mt-4">
                        <p className="text-xs text-gray-500">Showing {getFilteredSemesters().length} semesters</p>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 rounded border border-gray-200 text-xs font-medium text-gray-400 bg-white cursor-not-allowed" disabled>Previous</button>
                            <button className="cursor-pointer px-3 py-1.5 rounded border border-gray-200 text-xs font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors">Next</button>
                        </div>
                    </div>
                </div>
            </div>

            <SemesterModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={fetchSemesters} />
        </div>
    );
};

export default SemesterDashboardPage;
