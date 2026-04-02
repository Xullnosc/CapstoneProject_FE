import { useNavigate } from 'react-router-dom';

interface ActiveSemesterBannerProps {
    semester?: {
        id: number;
        name: string;
        startDate: string;
        endDate: string;
        totalTeams?: number;
        season?: string;
    } | null;
}

const ActiveSemesterBanner: React.FC<ActiveSemesterBannerProps> = ({ semester }) => {
    const navigate = useNavigate();
    if (!semester) return null; // Or show a default "No Active Semester" state

    const normalizedSeason =
        semester.season === 'Spring' || semester.season === 'Summer' || semester.season === 'Fall'
            ? semester.season
            : 'Fall';

    const seasonTheme: Record<'Spring' | 'Summer' | 'Fall', { gradient: string; primaryDeco: string; secondaryDeco: string; badgeText: string }> = {
        Spring: {
            gradient: 'from-emerald-500 via-green-500 to-teal-600',
            primaryDeco: 'text-white/22',
            secondaryDeco: 'text-emerald-100/30',
            badgeText: 'text-emerald-700'
        },
        Summer: {
            gradient: 'from-yellow-400 via-amber-500 to-orange-500',
            primaryDeco: 'text-white/20',
            secondaryDeco: 'text-yellow-100/30',
            badgeText: 'text-amber-700'
        },
        Fall: {
            gradient: 'from-amber-500 via-orange-500 to-red-600',
            primaryDeco: 'text-white/20',
            secondaryDeco: 'text-orange-100/25',
            badgeText: 'text-orange-700'
        }
    };

    const currentTheme = seasonTheme[normalizedSeason];

    const renderSeasonDecorations = () => {
        if (normalizedSeason === 'Spring') {
            return (
                <>
                    <svg className={`absolute -right-20 top-0 w-[560px] h-[560px] -rotate-12 animate-[leafDrift_8s_ease-in-out_infinite] ${currentTheme.primaryDeco}`} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12,22C12,22 4,16 4,10C4,5 8,2 12,2C16,2 20,5 20,10C20,16 12,22 12,22M12,19.2C13.84,17.2 18,13.62 18,10C18,6.37 15.65,4 12,4C8.35,4 6,6.37 6,10C6,13.62 10.16,17.2 12,19.2Z"></path>
                    </svg>
                </>
            );
        }

        if (normalizedSeason === 'Summer') {
            return (
                <>
                    <svg className={`absolute -right-20 -top-12 w-[560px] h-[560px] animate-[spin_34s_linear_infinite] ${currentTheme.primaryDeco}`} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,5.29C7.24,6.03 7.1,6.84 7.1,7.66C7.1,8.47 7.24,9.28 7.5,10.03L3.34,8.31V7M3.34,17L7.5,15.29C7.24,16.03 7.1,16.84 7.1,17.66C7.1,18.47 7.24,19.28 7.5,20.03L3.34,18.31V17M12,22L9.61,18.58C10.35,18.85 11.16,19 12,19C12.84,19 13.65,18.85 14.39,18.58L12,22M20.66,17L16.5,15.29C16.76,16.03 16.9,16.84 16.9,17.66C16.9,18.47 16.76,19.28 16.5,20.03L20.66,18.31V17M20.66,7L16.5,5.29C16.76,6.03 16.9,6.84 16.9,7.66C16.9,8.47 16.76,9.28 16.5,10.03L20.66,8.31V7Z"></path>
                    </svg>
                </>
            );
        }

        return (
            <>
                <svg className={`absolute -right-20 top-0 w-[600px] h-[600px] rotate-12 animate-[leafDrift_8s_ease-in-out_infinite] ${currentTheme.primaryDeco}`} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"></path>
                </svg>
            </>
        );
    };

    return (
        <div className="relative w-full rounded-2xl overflow-hidden shadow-lg group min-h-[300px] flex items-center">
            <div className={`absolute inset-0 bg-[length:200%_200%] bg-gradient-to-br ${currentTheme.gradient} animate-[bannerGradient_10s_ease-in-out_infinite]`}></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.28),transparent_48%),radial-gradient(circle_at_78%_72%,rgba(255,255,255,0.18),transparent_45%)] animate-[bannerShimmer_12s_ease-in-out_infinite]"></div>

            {/* Decorative SVGs */}
            {renderSeasonDecorations()}

            <div className="relative z-10 w-full max-w-2xl m-6 md:m-12">
                <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/30">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-extrabold bg-white/90 mb-3 uppercase tracking-widest shadow-sm animate-pulse [animation-duration:2.8s] ${currentTheme.badgeText}`}>
                        Ongoing Semester
                    </span>
                    <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-sm mb-2">{semester.name}</h3>
                    <p className="text-white/90 text-sm md:text-base font-medium mb-6 leading-relaxed max-w-lg">
                        In progress. Grades submission period ends on {semester.endDate}. Ensure all teams have submitted preliminary reports.
                    </p>
                    <div className="flex flex-wrap gap-4 md:gap-8 text-sm font-semibold text-white/90 mb-8">
                        <div className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-lg border border-white/10">
                            <span className="material-symbols-outlined text-white">event</span>
                            <span>Ends: {semester.endDate}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-lg border border-white/10">
                            <span className="material-symbols-outlined text-white">group</span>
                            <span>{semester.totalTeams || 0} Active Teams</span>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate(`/semesters/semester?id=${semester.id}`)}
                        className="cursor-pointer px-6 py-3 rounded-xl bg-white text-orange-600 text-sm font-bold hover:bg-orange-50 transition-all active:scale-95 shadow-lg shadow-orange-900/20 flex items-center gap-2 animate-[buttonGlow_2.6s_ease-in-out_infinite]"
                    >
                        <span>Details Management</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes bannerGradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                @keyframes bannerShimmer {
                    0%, 100% { transform: translateX(0) translateY(0); opacity: 0.75; }
                    50% { transform: translateX(8px) translateY(-6px); opacity: 1; }
                }

                @keyframes leafDrift {
                    0%, 100% { transform: translateY(0) rotate(12deg); }
                    50% { transform: translateY(-8px) rotate(6deg); }
                }

                @keyframes buttonGlow {
                    0%, 100% { box-shadow: 0 10px 24px rgba(124, 45, 18, 0.2); }
                    50% { box-shadow: 0 14px 30px rgba(249, 115, 22, 0.35); }
                }
            `}</style>
        </div>
    );
};

export default ActiveSemesterBanner;
