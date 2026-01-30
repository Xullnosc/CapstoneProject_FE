
interface SemesterStatsProps {
    totalTeams: number;
    totalWhitelisted: number;
    activeTeams: number;
}

const SemesterStats: React.FC<SemesterStatsProps> = ({ totalTeams, totalWhitelisted, activeTeams }) => {
    return (
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Decoration */}
            <div className="absolute -z-10 -right-10 -top-10 w-64 h-64 opacity-20 bg-no-repeat bg-contain rotate-12 bg-orange-200 rounded-full blur-3xl"></div>

            {/* Stat Card 1 */}
            <div className="flex flex-col gap-4 rounded-2xl p-6 bg-white border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-shadow">
                <div className="flex items-center justify-between">
                    <div className="size-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner">
                        <span className="material-symbols-outlined text-2xl">groups</span>
                    </div>
                </div>
                <div>
                    <p className="text-gray-500 text-sm font-medium">Total Teams</p>
                    <p className="text-gray-900 text-4xl font-black mt-1 tracking-tight">{totalTeams}</p>
                </div>
            </div>

            {/* Stat Card 2 */}
            <div className="flex flex-col gap-4 rounded-2xl p-6 bg-white border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-shadow">
                <div className="flex items-center justify-between">
                    <div className="size-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                        <span className="material-symbols-outlined text-2xl">verified_user</span>
                    </div>
                </div>
                <div>
                    <p className="text-gray-500 text-sm font-medium">Total Whitelisted</p>
                    <p className="text-gray-900 text-4xl font-black mt-1 tracking-tight">{totalWhitelisted}</p>
                </div>
            </div>

            {/* Stat Card 3 */}
            <div className="flex flex-col gap-4 rounded-2xl p-6 bg-white border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-shadow">
                <div className="flex items-center justify-between">
                    <div className="size-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                        <span className="material-symbols-outlined text-2xl">rocket_launch</span>
                    </div>
                </div>
                <div>
                    <p className="text-gray-500 text-sm font-medium">Active Teams</p>
                    <p className="text-gray-900 text-4xl font-black mt-1 tracking-tight">{activeTeams}</p>
                </div>
            </div>
        </div>
    );
};

export default SemesterStats;
