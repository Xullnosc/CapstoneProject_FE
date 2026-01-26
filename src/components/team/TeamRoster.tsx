import React from 'react';
import type { TeamMember } from '../../types/team';
import MemberAvatar from './MemberAvatar';

interface TeamRosterProps {
    members: TeamMember[];
    isLeader: boolean;
    leaderId: number;
    currentUserId: number | null;
    onKick?: (userId: number) => void;
    onInvite?: () => void;
}

const TeamRoster: React.FC<TeamRosterProps> = ({ members, isLeader, leaderId, currentUserId, onKick, onInvite }) => {
    return (
        <section className="mb-10">
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-[#1c130d] text-xl font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#f97415]">groups</span>
                    Team Roster
                </h2>
                {isLeader && (
                    <button
                        onClick={onInvite}
                        className="text-[#f97415] text-sm font-bold flex items-center gap-1 hover:underline"
                    >
                        <span className="material-symbols-outlined text-sm">person_add</span>
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
                                    {isLeader && member.studentId !== leaderId ? (
                                        <button
                                            onClick={() => onKick && onKick(member.studentId)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors group-hover:opacity-100 opacity-60"
                                        >
                                            <span className="material-symbols-outlined text-xl">delete</span>
                                            <span className="text-xs font-bold uppercase">Kick</span>
                                        </button>
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-300 text-xl cursor-not-allowed">lock</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mentor Status Section */}
            <div className="mt-4 px-1">
                {!isLeader && (
                    <p className="text-gray-500 italic text-sm text-center">Waiting for Team Leader to select a mentor...</p>
                )}
                {isLeader && (
                    <div className="text-center">
                        <button className="text-orange-500 text-sm font-bold hover:underline">
                            + Invite Mentor
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default TeamRoster;
