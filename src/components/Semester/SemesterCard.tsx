import { type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSeasonGradient } from '../../utils/semesterHelpers';
import { SEMESTER_STATUS, SEMESTER_SEASON_SOFT_GRADIENTS, SEMESTER_STATUS_COLORS, type SemesterStatus } from '../../constants/semesterConstants';

type Season = 'Spring' | 'Summer' | 'Fall';

const SEASON_ICON_BY_SEASON: Record<Season, { icon: string; className: string }> = {
    Spring: {
        icon: 'local_florist',
        className: 'text-green-600 bg-green-50 p-1 rounded-lg shadow-sm'
    },
    Fall: {
        icon: 'eco',
        className: 'text-orange-500 bg-orange-50 p-1 rounded-lg shadow-sm'
    },
    Summer: {
        icon: 'light_mode',
        className: 'text-yellow-600 bg-yellow-50 p-1 rounded-lg shadow-sm'
    }
};

const ENDED_SEASON_HOVER_TEXT_CLASS: Record<Season, string> = {
    Spring: 'group-hover:text-green-600',
    Summer: 'group-hover:text-yellow-600',
    Fall: 'group-hover:text-orange-600'
};

const ACTIVE_SEASON_TEXT_CLASS: Record<Season, string> = {
    Spring: 'text-green-600',
    Summer: 'text-yellow-600',
    Fall: 'text-orange-600'
};

const FALLBACK_ICON = {
    icon: 'calendar_month',
    className: 'text-gray-500 bg-white p-1 rounded-lg shadow-sm'
};

const FALLBACK_GRADIENT = 'from-slate-50 via-gray-50 to-zinc-100';


const renderSeasonalDecoration = (season: Season) => {
    if (season === 'Spring') {
        return (
            <svg className="absolute -left-8 -bottom-8 text-green-400/50 w-72 h-72 -rotate-12 animate-pulse [animation-duration:4.8s]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12,22C12,22 4,16 4,10C4,5 8,2 12,2C16,2 20,5 20,10C20,16 12,22 12,22M12,19.2C13.84,17.2 18,13.62 18,10C18,6.37 15.65,4 12,4C8.35,4 6,6.37 6,10C6,13.62 10.16,17.2 12,19.2Z"></path>
            </svg>
        );
    }

    if (season === 'Fall') {
        return (
            <svg className="absolute -right-8 -bottom-8 text-orange-700/40 w-72 h-72 rotate-12 animate-pulse [animation-duration:5.2s] [animation-delay:250ms]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"></path>
            </svg>
        );
    }

    return (
        <svg className="absolute top-[-2rem] right-[-2rem] text-yellow-500/60 w-80 h-80 animate-[spin_30s_linear_infinite]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,5.29C7.24,6.03 7.1,6.84 7.1,7.66C7.1,8.47 7.24,9.28 7.5,10.03L3.34,8.31V7M3.34,17L7.5,15.29C7.24,16.03 7.1,16.84 7.1,17.66C7.1,18.47 7.24,19.28 7.5,20.03L3.34,18.31V17M12,22L9.61,18.58C10.35,18.85 11.16,19 12,19C12.84,19 13.65,18.85 14.39,18.58L12,22M20.66,17L16.5,15.29C16.76,16.03 16.9,16.84 16.9,17.66C16.9,18.47 16.76,19.28 16.5,20.03L20.66,18.31V17M20.66,7L16.5,5.29C16.76,6.03 16.9,6.84 16.9,7.66C16.9,8.47 16.76,9.28 16.5,10.03L20.66,8.31V7Z"></path>
        </svg>
    );
};

interface SemesterCardProps {
    semester: {
        id: number;
        code: string;
        name: string;
        startDate: string;
        endDate: string;
        status: SemesterStatus;
        isArchived: boolean;
        totalTeams: number;
        activeTeams: number;
        totalWhitelists: number;
        season: string;
        seasonColor: string; // e.g., 'orange', 'green', 'yellow'
    };
    onRefresh?: () => void;
}

const SemesterCard: FC<SemesterCardProps> = ({ semester }) => {
    const navigate = useNavigate();

    const statusColors = SEMESTER_STATUS_COLORS[semester.status] || SEMESTER_STATUS_COLORS[SEMESTER_STATUS.CLOSED];
    const isOpen = semester.status === SEMESTER_STATUS.OPEN;
    const isInProgress = semester.status === SEMESTER_STATUS.IN_PROGRESS;
    const isClosed = semester.status === SEMESTER_STATUS.CLOSED;
    
    const isActiveSemester = isOpen || isInProgress;
    const isEndedSemester = isClosed;
    
    const season = semester.season as Season;
    const cardGradient = isActiveSemester
        ? getSeasonGradient(season)
        : (SEMESTER_SEASON_SOFT_GRADIENTS[season] || FALLBACK_GRADIENT);
    const seasonIcon = SEASON_ICON_BY_SEASON[season] || FALLBACK_ICON;



    return (
        <div className="group relative rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 min-h-[320px] flex flex-col bg-white">
            {/* Background Pattern */}
            {isEndedSemester ? (
                <>
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-gray-100 to-zinc-100"></div>
                    <div className={`absolute inset-0 bg-gradient-to-br ${cardGradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}></div>
                    <div className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        {renderSeasonalDecoration(season)}
                    </div>
                </>
            ) : (
                <>
                    <div className={`absolute inset-0 bg-gradient-to-br ${cardGradient}`}></div>
                    {renderSeasonalDecoration(season)}
                </>
            )}

            <div className="relative h-full flex flex-col justify-between p-4 z-10">
                <div className="bg-white/70 backdrop-blur-md rounded-xl p-5 border border-white/60 shadow-sm mb-auto">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${statusColors.bg} ${statusColors.text} ${statusColors.border} text-xs font-bold shadow-sm border`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot} ${isActiveSemester ? 'animate-pulse' : ''}`}></span>
                                {semester.status}
                            </span>
                        </div>
                        <span className={`material-symbols-outlined ${isEndedSemester ? 'text-gray-500 bg-gray-100 p-1 rounded-lg shadow-sm transition-colors duration-300 group-hover:text-orange-600 group-hover:bg-orange-50' : seasonIcon.className}`}>{seasonIcon.icon}</span>
                    </div>

                    <h4 className="text-2xl font-bold text-gray-900 mb-1">{semester.name}</h4>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-4 font-medium">
                        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                        {semester.startDate} — {semester.endDate}
                    </div>

                    <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                        <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Teams</span>
                            <div className="flex items-baseline gap-1" title="Active / Total Teams">
                                <span className="text-xl font-bold text-gray-800">{semester.activeTeams}</span>
                                <span className="text-sm font-semibold text-gray-400">/{semester.totalTeams}</span>
                            </div>
                        </div>
                        <div className="h-8 w-[1px] bg-gray-200"></div>
                        <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Students</span>
                            <span className="text-xl font-bold text-gray-800">{semester.totalWhitelists}</span>
                        </div>
                        <div className="h-8 w-[1px] bg-gray-200"></div>
                        <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Season</span>
                            <span className={`text-sm font-bold capitalize ${isEndedSemester ? `text-gray-500 transition-colors duration-300 ${ENDED_SEASON_HOVER_TEXT_CLASS[season]}` : ACTIVE_SEASON_TEXT_CLASS[season]}`}>{semester.season}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 bg-white/70 backdrop-blur-md rounded-xl p-2 border border-white/60 shadow-sm">
                    <button onClick={() => navigate(`/semesters/semester?id=${semester.id}`)} className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors">
                        <span className="material-symbols-outlined text-[18px]">visibility</span> View
                    </button>
                    {!isClosed && (
                        <button onClick={() => navigate(`/semesters/semester?id=${semester.id}`)} className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors">
                            <span className="material-symbols-outlined text-[18px]">edit</span> Edit
                        </button>
                    )}
                    {isClosed && (
                        <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-gray-400 text-xs font-bold cursor-default">
                            <span className="material-symbols-outlined text-[18px]">lock</span> Closed
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SemesterCard;
