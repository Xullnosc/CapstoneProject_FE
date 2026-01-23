import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';
import { teamService } from '../services/teamService';
import type { Team } from '../types/team';
import TeamBanner from '../components/team/TeamBanner';
import ProjectStatusSection from '../components/team/ProjectStatusSection';
import TeamRoster from '../components/team/TeamRoster';
import DangerZone from '../components/team/DangerZone';
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
    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const loadTeam = useCallback(async (id: number) => {
        try {
            setLoading(true);
            const data = await teamService.getTeamById(id);
            if (!data) {
                navigate('/teams');
                return;
            }
            setTeam(data);
        } catch (err) {
            console.error("Failed to load team", err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load team details'
            });
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
            } catch (e) {
                console.error("Failed to decode token", e);
            }
        }
    }, []);

    useEffect(() => {
        if (teamId) {
            loadTeam(parseInt(teamId));
        }
    }, [teamId, loadTeam]);

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

    if (loading) return <div className="p-10 text-center">Loading Team Details...</div>;
    if (!team) return null;

    const isLeader = !!(currentUserId && team.leaderId === currentUserId);

    return (
        <div className="layout-container flex h-full grow flex-col bg-[#f8f7f5] dark:bg-[#23170f] min-h-screen transition-colors duration-200">
            <main className="flex flex-1 justify-center py-8 px-4 md:px-8">
                <div className="layout-content-container flex flex-col max-w-[960px] flex-1">

                    {/* Team Banner */}
                    <TeamBanner
                        team={team}
                        isLeader={isLeader}
                        onEdit={() => Swal.fire('Info', 'Edit functionality coming soon!', 'info')}
                    />

                    {/* Project Status */}
                    {/* Project Status */}
                    <ProjectStatusSection team={team} isLeader={isLeader} />

                    {/* Roster */}
                    <TeamRoster
                        members={team.members}
                        isLeader={isLeader}
                        leaderId={team.leaderId}
                        currentUserId={currentUserId}
                        onKick={handleKick}
                        onInvite={() => Swal.fire('Info', 'Invite functionality coming soon!', 'info')}
                    />

                    {/* Danger Zone (Leader Only) */}
                    {isLeader && (
                        <DangerZone onDisband={handleDisband} />
                    )}

                </div>
            </main>
        </div>
    );
};

export default TeamDetail;
