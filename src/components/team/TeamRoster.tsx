import React, { useState, useRef, useEffect } from 'react';
import type { TeamMember } from '../../types/team';
import MemberAvatar from './MemberAvatar';

interface TeamRosterProps {
    members: TeamMember[];
    isLeader: boolean;
    leaderId: number;
    currentUserId: number | null;
    onKick?: (userId: number) => void;
    onInvite?: () => void;
    onLeave?: () => void;
}

const TeamRoster: React.FC<TeamRosterProps> = ({ members, isLeader, leaderId, currentUserId, onKick, onInvite, onLeave }) => {
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openMenuId !== null) {
                const menuElement = menuRefs.current[openMenuId];
                if (menuElement && !menuElement.contains(event.target as Node)) {
                    setOpenMenuId(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);

    const handleMenuToggle = (memberId: number) => {
        setOpenMenuId(openMenuId === memberId ? null : memberId);
    };

    const handleTransferLeadership = () => {
        // TODO: Implement transfer leadership functionality
        setOpenMenuId(null);
        alert('Transfer Leadership functionality coming soon!');
    };

    const handleRemove = (memberId: number) => {
        setOpenMenuId(null);
        if (onKick) {
            onKick(memberId);
        }
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
                        onClick={onInvite}
                        className="text-[#f97415] text-sm font-bold flex items-center gap-1 hover:underline"
                    >
                        <i className="pi pi-user-plus"></i>
                        Invite Member
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-visible">
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
                                    <div className="flex justify-end w-full">
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
                                            <div className="relative" ref={(el) => { menuRefs.current[member.studentId] = el; }}>
                                                <button
                                                    onClick={() => handleMenuToggle(member.studentId)}
                                                    className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                                    title="More options"
                                                >
                                                    <span className="material-symbols-outlined text-xl text-gray-600">more_vert</span>
                                                </button>
                                                {openMenuId === member.studentId && (
                                                    <div className="absolute z-1 right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 animate-[fadeIn_0.2s_ease-out,slideDown_0.2s_ease-out]">
                                                        <button
                                                            onClick={handleTransferLeadership}
                                                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-150 flex items-center gap-2 first:rounded-t-lg cursor-pointer hover:translate-x-0.5"
                                                        >
                                                            <span className="material-symbols-outlined text-lg transition-transform duration-150">swap_horiz</span>
                                                            <span>Transfer Leadership</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemove(member.studentId)}
                                                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all duration-150 flex items-center gap-2 last:rounded-b-lg cursor-pointer hover:translate-x-0.5"
                                                        >
                                                            <span className="material-symbols-outlined text-lg transition-transform duration-150">delete</span>
                                                            <span>Remove</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="material-symbols-outlined text-gray-300 text-xl cursor-not-allowed">lock</span>
                                        )}
                                    </div>
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
