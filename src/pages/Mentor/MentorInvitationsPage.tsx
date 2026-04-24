import React from 'react';
import { Link } from 'react-router-dom';

import { useMentorInvitations } from '../../hooks/useMentorInvitations';
import MentorInvitationCard from '../../components/mentor/MentorInvitationCard';
import Swal from '../../utils/swal';
import axios from 'axios';
import PremiumBreadcrumb from '../../components/Common/PremiumBreadcrumb';

const MAX_TEAMS = 4;

// Skeleton card for loading state
const SkeletonCard = () => (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="flex items-center gap-4">
            <div className="size-12 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-2/5" />
                <div className="h-3 bg-slate-100 rounded w-3/5" />
            </div>
            <div className="flex gap-3">
                <div className="h-9 w-24 bg-slate-100 rounded-full" />
                <div className="h-9 w-24 bg-slate-200 rounded-full" />
            </div>
        </div>
    </div>
);

const MentorInvitationsPage: React.FC = () => {
    const { invitations, isLoading, processingIds, activeTeamCount, accept, decline } = useMentorInvitations();
    const isAtMaxTeams = activeTeamCount >= MAX_TEAMS;
    const capacityPercent = Math.round((activeTeamCount / MAX_TEAMS) * 100);

    const handleAccept = async (id: number) => {
        try {
            await accept(id);
            Swal.fire({
                icon: 'success',
                title: 'Accepted!',
                text: 'You are now the mentor for this team.',
                timer: 1800,
                showConfirmButton: false,
                backdrop: false
            });
        } catch (err) {
            let message = 'Failed to accept invitation.';
            if (axios.isAxiosError(err)) {
                message = err.response?.data?.message ?? message;
            }
            Swal.fire({ icon: 'error', title: 'Error', text: message, backdrop: false });
        }
    };

    const handleDecline = async (id: number) => {
        const result = await Swal.fire({
            title: 'Decline this invitation?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, decline',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            await decline(id);
            Swal.fire({
                icon: 'success',
                title: 'Declined',
                timer: 1500,
                showConfirmButton: false,
                backdrop: false
            });
        } catch (err) {
            let message = 'Failed to decline invitation.';
            if (axios.isAxiosError(err)) {
                message = err.response?.data?.message ?? message;
            }
            Swal.fire({ icon: 'error', title: 'Error', text: message, backdrop: false });
        }
    };
    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="bg-white border-b border-gray-200 mb-8">
                <div className="max-w-[1200px] mx-auto w-full px-6 py-5">
                    <PremiumBreadcrumb items={[
                        { label: 'Home', to: '/home' },
                        { label: 'Mentor Invitations' }
                    ]} />

                    <div className="flex flex-col md:flex-row md:items-end justify-between mt-4 gap-4">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mentor Invitations</h1>
                            <p className="text-sm font-medium text-slate-500">Review and respond to team mentor requests</p>
                        </div>

                        <div className="bg-orange-50/50 rounded-2xl border border-orange-100 p-3 px-4 shadow-sm w-full md:w-64 shrink-0">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-orange-700">
                                    🎓 Mentoring {activeTeamCount} / {MAX_TEAMS} teams
                                </span>
                                <span className={`text-xs font-black uppercase ${isAtMaxTeams ? 'text-red-500' : 'text-orange-600'}`}>
                                    {isAtMaxTeams ? 'Full' : `${MAX_TEAMS - activeTeamCount} left`}
                                </span>
                            </div>
                            <div className="w-full bg-orange-200/30 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full transition-all ${isAtMaxTeams ? 'bg-red-400' : 'bg-orange-500'}`}
                                    style={{ width: `${capacityPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1200px] mx-auto w-full px-6 pb-12 flex flex-col gap-10">

            {/* Invitation List */}
            <section className="flex flex-col gap-4">
                {isLoading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : invitations.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-4xl text-slate-300">mark_email_unread</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-1">No pending invitations</h3>
                        <p className="text-slate-400 text-sm">You're all caught up for this semester.</p>
                    </div>
                ) : (
                    invitations.map(invitation => (
                        <MentorInvitationCard
                            key={invitation.invitationId}
                            invitation={invitation}
                            isAtMaxTeams={isAtMaxTeams}
                            isProcessing={processingIds.has(invitation.invitationId)}
                            onAccept={handleAccept}
                            onDecline={handleDecline}
                        />
                    ))
                )}
            </section>
        </main>
    </div>
);
};

export default MentorInvitationsPage;
