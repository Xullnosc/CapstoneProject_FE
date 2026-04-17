import React from 'react';
import type { TeamInvitation } from '../../types/team';

interface JoinRequestCardProps {
    invitation: TeamInvitation;
    onAccept: (id: number) => void;
    onDecline: (id: number) => void;
}

const JoinRequestCard: React.FC<JoinRequestCardProps> = ({ invitation, onAccept, onDecline }) => {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 bg-orange-50/50 rounded-2xl border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
                <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 border-2 border-orange-200"
                    style={{ backgroundImage: `url("${invitation.invitedBy.avatar || 'https://via.placeholder.com/100'}")` }}
                ></div>
                <div className="flex flex-col flex-1">
                    <p className="text-gray-900 font-bold leading-tight flex items-center gap-2">
                        {invitation.invitedBy.name}
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] uppercase font-bold tracking-wider">
                            Join Request
                        </span>
                    </p>
                    <p className="text-gray-500 text-sm">
                        {invitation.invitedBy.email} wants to join your team
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                    onClick={() => onAccept(invitation.invitationId)}
                    className="px-6 cursor-pointer py-2.5 bg-orange-500 text-white text-sm font-bold rounded-full hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/20 w-full sm:w-auto whitespace-nowrap"
                >
                    Accept
                </button>
                <button
                    onClick={() => onDecline(invitation.invitationId)}
                    className="px-4 cursor-pointer py-2.5 text-gray-500 hover:text-red-500 hover:bg-red-50 text-sm font-semibold rounded-full transition-colors w-full sm:w-auto whitespace-nowrap"
                >
                    Decline
                </button>
            </div>
        </div>
    );
};

export default JoinRequestCard;
