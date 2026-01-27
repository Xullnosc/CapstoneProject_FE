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
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex gap-6 items-start">
                    <div className="relative">
                        <div
                            className="size-28 bg-center bg-no-repeat bg-contain bg-white rounded-xl shadow-inner border border-gray-100 p-2"
                            style={{ backgroundImage: `url("${team.teamAvatar || "https://cdn.haitrieu.com/wp-content/uploads/2021/10/Logo-Dai-hoc-FPT.png"}")` }}
                        ></div>
                        {isLeader && (
                            <button
                                onClick={onEdit}
                                className="absolute -bottom-2 -right-2 size-8 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100 text-gray-500 hover:text-orange-500 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-gray-900 text-3xl font-extrabold tracking-tight">{team.teamName}</h1>
                            {isLeader && (
                                <span
                                    className="material-symbols-outlined text-gray-400 cursor-pointer hover:text-orange-500 transition-colors"
                                    onClick={onEdit}
                                >
                                    edit
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 text-base font-medium">Team Code: {team.teamCode}</p>
                        {isLeader ? (
                            <div className="mt-2 inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
                                Team Leader
                            </div>
                        ) : (
                            <div className="mt-2 inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-sm">person</span>
                                Member
                            </div>
                        )}
                    </div>
                </div>
                {/* Description Zone */}
                <div className="flex-1 max-w-lg text-right pl-6 border-l border-gray-100 hidden md:block">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</p>
                    <p className="text-gray-600 text-sm leading-relaxed italic break-all whitespace-pre-line">
                        {team.description || "No description provided."}
                    </p>
                </div>
            </div>
        </section>
    );
};

export default TeamBanner;
