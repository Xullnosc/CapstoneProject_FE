import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamService } from '../../services/teamService';
import type { Team } from '../../types/team';
import { ProgressSpinner } from 'primereact/progressspinner';
import PremiumBreadcrumb from '../../components/Common/PremiumBreadcrumb';

const MentorTeamsPage = () => {
    const navigate = useNavigate();
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                setIsLoading(true);
                const data = await teamService.getMentorTeams();
                setTeams(data);
            } catch {
                setError('Could not load your mentor teams. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTeams();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/40 to-white">
                <div className="flex flex-col items-center gap-4">
                    <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" fill="transparent" animationDuration="1s" />
                    <p className="text-gray-500 font-medium">Loading your teams…</p>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="bg-white border-b border-gray-200 mb-8">
                <div className="max-w-[1200px] mx-auto w-full px-6 py-5">
                    {/* Breadcrumb */}
                    <PremiumBreadcrumb items={[
                        { label: 'Home', to: '/home' },
                        { label: 'My Mentor Teams' }
                    ]} />

                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 gap-6">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Mentor Teams</h1>
                            <p className="text-sm font-medium text-gray-500">
                                You are currently mentoring <span className="font-bold text-orange-600">{teams.length}</span> team{teams.length !== 1 ? 's' : ''} this semester.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1200px] mx-auto w-full px-6 pb-12 flex flex-col gap-10">

                {/* Error state */}
                {error && (
                    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                        <span className="material-symbols-outlined text-red-400">error</span>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {/* Empty state */}
                {!error && teams.length === 0 && (
                    <div className="flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm py-20 gap-4">
                        <span className="material-symbols-outlined text-6xl text-gray-300">group_off</span>
                        <h2 className="text-xl font-semibold text-gray-700">No Teams Yet</h2>
                        <p className="text-gray-400 text-sm text-center max-w-xs">
                            You haven't accepted any mentor invitations for the current semester. Accept an invitation to get started.
                        </p>
                        <button
                            onClick={() => navigate('/mentor-invitations')}
                            className="mt-2 flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-orange-200/50 hover:from-orange-600 hover:to-orange-700 transition-all duration-300"
                        >
                            <span className="material-symbols-outlined text-lg">mail</span>
                            View Invitations
                        </button>
                    </div>
                )}

                {/* Team Cards */}
                {!error && teams.length > 0 && (
                    <div className="grid gap-4">
                        {teams.map((team) => (
                            <div
                                key={team.teamId}
                                onClick={() => navigate(`/teams/${team.teamId}`)}
                                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-300 cursor-pointer overflow-hidden"
                            >
                                <div className="flex items-center gap-5 p-5">
                                    {/* Team Avatar */}
                                    <div className="flex-shrink-0">
                                        <img
                                            src={team.teamAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(team.teamName)}&background=fb923c&color=fff`}
                                            alt={team.teamName}
                                            className="size-14 rounded-2xl object-cover shadow-sm border border-orange-100"
                                        />
                                    </div>

                                    {/* Team Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h2 className="text-lg font-bold text-gray-900 truncate group-hover:text-orange-600 transition-colors">{team.teamName}</h2>
                                            <span className="flex-shrink-0 text-xs font-mono font-semibold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg border border-orange-100">
                                                {team.teamCode}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-sm line-clamp-1">{team.description || 'No description provided.'}</p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <span className="material-symbols-outlined text-sm">group</span>
                                                <span>{team.memberCount} member{team.memberCount !== 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold border text-xs ${team.status === 'Sufficient'
                                                        ? 'bg-green-50 text-green-700 border-green-200'
                                                        : team.status === 'Insufficient'
                                                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                            : 'bg-gray-50 text-gray-600 border-gray-200'
                                                    }`}>
                                                    {team.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chevron */}
                                    <div className="flex-shrink-0 text-gray-300 group-hover:text-orange-400 transition-colors">
                                        <span className="material-symbols-outlined text-2xl">chevron_right</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MentorTeamsPage;
