import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamService } from '../../services/teamService';
import type { TeamInvitation } from '../../types/team';
import InvitationCard from '../../components/team/InvitationCard';
import axios from 'axios';

const TeamCreate: React.FC = () => {
    const navigate = useNavigate();
    const [teamName, setTeamName] = useState('');
    const [invitations, setInvitations] = useState<TeamInvitation[]>([]); // Initial state is empty, will be populated by useEffect
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const checkTeamStatus = async () => {
            try {
                setLoading(true);
                // 1. Check if user has team
                const myTeam = await teamService.getMyTeam();
                if (myTeam) {
                    navigate(`/teams/${myTeam.teamId}`);
                    return;
                }

                // 2. Fetch invitations
                const myInvitations = await teamService.getMyInvitations();
                setInvitations(myInvitations);
            } catch (err) {
                console.error("Failed to load team data", err);
            } finally {
                setLoading(false);
            }
        };

        checkTeamStatus();
    }, [navigate]);

    const handleCreateTeam = async () => {
        if (!teamName.trim() || teamName.length < 3) {
            setError("Team name must be at least 3 characters");
            return;
        }

        try {
            setCreating(true);
            setError('');
            const newTeam = await teamService.createTeam({ teamName, description: '' });
            navigate(`/teams/${newTeam.teamId}`);
        } catch (err) {
            let message = "Failed to create team";
            if (axios.isAxiosError(err)) {
                message = err.response?.data?.message || message;
            }
            setError(message);
        } finally {
            setCreating(false);
        }
    };

    const handleAccept = async (id: number) => {
        try {
            await teamService.acceptInvitation(id);
            // After accepting, we should probably redirect to the team
            // But let's fetch myTeam again to be sure and redirect
            const myTeam = await teamService.getMyTeam();
            if (myTeam) {
                navigate(`/teams/${myTeam.teamId}`);
            }
        } catch (err) {
            let message = "Failed to accept invitation";
            if (axios.isAxiosError(err)) {
                message = err.response?.data?.message || message;
            }
            alert(message);
        }
    };

    const handleDecline = async (id: number) => {
        try {
            await teamService.declineInvitation(id);
            setInvitations(prev => prev.filter(inv => inv.invitationId !== id));
        } catch (err) {
            let message = "Failed to decline invitation";
            if (axios.isAxiosError(err)) {
                message = err.response?.data?.message || message;
            }
            alert(message);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="layout-container flex h-full grow flex-col min-h-full text-neutral-dark transition-colors duration-200">
            {/* Main Content */}
            <main className="flex flex-1 justify-center py-12 px-4">
                <div className="layout-content-container flex flex-col max-w-[600px] flex-1">
                    {/* Info Badge */}
                    <div className="flex justify-center mb-6">
                        <div className="flex h-9 items-center justify-center gap-x-2 rounded-full bg-[#F26F21]/10 px-4 border border-[#F26F21]/20">
                            <span className="material-symbols-outlined text-[#F26F21] text-[18px]">info</span>
                            <p className="text-[#F26F21] text-sm font-semibold leading-normal">You haven't joined a team yet</p>
                        </div>
                    </div>

                    {/* Headline */}
                    <h1 className="text-neutral-dark tracking-tight text-[32px] md:text-[40px] font-extrabold leading-tight text-center pb-8">
                        Ready to kick off your Capstone?<br />Give your team a name.
                    </h1>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 text-center text-red-500 font-semibold">
                            {error}
                        </div>
                    )}

                    {/* Team Creation Form */}
                    <div className="space-y-4 mb-10">
                        <div className="flex flex-col gap-4">
                            <label className="flex flex-col w-full">
                                <input
                                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-full text-gray-900 focus:outline-0 focus:ring-2 focus:ring-orange-500/50 border border-gray-200 bg-white h-16 placeholder:text-gray-400 px-8 text-xl font-medium leading-normal transition-all shadow-sm"
                                    placeholder="e.g., The Visionaries"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                />
                            </label>
                            <button
                                onClick={handleCreateTeam}
                                disabled={creating}
                                className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 px-6 bg-[#F26F21] hover:bg-[#F26F21]/90 text-white text-lg font-bold leading-normal tracking-wide shadow-lg shadow-[#F26F21]/20 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                <span className="truncate">{creating ? 'Creating...' : 'Create & Start Recruiting'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="relative flex items-center py-5 mb-8">
                        <div className="flex-grow border-t border-[#e5e7eb]"></div>
                        <span className="flex-shrink mx-4 text-xs font-bold text-neutral-400 uppercase tracking-[0.2em]">OR</span>
                        <div className="flex-grow border-t border-[#e5e7eb]"></div>
                    </div>

                    {/* Invitations Section */}
                    {invitations.length > 0 && (
                        <div className="flex flex-col gap-4">
                            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest px-1 mb-2">Pending Invitations</h3>
                            {invitations.map(invitation => (
                                <InvitationCard
                                    key={invitation.invitationId}
                                    invitation={invitation}
                                    onAccept={handleAccept}
                                    onDecline={handleDecline}
                                />
                            ))}
                        </div>
                    )}
                    {invitations.length === 0 && (
                        <div className="text-center text-neutral-400 italic">
                            No pending invitations
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TeamCreate;
