import type { TeamSimple } from '../../services/semesterService';
import { useNavigate } from 'react-router-dom';

interface SemesterTeamsTableProps {
    teams?: TeamSimple[];
    isLoading?: boolean;
}

const SemesterTeamsTable: React.FC<SemesterTeamsTableProps> = ({ teams = [], isLoading = false }) => {
    const navigate = useNavigate();

    const handleRowClick = (teamId: number) => {
        navigate(`/teams/${teamId}`);
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 bg-white z-10 relative">
                {/* Toolbar buttons */}
                <div className="bg-gray-100/80 p-1 rounded-xl flex gap-1">
                    <button className="px-4 py-1.5 rounded-lg bg-white text-gray-900 text-sm font-bold shadow-sm transition-all border border-gray-200/50">
                        Teams <span className="ml-1 text-xs text-orange-600 bg-orange-600/10 px-1.5 py-0.5 rounded-md">{teams.length}</span>
                    </button>
                    {/* Placeholder buttons for future implementation */}
                    <button className="px-4 py-1.5 rounded-lg text-gray-500 text-sm font-bold hover:bg-gray-200/50 transition-all">Pending</button>
                    <button className="px-4 py-1.5 rounded-lg text-gray-500 text-sm font-bold hover:bg-gray-200/50 transition-all">Approved</button>
                </div>
            </div>

            <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/80 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Team Code</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Team Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Members</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            // Skeleton Loading State
                            Array.from({ length: 3 }).map((_, index) => (
                                <tr key={index} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded w-16"></div></td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 bg-gray-100 rounded-full"></div>
                                            <div className="h-4 bg-gray-100 rounded w-32"></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-12"></div></td>
                                    <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-20"></div></td>
                                    <td className="px-6 py-4"><div className="h-8 bg-gray-100 rounded-lg w-8 ml-auto"></div></td>
                                </tr>
                            ))
                        ) : teams.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
                                        <span className="material-symbols-outlined text-4xl opacity-50">group_off</span>
                                        <span className="text-sm font-medium">No teams found in this semester</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            teams.map((team) => (
                                <tr
                                    key={team.teamId}
                                    onClick={() => handleRowClick(team.teamId)}
                                    className="hover:bg-orange-50/30 active:scale-[0.995] active:bg-orange-50/60 transition-all duration-200 cursor-pointer group border-l-4 border-transparent hover:border-orange-500"
                                >
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded group-hover:bg-white group-hover:shadow-sm transition-all">{team.teamCode}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase shadow-sm group-hover:scale-110 transition-transform">
                                                {team.teamName.substring(0, 2)}
                                            </div>
                                            <span className="font-semibold text-gray-900 text-sm group-hover:text-orange-700 transition-colors">{team.teamName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-gray-600 text-sm">
                                            <span className="material-symbols-outlined text-base">group</span>
                                            <span>{team.memberCount}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${team.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                            {team.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRowClick(team.teamId); }}
                                            className="text-gray-400 hover:text-orange-600 transition-colors p-2 rounded-lg hover:bg-white hover:shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-xl">arrow_forward</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SemesterTeamsTable;
