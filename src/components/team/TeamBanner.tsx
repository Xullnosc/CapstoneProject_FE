import React from 'react';
import type { Team } from '../../types/team';

interface TeamBannerProps {
    team: Team | null;
    isLeader: boolean;
    onEdit?: () => void;
}

const TeamBanner: React.FC<TeamBannerProps> = ({ team, isLeader, onEdit }) => {
    if (!team) return null;

    return (
        <section className="mb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-6 bg-white dark:bg-[#2d1f14] rounded-xl shadow-sm border border-[#f4ece6] dark:border-[#3d2a1d]">
                <div className="flex gap-6 items-start">
                    <div className="relative">
                        <div
                            className="size-28 bg-center bg-no-repeat bg-contain bg-white rounded-xl shadow-inner border border-white/10 p-2"
                            style={{ backgroundImage: `url("${team.teamAvatar || "https://cdn.haitrieu.com/wp-content/uploads/2021/10/Logo-Dai-hoc-FPT.png"}")` }}
                        ></div>
                        {isLeader && (
                            <button
                                onClick={onEdit}
                                className="absolute -bottom-2 -right-2 size-8 bg-white dark:bg-[#3d2a1d] rounded-full shadow-md flex items-center justify-center border border-[#f4ece6] dark:border-white/10 text-[#9e6b47]"
                            >
                                <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-[#1c130d] dark:text-white text-3xl font-extrabold tracking-tight">{team.teamName}</h1>
                            {isLeader && (
                                <span
                                    className="material-symbols-outlined text-[#9e6b47] cursor-pointer hover:text-[#f97415] transition-colors"
                                    onClick={onEdit}
                                >
                                    edit
                                </span>
                            )}
                        </div>
                        <p className="text-[#9e6b47] text-base font-medium">Team Code: {team.teamCode}</p>
                        {isLeader ? (
                            <div className="mt-2 inline-flex items-center gap-1.5 bg-[#fef3c7] dark:bg-[#4d3a1f] text-[#b45309] dark:text-[#fcd34d] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
                                Team Leader
                            </div>
                        ) : (
                            <div className="mt-2 inline-flex items-center gap-1.5 bg-[#e5e7eb] dark:bg-[#3d2a1d] text-[#6b7280] dark:text-[#9ca3af] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-sm">person</span>
                                Member
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TeamBanner;
