import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { MentorInvitationDTO } from '../../services/mentorInvitationService';

// Simple relative time formatter (avoid date-fns dep)
const timeAgo = (dateStr?: string): string => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days === 0) return 'today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
};

interface MentorInvitationCardProps {
    invitation: MentorInvitationDTO;
    isAtMaxTeams: boolean;
    isProcessing: boolean;
    onAccept: (id: number) => Promise<void>;
    onDecline: (id: number) => Promise<void>;
}

const MentorInvitationCard: React.FC<MentorInvitationCardProps> = ({
    invitation,
    isAtMaxTeams,
    isProcessing,
    onAccept,
    onDecline
}) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const teamInitials = invitation.teamCode
        ? invitation.teamCode.replace(/[^A-Z0-9]/gi, '').slice(0, 2).toUpperCase()
        : invitation.teamName.slice(0, 2).toUpperCase();

    const relativeTime = timeAgo(invitation.createdAt);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition-shadow">
            {/* Left Block: Team Identity */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="size-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {teamInitials}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{invitation.teamName}</h3>
                        <span className="bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 text-xs font-medium">
                            {invitation.teamCode}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500">
                        Invited by <span className="text-slate-700 font-medium">{invitation.invitedByName}</span>
                        {relativeTime && ` · ${relativeTime}`}
                    </p>
                </div>
            </div>
            {/* Center Block: Details */}
            <div className="flex flex-col gap-3 flex-1 px-0 md:px-6 md:border-x border-slate-100 min-w-0">
                {/* Thesis Info Box */}
                {invitation.thesisTitle && (
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100/50">
                        <div className="flex items-start gap-2.5">
                            <i className="pi pi-book text-slate-400 text-xs mt-1 shrink-0" />
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-slate-800 line-clamp-1 mb-1.5" title={invitation.thesisTitle}>
                                    {invitation.thesisTitle}
                                </span>
                                <div className="flex items-center gap-2">
                                    {invitation.thesisStatus && (
                                        <span className={`text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-md border
                                            ${invitation.thesisStatus === 'Published'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : invitation.thesisStatus === 'Reviewing'
                                                    ? 'bg-sky-50 text-sky-600 border-sky-100'
                                                    : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                            {invitation.thesisStatus}
                                        </span>
                                    )}
                                    {invitation.thesisId && (
                                        <Link
                                            to={`/thesis/${invitation.thesisId}`}
                                            className="text-[10px] text-sky-600 hover:text-sky-700 font-bold flex items-center gap-0.5 transition-colors group/link"
                                        >
                                            Details
                                            <i className="pi pi-external-link text-[8px] group-hover/link:translate-x-0.5 transition-transform" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-1.5">
                    {/* Leader info */}
                    <div className="flex items-center gap-2 text-slate-500">
                        <i className="pi pi-user text-[10px]" />
                        <span className="text-xs font-medium truncate">{invitation.invitedByEmail}</span>
                    </div>
                    {/* Invited date */}
                    <div className="flex items-center gap-2 text-slate-400">
                        <i className="pi pi-calendar text-[10px]" />
                        <span className="text-[11px] font-medium">
                            {invitation.createdAt
                                ? new Date(invitation.createdAt).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                })
                                : '—'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right Block: Status + Actions */}
            <div className="flex items-center gap-3 shrink-0">
                <span className="bg-amber-100 text-amber-700 rounded-full text-xs px-3 py-1 font-medium">
                    Pending
                </span>

                {/* Decline */}
                <button
                    onClick={() => onDecline(invitation.invitationId)}
                    disabled={isProcessing}
                    className="border border-red-400 text-red-500 rounded-full px-5 py-2 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                    ) : (
                        'Decline'
                    )}
                </button>

                {/* Accept (with disabled state + tooltip) */}
                <div
                    className="relative"
                    onMouseEnter={() => isAtMaxTeams && setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <button
                        onClick={() => !isAtMaxTeams && !isProcessing && onAccept(invitation.invitationId)}
                        disabled={isAtMaxTeams || isProcessing}
                        className={`rounded-full px-5 py-2 text-sm font-medium transition-colors
                            ${isAtMaxTeams || isProcessing
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-sky-500 text-white hover:bg-sky-600 shadow-sm shadow-sky-200 cursor-pointer'
                            }`}
                    >
                        {isProcessing ? (
                            <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                        ) : (
                            '✓ Accept'
                        )}
                    </button>

                    {/* Tooltip */}
                    {isAtMaxTeams && showTooltip && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max bg-slate-900 text-white text-xs rounded px-2 py-1 z-10 shadow-lg whitespace-nowrap">
                            You've reached the 4-team limit
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MentorInvitationCard;
