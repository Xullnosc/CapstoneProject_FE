import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ActiveSemesterBanner from '../../components/Semester/ActiveSemesterBanner';
import SemesterCard from '../../components/Semester/SemesterCard';
import SemesterModal from '../../components/Semester/SemesterModal';
import PremiumBreadcrumb from '../../components/Common/PremiumBreadcrumb';
import { semesterService } from '../../services/semesterService';
import type { Semester } from '../../services/semesterService';

import { authService } from '../../services/authService';
import { getSemesterSeason, getSeasonColor, calculateSemesterStatus, formatSemesterDate } from '../../utils/semesterHelpers';

const FILTER_OPTIONS = ['All', 'Ongoing', 'Upcoming', 'Ended'] as const;

type SemesterCardViewModel = {
    id: number;
    code: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'Ongoing' | 'Upcoming' | 'Ended';
    totalTeams: number;
    activeTeams: number;
    totalWhitelists: number;
    isArchived: boolean;
    season: string;
    seasonColor: string;
};

const SemesterDashboardPage = () => {
    const user = authService.getUser();
    const canManage = user?.roleName === 'HOD' || user?.roleName === 'Admin';
    const pageSize = 6;

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'All' | 'Ongoing' | 'Upcoming' | 'Ended'>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalSemesterCount, setTotalSemesterCount] = useState(0);

    const fetchSemesters = useCallback(async (page: number = 1, append: boolean = false) => {
        try {
            if (!append) setIsLoading(true);
            else setIsLoadingMore(true);

            const data = await semesterService.getAllSemestersPaginated(page, pageSize);
            
            if (append) {
                setAllSemesters((prev) => [...prev, ...data.items]);
            } else {
                setAllSemesters(data.items);
            }
            
            setTotalSemesterCount(data.totalCount);
            setCurrentPage(page);
        } catch (error: unknown) {
            console.error("Failed to fetch semesters", error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchSemesters(1, false);
    }, [fetchSemesters]);

    // Helper to map API data to UI format
    const mapToCardProps = useCallback((sem: Semester): SemesterCardViewModel => {
        const season = getSemesterSeason(sem.semesterName);
        return {
            id: sem.semesterId,
            code: sem.semesterCode,
            name: sem.semesterName,
            startDate: formatSemesterDate(sem.startDate),
            endDate: formatSemesterDate(sem.endDate),
            status: calculateSemesterStatus(sem.status),
            totalTeams: sem.teamCount, // Use optimized count from backend
            activeTeams: sem.activeTeamCount,
            totalWhitelists: sem.whitelistCount,
            isArchived: sem.status === 'Ended',
            season: season,
            seasonColor: getSeasonColor(season)
        };
    }, []);

    const semesterCards = useMemo(() => allSemesters.map(mapToCardProps), [allSemesters, mapToCardProps]);

    const activeSemesterCard = useMemo(
        () => semesterCards.find(s => s.status === 'Ongoing') || null,
        [semesterCards]
    );

    const filteredSemesterCards = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        return semesterCards.filter((semesterCard) => {
            const matchesStatus = filterStatus === 'All' || semesterCard.status === filterStatus;
            const matchesSearch =
                keyword.length === 0 ||
                semesterCard.name.toLowerCase().includes(keyword) ||
                semesterCard.code.toLowerCase().includes(keyword);

            return matchesStatus && matchesSearch;
        });
    }, [filterStatus, searchTerm, semesterCards]);

    const visibleSemesterCards = useMemo(
        () => filteredSemesterCards,
        [filteredSemesterCards]
    );

    const canShowMore = visibleSemesterCards.length > 0 && allSemesters.length < totalSemesterCount;

    const emptySemesterMessage = useMemo(() => {
        if (filterStatus === 'Ongoing') return 'There is no on-going semester';
        if (filterStatus === 'Upcoming') return 'There is no upcoming semester';
        if (filterStatus === 'Ended') return 'There is no ended semester';
        return 'There is no semester';
    }, [filterStatus]);

    const handleShowMore = async () => {
        await fetchSemesters(currentPage + 1, true);
    };

    const breadcrumbItems = [
        { label: 'Home', to: '/home' },
        { label: 'Semesters' }
    ];

    return (
        <div className="min-h-screen bg-white">
            <main className="max-w-[1200px] mx-auto w-full px-6 py-6 space-y-8">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <PremiumBreadcrumb items={breadcrumbItems} />
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-3xl font-black tracking-tight text-gray-900">Semester Management</h2>
                        <p className="text-gray-500 text-base font-normal">Manage and track academic cycles for the department</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {canManage && (
                            <>
                                <button className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm">
                                    <span className="material-symbols-outlined text-xl">ios_share</span>
                                    Export
                                </button>
                                <Link
                                    to="/lecturers"
                                    className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-xl">school</span>
                                    Manage Lecturer Pool
                                </Link>
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
                <ActiveSemesterBanner semester={activeSemesterCard} />

                {/* Filters & Grid */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
                        <div className="flex gap-8 overflow-x-auto no-scrollbar">
                            {FILTER_OPTIONS.map((status) => (
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
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                        </div>
                    ) : visibleSemesterCards.length === 0 ? (
                        <div className="py-16 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 text-center">
                            <p className="text-base font-semibold text-gray-600">{emptySemesterMessage}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {visibleSemesterCards.map(sem => (
                                <SemesterCard key={sem.id} semester={sem} onRefresh={fetchSemesters} />
                            ))}
                        </div>
                    )}

                    {/* Progressive reveal */}
                    {canShowMore && (
                        <div className="flex justify-center py-8 mt-4">
                            <button
                                onClick={handleShowMore}
                                disabled={isLoadingMore}
                                className="px-8 py-3 rounded-full border-2 border-stone-200 text-stone-600 font-bold tracking-tight hover:border-orange-600 hover:text-orange-600 transition-all duration-300 scale-95 active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoadingMore ? 'Loading...' : 'Show more'}
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <SemesterModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={fetchSemesters} />
        </div>
    );
};

export default SemesterDashboardPage;
