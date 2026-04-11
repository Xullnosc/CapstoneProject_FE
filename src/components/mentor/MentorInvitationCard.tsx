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
    const [isAccepting, setIsAccepting] = useState(false);
    const [isDeclining, setIsDeclining] = useState(false);

    const teamInitials = invitation.teamCode
        ? invitation.teamCode.replace(/[^A-Z0-9]/gi, '').slice(0, 2).toUpperCase()
        : invitation.teamName.slice(0, 2).toUpperCase();

    const relativeTime = timeAgo(invitation.createdAt);

    const handleAccept = async () => {
        if (isAtMaxTeams || isProcessing) return;
        setIsAccepting(true);
        try {
            await onAccept(invitation.invitationId);
        } finally {
            setIsAccepting(false);
        }
    };

    const handleDecline = async () => {
        if (isProcessing) return;
        setIsDeclining(true);
        try {
            await onDecline(invitation.invitationId);
        } finally {
            setIsDeclining(false);
        }
    };

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
            <div className="flex flex-col gap-4 flex-1 px-0 md:px-8 md:border-x border-slate-100 min-w-0">
                {/* Thesis Info: Premium Proposal Card */}
                {invitation.thesisTitle && (
                    <div className="group/thesis relative bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 border border-slate-100/80 shadow-sm hover:shadow-md hover:border-orange-100/50 transition-all duration-300">
                        <div className="flex items-start gap-3">
                            <div className="size-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 group-hover/thesis:border-orange-400/30 group-hover/thesis:text-orange-500 transition-all duration-500 shrink-0">
                                <span className="material-symbols-outlined text-xl">description</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Capstone Proposal</span>
                                </div>
                                <h4 className="text-sm font-black text-slate-800 line-clamp-1 mb-2" title={invitation.thesisTitle}>
                                    {invitation.thesisTitle}
                                </h4>
                                {invitation.thesisId && (
                                    <Link
                                        to={`/thesis/${invitation.thesisId}`}
                                        className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-orange-600 hover:text-orange-700 transition-all group/link"
                                    >
                                        Review Proposal
                                        <span className="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Meta Information: Leader & Dates */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2 group/meta">
                        <div className="size-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover/meta:text-slate-600 transition-colors">
                            <span className="material-symbols-outlined text-base">person</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none">Leader</span>
                            <span className="text-xs font-semibold text-slate-600 truncate">{invitation.invitedByEmail}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 group/meta">
                        <div className="size-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover/meta:text-slate-600 transition-colors">
                            <span className="material-symbols-outlined text-base">calendar_today</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none">Invited Date</span>
                            <span className="text-xs font-semibold text-slate-600">
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
            </div>

            {/* Right Block: Status + Actions */}
            <div className="flex items-center gap-3 shrink-0">
                <span className="bg-orange-50 text-orange-600 border border-orange-100 rounded-full text-[10px] px-3 py-1 font-black uppercase tracking-wider">
                    Pending
                </span>

                {/* Decline */}
                <button
                    onClick={handleDecline}
                    disabled={isProcessing}
                    className="border border-red-400 text-red-500 rounded-full px-5 py-2 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isDeclining ? (
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
                        onClick={handleAccept}
                        disabled={isAtMaxTeams || isProcessing}
                        className={`rounded-full px-5 py-2 text-sm font-bold transition-all shadow-sm
                            ${isAtMaxTeams || isProcessing
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/50 shadow-none'
                                : 'bg-[#f26f21] text-white hover:bg-[#d95d1a] shadow-orange-200/50 cursor-pointer active:scale-95'
                            }`}
                    >
                        {isAccepting ? (
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
