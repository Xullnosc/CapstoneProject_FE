import React from 'react';
import type { TeamInvitation } from '../../types/team';

interface InvitationCardProps {
    invitation: TeamInvitation;
    onAccept: (id: number) => void;
    onDecline: (id: number) => void;
}

const InvitationCard: React.FC<InvitationCardProps> = ({ invitation, onAccept, onDecline }) => {
    return (
        <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
                <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 border border-gray-100"
                    style={{ backgroundImage: `url("${invitation.team.teamAvatar || 'https://via.placeholder.com/100'}")` }}
                ></div>
                <div className="flex flex-col">
                    <p className="text-gray-900 font-bold leading-tight">
                        <span className="text-orange-500">{invitation.team.teamName}</span>
                    </p>
                    <p className="text-gray-500 text-sm">
                        {invitation.invitedBy.name} invited you
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => onAccept(invitation.invitationId)}
                    className="px-6 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-full hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/20"
                >
                    Accept
                </button>
                <button
                    onClick={() => onDecline(invitation.invitationId)}
                    className="px-3 py-2 text-gray-400 hover:text-red-500 text-sm font-semibold transition-colors"
                >
                    Decline
                </button>
            </div>
        </div>
    );
};

export default InvitationCard;
