import React from 'react';
import type { TeamMember } from '../../types/team';

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
                <h2 className="text-[#1c130d] dark:text-white text-xl font-bold flex items-center gap-2">
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

            <div className="bg-white dark:bg-[#2d1f14] rounded-xl border border-[#f4ece6] dark:border-[#3d2a1d] shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#fcfaf8] dark:bg-[#3d2a1d]/50 border-b border-[#f4ece6] dark:border-[#3d2a1d]">
                            <th className="px-6 py-4 text-xs font-bold text-[#9e6b47] uppercase tracking-wider">Member Profile & ID</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#9e6b47] uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-[#9e6b47] uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f4ece6] dark:divide-[#3d2a1d]">
                        {members.map(member => (
                            <tr key={member.studentId} className="group hover:bg-[#fcfaf8] dark:hover:bg-[#3d2a1d]/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="size-10 rounded-full bg-cover bg-center border border-[#f4ece6] dark:border-[#3d2a1d]"
                                            style={{ backgroundImage: `url("${member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=random&color=fff`}")` }}
                                        ></div>
                                        <div>
                                            <p className="text-[#1c130d] dark:text-white font-bold text-sm">
                                                {member.fullName}
                                                {member.studentId === currentUserId && <span className="text-[#f97415] ml-1">(You)</span>}
                                                {member.studentId === leaderId && <span className="text-[#b45309] dark:text-[#fcd34d] ml-1">(Leader)</span>}
                                            </p>
                                            <p className="text-[#9e6b47] text-xs">ID: {member.studentCode} • {member.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {member.role === 'Leader' ? (
                                        <div className="flex items-center gap-1.5 text-[#b45309] dark:text-[#fcd34d]">
                                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
                                            <span className="text-xs font-bold uppercase tracking-wide">Team Leader</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-semibold text-[#9e6b47] uppercase tracking-wide">Member</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {isLeader && member.studentId !== leaderId ? (
                                        <button
                                            onClick={() => onKick && onKick(member.studentId)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group-hover:opacity-100 opacity-60"
                                        >
                                            <span className="material-symbols-outlined text-xl">delete</span>
                                            <span className="text-xs font-bold uppercase">Kick</span>
                                        </button>
                                    ) : (
                                        <span className="material-symbols-outlined text-[#9e6b47]/30 text-xl cursor-not-allowed">lock</span>
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
                    <p className="text-[#9e6b47] italic text-sm text-center">Waiting for Team Leader to select a mentor...</p>
                )}
                {isLeader && (
                    <div className="text-center">
                        <button className="text-[#f97415] text-sm font-bold hover:underline">
                            + Invite Mentor
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default TeamRoster;
