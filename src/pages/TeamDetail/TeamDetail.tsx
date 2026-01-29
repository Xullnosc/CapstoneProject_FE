import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';
import { teamService } from '../../services/teamService';
import type { Team } from '../../types/team';
import TeamBanner from '../../components/team/TeamBanner';
import ProjectStatusSection from '../../components/team/ProjectStatusSection';
import TeamRoster from '../../components/team/TeamRoster';
import DangerZone from '../../components/team/DangerZone';
import EditTeamModal from '../../components/team/EditTeamModal';
import axios from 'axios';

interface DecodedToken {
    nameid?: string;
    sub?: string;
    role: string | string[];
    [key: string]: unknown;
}

const TeamDetail: React.FC = () => {
    const { teamId } = useParams<{ teamId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const loadTeam = useCallback(async (id: number) => {
        try {
            setLoading(true);
            const data = await teamService.getTeamById(id);
            if (!data) {
                navigate('/teams');
                return;
            }
            setTeam(data);
        } catch (err: unknown) {
            console.error("Failed to load team", err);

            if (axios.isAxiosError(err) && err.response && err.response.status === 403) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Access Denied',
                    text: err.response.data?.message || 'You are not a member of this team.',
                    confirmButtonColor: '#F26F21'
                });
            } else if (axios.isAxiosError(err) && err.response && err.response.status === 404) {
                Swal.fire({
                    icon: 'error',
                    title: 'Not Found',
                    text: 'Team not found.',
                    confirmButtonColor: '#F26F21'
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to load team details'
                });
            }
            navigate('/teams');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode<DecodedToken>(token);
                const userIdStr = (decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] as string) || decoded.nameid || decoded.sub;
                if (userIdStr) {
                    setCurrentUserId(parseInt(userIdStr));
                }
            } catch (e: unknown) {
                console.error("Failed to decode token", e);
            }
        }
    }, []);

    useEffect(() => {
        // Case 1: URL has ID (e.g. /teams/123) -> Redirect to /teams/team (Mask the ID)
        if (teamId) {
            navigate('/teams/team', {
                state: { targetId: parseInt(teamId) },
                replace: true
            });
            return;
        }

        // Case 2: Static URL /teams/team
        const targetId = location.state?.targetId;

        if (targetId) {
            // Sub-case 2.1: Loading specific team from hidden state
            loadTeam(targetId);
        } else {
            // Sub-case 2.2: Loading "My Team" (Default)
            const loadMyTeam = async () => {
                try {
                    setLoading(true);
                    const myTeam = await teamService.getMyTeam();
                    if (myTeam) {
                        setTeam(myTeam);
                    } else {
                        navigate('/teams');
                    }
                } catch (error) {
                    console.error("Failed to load my team", error);
                    navigate('/teams');
                } finally {
                    setLoading(false);
                }
            };
            loadMyTeam();
        }
    }, [teamId, loadTeam, navigate, location.state]);

    const handleKick = async (userId: number) => {
        const result = await Swal.fire({
            title: 'Kick Member?',
            text: "Are you sure you want to remove this member from the team?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, kick them!'
        });

        if (result.isConfirmed) {
            try {
                if (team && team.teamId) {
                    await teamService.kickMember(team.teamId, userId);
                    Swal.fire(
                        'Kicked!',
                        'The member has been removed.',
                        'success'
                    );
                    loadTeam(team.teamId); // Reload
                }
            } catch (err) {
                let message = 'Failed to kick member.';
                if (axios.isAxiosError(err)) {
                    message = err.response?.data?.message || message;
                }
                Swal.fire('Error!', message, 'error');
            }
        }
    };

    const handleDisband = async () => {
        const result = await Swal.fire({
            title: 'Disband Team?',
            text: "This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, disband it!'
        });

        if (result.isConfirmed) {
            try {
                if (team && team.teamId) {
                    await teamService.disbandTeam(team.teamId);
                    await Swal.fire(
                        'Disbanded!',
                        'Your team has been disbanded.',
                        'success'
                    );
                    navigate('/teams');
                }
            } catch (err) {
                let message = 'Failed to disband team.';
                if (axios.isAxiosError(err)) {
                    message = err.response?.data?.message || message;
                }
                Swal.fire('Error!', message, 'error');
            }
        }
    };

    const handleLeave = async () => {
        if (isLeader) {
            await Swal.fire({
                title: 'Cannot Leave Team',
                text: "You are the Team Leader. You must transfer leadership to another member before leaving.",
                icon: 'error',
                confirmButtonColor: '#F26F21'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Leave Team?',
            text: "Are you sure you want to leave this team?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, leave!'
        });

        if (result.isConfirmed) {
            try {
                if (team && team.teamId) {
                    await teamService.leaveTeam(team.teamId);
                    await Swal.fire(
                        'Left!',
                        'You have left the team.',
                        'success'
                    );
                    navigate('/teams');
                }
            } catch (err) {
                let message = 'Failed to leave team.';
                if (axios.isAxiosError(err)) {
                    message = err.response?.data?.message || message;
                }
                Swal.fire('Error!', message, 'error');
            }
        }
    };

    const handleTransferRole = async (userId: number) => {
        const member = team?.members.find(m => m.studentId === userId);
        const memberName = member ? member.fullName : 'this member';

        const result = await Swal.fire({
            title: 'Transfer Leadership?',
            text: `Are you sure you want to transfer leadership to ${memberName}? You will become a regular member.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, transfer!'
        });

        if (result.isConfirmed) {
            try {
                if (team && team.teamId) {
                    await teamService.transferLeader(team.teamId, userId);
                    await Swal.fire(
                        'Transferred!',
                        `Leadership has been transferred to ${memberName}.`,
                        'success'
                    );
                    loadTeam(team.teamId); // Reload to reflect changes
                }
            } catch (err) {
                let message = 'Failed to transfer leadership.';
                if (axios.isAxiosError(err)) {
                    message = err.response?.data?.message || message;
                }
                Swal.fire('Error!', message, 'error');
            }
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Team Details...</div>;
    if (!team) return null;

    const isLeader = !!(currentUserId && team.leaderId === currentUserId);

    return (
        <div className="layout-container flex h-full grow flex-col min-h-full transition-colors duration-200">
            <main className="flex flex-1 justify-center py-8 px-4 md:px-8">
                <div className="layout-content-container flex flex-col max-w-[960px] flex-1">

                    {/* Team Banner */}
                    <TeamBanner
                        team={team}
                        isLeader={isLeader}
                        onEdit={() => setIsEditModalOpen(true)}
                    />

                    <EditTeamModal
                        isOpen={isEditModalOpen}
                        closeModal={() => setIsEditModalOpen(false)}
                        team={team}
                        onUpdateSuccess={() => loadTeam(team.teamId)}
                    />


                    {/* Project Status */}
                    <ProjectStatusSection team={team} isLeader={isLeader} />


                    {/* Roster */}
                    <TeamRoster
                        members={team.members}
                        isLeader={isLeader}
                        leaderId={team.leaderId}
                        currentUserId={currentUserId}
                        teamId={team.teamId}
                        onKick={handleKick}
                        onLeave={handleLeave}
                        onTransferRole={handleTransferRole}
                    />

                    {/* Danger Zone (Leader Only) */}
                    {isLeader && (
                        <div className="mb-6">
                            <DangerZone onAction={handleDisband} actionType="disband" />
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default TeamDetail;
