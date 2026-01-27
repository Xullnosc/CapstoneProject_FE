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
            <main className="flex flex-1 justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="layout-content-container flex flex-col max-w-[800px] flex-1 w-full">

                    {/* Headline - Big & Gradient */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.1] mb-4">
                            Give your team a <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F26F21] to-orange-500">Legendary Name</span>
                        </h1>
                        <p className="text-gray-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                            This is the beginning of something great. Choose a name that represents your vision.
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 flex items-center justify-center gap-2 text-red-500 bg-red-50 py-3 px-4 rounded-xl border border-red-100 animate-fadein">
                            <span className="material-symbols-outlined icon-filled">error</span>
                            <span className="font-semibold">{error}</span>
                        </div>
                    )}

                    {/* Team Creation Form - Premium Input */}
                    <div className="space-y-8 mb-16 relative">
                        <div className="flex flex-col gap-6 relative z-10">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-orange-200 to-orange-100 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <input
                                    type="text"
                                    aria-label="Team Name"
                                    className="relative block w-full rounded-[2rem] border-0 bg-white py-6 px-10 text-gray-900 placeholder:text-gray-300 focus:ring-4 focus:ring-orange-500/20 text-3xl md:text-4xl font-bold shadow-xl shadow-orange-500/5 transition-all text-center placeholder:font-bold h-24 sm:h-28"
                                    placeholder="e.g. The Visionaries"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleCreateTeam}
                                disabled={creating}
                                className="group relative flex w-full md:w-2/3 mx-auto cursor-pointer items-center justify-center overflow-hidden rounded-[2rem] h-16 bg-gradient-to-r from-[#F26F21] to-orange-600 text-white text-xl font-bold tracking-wide shadow-xl shadow-orange-500/30 transition-all hover:scale-[1.02] hover:shadow-orange-500/50 active:scale-[0.98] disabled:opacity-70 disabled:grayscale disabled:scale-100"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-[2rem]"></div>
                                <span className="relative flex items-center gap-3">
                                    {creating ? 'Creating Team...' : (
                                        <>
                                            Create & Start Recruiting
                                            <i className="pi pi-arrow-right text-lg group-hover:translate-x-1 transition-transform"></i>
                                        </>
                                    )}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="relative flex items-center py-5 mb-10">
                        <div className="flex-grow border-t-2 border-dashed border-gray-200"></div>
                        <span className="flex-shrink mx-6 text-xs font-extrabold text-gray-400 uppercase tracking-[0.2em] bg-transparent">OR JOIN AN EXISTING TEAM</span>
                        <div className="flex-grow border-t-2 border-dashed border-gray-200"></div>
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
