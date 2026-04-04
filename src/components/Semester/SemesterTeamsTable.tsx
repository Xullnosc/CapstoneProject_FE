import React, { useState } from 'react';
import type { TeamSimple } from '../../services/semesterService';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { teamService } from '../../services/teamService';
import Swal from '../../utils/swal';

interface SemesterTeamsTableProps {
    teams?: TeamSimple[];
    isLoading?: boolean;
    onRefresh?: () => void;
    semesterEnded?: boolean;
}

const SemesterTeamsTable: React.FC<SemesterTeamsTableProps> = ({ teams = [], isLoading = false, onRefresh, semesterEnded = false }) => {
    const navigate = useNavigate();
    const currentUser = authService.getUser();
    const isHod = currentUser?.roleName === 'HOD';

    const [statusFilter, setStatusFilter] = useState<string>('All');

    const filteredTeams = teams.filter(t => {
        if (statusFilter === 'All') return true;
        if (statusFilter === 'Special') return t.isSpecial;
        return t.status === statusFilter;
    });

    const counts = {
        All: teams.length,
        Active: teams.filter(t => t.status === 'Active').length,
        Insufficient: teams.filter(t => t.status === 'Insufficient').length,
        Pending: teams.filter(t => t.status === 'Pending').length,
        Special: teams.filter(t => t.isSpecial).length,
    };

    const handleRowClick = (teamId: number) => {
        navigate(`/teams/${teamId}`);
    };

    const handleToggleSpecial = async (e: React.MouseEvent, teamId: number, currentStatus: boolean | undefined) => {
        e.stopPropagation();

        const action = currentStatus ? "unmark this team as special" : "mark this team as special";

        const result = await Swal.fire({
            title: 'Confirm',
            text: `Are you sure you want to ${action}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#9ca3af',
            confirmButtonText: 'Yes, confirm',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                await teamService.toggleSpecial(teamId);
                Swal.fire('Success', `Team has been ${currentStatus ? 'unmarked' : 'marked'} as special.`, 'success');
                if (onRefresh) {
                    onRefresh();
                } else {
                    window.location.reload();
                }
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'Something went wrong', 'error');
            }
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 bg-white z-10 relative">
                {/* Modern Filter Tabs */}
                <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setStatusFilter('All')}
                        className={`cursor-pointer px-1 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${statusFilter === 'All' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        All Teams
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${statusFilter === 'All' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>
                            {counts.All}
                        </span>
                    </button>
                    <button
                        onClick={() => setStatusFilter('Active')}
                        className={`cursor-pointer px-1 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${statusFilter === 'Active' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Active
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${statusFilter === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                            {counts.Active}
                        </span>
                    </button>
                    <button
                        onClick={() => setStatusFilter('Insufficient')}
                        className={`cursor-pointer px-1 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${statusFilter === 'Insufficient' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Insufficient
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${statusFilter === 'Insufficient' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-400'}`}>
                            {counts.Insufficient}
                        </span>
                    </button>
                    <button
                        onClick={() => setStatusFilter('Pending')}
                        className={`cursor-pointer px-1 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${statusFilter === 'Pending' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Pending
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${statusFilter === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                            {counts.Pending}
                        </span>
                    </button>
                    {isHod && (
                        <button
                            onClick={() => setStatusFilter('Special')}
                            className={`cursor-pointer px-1 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${statusFilter === 'Special' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            Special
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${statusFilter === 'Special' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                                {counts.Special}
                            </span>
                        </button>
                    )}
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
                        ) : filteredTeams.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
                                        <span className="material-symbols-outlined text-4xl opacity-50">group_off</span>
                                        <span className="text-sm font-medium">No teams found matching current filter</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredTeams.map((team) => (
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
                                            {team.isSpecial && (
                                                <span className="material-symbols-outlined text-orange-500 text-base" title="Team Đặc Biệt">star</span>
                                            )}
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
                                        <div className="flex items-center justify-end gap-2">
                                            {isHod && team.status === 'Insufficient' && !semesterEnded && (
                                                <button
                                                    onClick={(e) => handleToggleSpecial(e, team.teamId, team.isSpecial)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border ${team.isSpecial ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 hover:border-orange-300' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
                                                    title={team.isSpecial ? "Unmark as special" : "Mark as special"}
                                                >
                                                    {team.isSpecial ? "Unmark as special" : "Mark as special"}
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRowClick(team.teamId); }}
                                                className="text-gray-400 hover:text-orange-600 transition-colors p-2 rounded-lg hover:bg-white hover:shadow-sm"
                                            >
                                                <span className="material-symbols-outlined text-xl">arrow_forward</span>
                                            </button>
                                        </div>
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
