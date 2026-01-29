import React from 'react';

interface ActiveSemesterBannerProps {
    semester?: {
        name: string;
        startDate: string;
        endDate: string;
        totalTeams?: number;
    } | null;
}

const ActiveSemesterBanner: React.FC<ActiveSemesterBannerProps> = ({ semester }) => {
    if (!semester) return null; // Or show a default "No Active Semester" state

    return (
        <div className="relative w-full rounded-2xl overflow-hidden shadow-lg group min-h-[300px] flex items-center">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-red-600"></div>

            {/* Decorative SVGs */}
            <svg className="absolute -right-20 top-0 text-white/10 w-[600px] h-[600px] rotate-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"></path>
            </svg>

            <div className="relative z-10 w-full max-w-2xl m-6 md:m-12">
                <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/30">
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold bg-white/90 text-orange-700 mb-3 uppercase tracking-widest shadow-sm">
                        Current Active Semester
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
                    <button className="cursor-pointer px-6 py-3 rounded-xl bg-white text-orange-600 text-sm font-bold hover:bg-orange-50 transition-colors shadow-lg shadow-orange-900/20 flex items-center gap-2">
                        <span>Manage Live Details</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActiveSemesterBanner;
