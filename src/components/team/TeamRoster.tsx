import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TeamMember } from '../../types/team';
import MemberAvatar from './MemberAvatar';
import InviteMemberModal from './InviteMemberModal';
import InviteMentorModal from './InviteMentorModal';

interface TeamRosterProps {
    members: TeamMember[];
    isLeader: boolean;
    leaderId: number;
    mentorId?: number;
    mentorName?: string;
    mentorEmail?: string;
    mentorAvatar?: string;
    mentorId2?: number;
    mentor2Name?: string;
    mentor2Email?: string;
    mentor2Avatar?: string;
    currentUserId: number | null;
    teamId?: number;
    onKick?: (userId: number) => void;
    onInvite?: () => void;
    onLeave?: () => void;
    onTransferRole?: (userId: number) => void;
}

const TeamRoster: React.FC<TeamRosterProps> = ({
    members, isLeader, leaderId,
    mentorId, mentorName, mentorEmail, mentorAvatar,
    mentorId2, mentor2Name, mentor2Email, mentor2Avatar,
    currentUserId, teamId, onKick, onInvite, onLeave, onTransferRole
}) => {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isInviteMentorModalOpen, setIsInviteMentorModalOpen] = useState(false);
    const navigate = useNavigate();

    const canViewProfile = (id?: number) => typeof id === 'number' && id > 0;
    const goToProfile = (id?: number) => {
        if (!canViewProfile(id)) return;
        navigate(`/profile/${id}`);
    };

    const handleOpenInvite = () => {
        if (onInvite) onInvite();
        setIsInviteModalOpen(true);
    };

    return (
        <section className="mb-10">
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-[#1c130d] text-xl font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#f97415]">groups</span>
                    Team Roster
                </h2>
                {isLeader && (
                    <button
                        onClick={handleOpenInvite}
                        className="text-[#f97415] text-sm font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                        <i className="pi pi-user-plus"></i>
                        Invite Member
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Member Profile & ID</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {members.map(member => (
                            <tr key={member.studentId} className="group hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <MemberAvatar
                                            email={member.email || ''}
                                            fullName={member.fullName}
                                            avatarUrl={member.avatar}
                                            className="size-10 rounded-full object-cover border border-gray-100"
                                        />
                                        <div>
                                            <p className="text-gray-900 font-bold text-sm">
                                                {member.fullName}
                                                {member.studentId === currentUserId && <span className="text-orange-500 ml-1">(You)</span>}
                                                {member.studentId === leaderId && <span className="text-orange-600 ml-1">(Leader)</span>}
                                            </p>
                                            <p className="text-gray-500 text-xs">ID: {member.studentCode} • {member.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {member.role === 'Leader' ? (
                                        <div className="flex items-center gap-1.5 text-orange-600">
                                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
                                            <span className="text-xs font-bold uppercase tracking-wide">Team Leader</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Member</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end w-full gap-2">
                                        <button
                                            type="button"
                                            disabled={!canViewProfile(member.studentId)}
                                            onClick={() => goToProfile(member.studentId)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer
                                                ${canViewProfile(member.studentId)
                                                    ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-orange-600'
                                                    : 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                                                }`}
                                            title="View Profile"
                                        >
                                            <span className="material-symbols-outlined text-[16px] align-middle mr-1">visibility</span>
                                            View
                                        </button>

                                        {member.studentId === currentUserId ? (
                                            <button
                                                onClick={onLeave}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                                title="Leave Team"
                                            >
                                                <span className="material-symbols-outlined text-xl">logout</span>
                                                <span className="text-xs font-bold uppercase">Leave</span>
                                            </button>
                                        ) : isLeader && member.studentId !== leaderId ? (
                                            <div className="flex items-center gap-2">
                                                {onTransferRole && (
                                                    <button
                                                        onClick={() => onTransferRole(member.studentId)}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                                        title="Transfer Leadership"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">swap_horiz</span>
                                                        <span className="text-xs font-bold uppercase">Transfer</span>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onKick && onKick(member.studentId)}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-xl">delete</span>
                                                    <span className="text-xs font-bold uppercase">Kick</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="material-symbols-outlined text-gray-300 text-xl cursor-not-allowed">lock</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {mentorId && (
                            <tr className="bg-blue-50/30 hover:bg-blue-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <MemberAvatar
                                            email={mentorEmail || ''}
                                            fullName={mentorName || 'Mentor'}
                                            avatarUrl={mentorAvatar}
                                            className="size-10 rounded-full object-cover border-2 border-blue-200 shadow-sm"
                                        />
                                        <div>
                                            <p className="text-gray-900 font-bold text-sm">
                                                {mentorName}
                                                {mentorId === currentUserId && <span className="text-blue-600 ml-1">(You)</span>}
                                            </p>
                                            <p className="text-gray-500 text-xs">Role: Mentor (1) • {mentorEmail}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-blue-700">
                                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                                        <span className="text-xs font-bold uppercase tracking-wide">Mentor</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        type="button"
                                        disabled={!canViewProfile(mentorId)}
                                        onClick={() => goToProfile(mentorId)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer
                                            ${canViewProfile(mentorId)
                                                ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-blue-700'
                                                : 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                                            }`}
                                        title="View Profile"
                                    >
                                        <span className="material-symbols-outlined text-[16px] align-middle mr-1">visibility</span>
                                        View
                                    </button>
                                </td>
                            </tr>
                        )}

                        {mentorId2 && (
                            <tr className="bg-blue-50/30 hover:bg-blue-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <MemberAvatar
                                            email={mentor2Email || ''}
                                            fullName={mentor2Name || 'Mentor'}
                                            avatarUrl={mentor2Avatar}
                                            className="size-10 rounded-full object-cover border-2 border-blue-200 shadow-sm"
                                        />
                                        <div>
                                            <p className="text-gray-900 font-bold text-sm">
                                                {mentor2Name}
                                                {mentorId2 === currentUserId && <span className="text-blue-600 ml-1">(You)</span>}
                                            </p>
                                            <p className="text-gray-500 text-xs">Role: Mentor (2) • {mentor2Email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-blue-700">
                                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                                        <span className="text-xs font-bold uppercase tracking-wide">Mentor</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        type="button"
                                        disabled={!canViewProfile(mentorId2)}
                                        onClick={() => goToProfile(mentorId2)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer
                                            ${canViewProfile(mentorId2)
                                                ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-blue-700'
                                                : 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                                            }`}
                                        title="View Profile"
                                    >
                                        <span className="material-symbols-outlined text-[16px] align-middle mr-1">visibility</span>
                                        View
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mentor Status Section */}
            <div className="mt-4 px-1 py-3 border-t border-gray-100">
                {(mentorId && mentorId2) ? (
                    <div className="flex flex-col items-center justify-center gap-3">
                        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold border border-blue-100 shadow-sm">
                            <span className="material-symbols-outlined text-lg">verified_user</span>
                            <span>Mentors Assigned: <span className="font-bold">{mentorName} & {mentor2Name}</span></span>
                        </div>
                    </div>
                ) : isLeader ? (
                    <div className="text-center flex flex-col gap-2">
                        {mentorId && (
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                    Mentor 1: {mentorName}
                                </span>
                            </div>
                        )}
                        <button
                            onClick={() => setIsInviteMentorModalOpen(true)}
                            className="text-orange-500 text-sm font-bold hover:underline cursor-pointer flex items-center gap-1 mx-auto"
                        >
                            <i className="pi pi-user-plus"></i>
                            {mentorId ? "Invite Second Mentor" : "Invite Mentor"}
                        </button>
                    </div>
                ) : (!mentorId && !mentorId2) ? (
                    <p className="text-gray-500 italic text-sm text-center">Waiting for Team Leader to select a mentor...</p>
                ) : null}
            </div>

            {teamId && (
                <InviteMemberModal
                    isOpen={isInviteModalOpen}
                    onClose={() => setIsInviteModalOpen(false)}
                    teamId={teamId}
                />
            )}

            {teamId && (
                <InviteMentorModal
                    isOpen={isInviteMentorModalOpen}
                    onClose={() => setIsInviteMentorModalOpen(false)}
                    teamId={teamId}
                />
            )}
        </section>
    );
};

export default TeamRoster;
