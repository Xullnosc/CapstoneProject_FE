import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, type UserInfo } from '../../services/userService';
import { mentorInvitationService } from '../../services/mentorInvitationService';
import MemberAvatar from './MemberAvatar';
import { Dialog } from 'primereact/dialog';
import Swal from '../../utils/swal';
import axios from 'axios';

type MentorUserInfo = UserInfo;

interface InviteMentorModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamId: number;
}

const InviteMentorModal: React.FC<InviteMentorModalProps> = ({ isOpen, onClose, teamId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<MentorUserInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [invitedUsers, setInvitedUsers] = useState<Record<number, number>>({}); // userId -> invitationId
    const [processingUsers, setProcessingUsers] = useState<Record<number, boolean>>({});
    const [hasSearched, setHasSearched] = useState(false);
    const navigate = useNavigate();

    const performSearch = useCallback(async (term: string) => {
        setIsLoading(true);
        try {
            const results = await userService.searchLecturers(term, teamId);
            setSearchResults(results as MentorUserInfo[]);

            setInvitedUsers(prev => {
                const newInvitedUsers = { ...prev };
                let changed = false;
                results.forEach(u => {
                    if (u.pendingInvitationId && newInvitedUsers[u.userId] !== u.pendingInvitationId) {
                        newInvitedUsers[u.userId] = u.pendingInvitationId;
                        changed = true;
                    }
                });
                return changed ? newInvitedUsers : prev;
            });
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Operation Failed',
                text: 'Could not fetch mentors. Please try again.',
                timer: 2000,
                showConfirmButton: false,
                backdrop: false
            });
        } finally {
            setIsLoading(false);
        }
    }, [teamId]);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setHasSearched(false);
            performSearch('');
        } else {
            setSearchResults([]);
            setInvitedUsers({});
        }
    }, [isOpen, performSearch]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setHasSearched(true);
        await performSearch(searchTerm);
    };

    const handleInvite = async (user: UserInfo) => {
        try {
            setProcessingUsers(prev => ({ ...prev, [user.userId]: true }));
            const invitation = await mentorInvitationService.sendInvitation(teamId, user.email);

            setProcessingUsers(prev => ({ ...prev, [user.userId]: false }));
            setInvitedUsers(prev => ({ ...prev, [user.userId]: invitation.invitationId }));

            Swal.fire({
                icon: 'success',
                title: 'Invitation Sent',
                text: `Invitation sent to ${user.fullName}`,
                timer: 1500,
                showConfirmButton: false,
                backdrop: false
            });

        } catch (error) {
            console.error(error);
            let message = 'Failed to send invitation';
            if (axios.isAxiosError(error)) {
                message = error.response?.data?.message || message;
            }
            Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: message,
                timer: 2000,
                backdrop: false
            });
            setProcessingUsers(prev => ({ ...prev, [user.userId]: false }));
        }
    };

    const handleCancelInvite = async (userId: number) => {
        const invitationId = invitedUsers[userId];
        if (!invitationId) return;

        try {
            setProcessingUsers(prev => ({ ...prev, [userId]: true }));
            await mentorInvitationService.cancelInvitation(invitationId);
            setInvitedUsers(prev => {
                const newState = { ...prev };
                delete newState[userId];
                return newState;
            });

        } catch (error) {
            console.error(error);
            let message = 'Failed to cancel invitation';
            if (axios.isAxiosError(error)) {
                message = error.response?.data?.message || message;
            }
            Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: message,
                timer: 2000,
                backdrop: false
            });
        } finally {
            setProcessingUsers(prev => ({ ...prev, [userId]: false }));
        }
    };

    const footer = (
        <div className="flex justify-end pt-2">
            <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg text-gray-600 font-bold hover:bg-gray-100 transition-colors border border-gray-200 cursor-pointer"
            >
                Close
            </button>
        </div>
    );

    return (
        <Dialog
            header="Invite Mentor"
            visible={isOpen}
            style={{ width: '50vw' }}
            onHide={onClose}
            footer={footer}
            className="invite-mentor-dialog"
        >
            <div className="">
                <form onSubmit={handleSearch} className="mb-6 relative">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <span className="material-symbols-outlined">search</span>
                        </span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                            }}
                            placeholder="Type Name or Email to search for Lecturers..."
                            className="w-full pl-10 pr-20 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-gray-900"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="absolute inset-y-1 right-1 px-4 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            {isLoading ? (
                                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                            ) : (
                                'Search'
                            )}
                        </button>
                    </div>
                </form>

                <div className="space-y-2 max-h-100 overflow-y-auto custom-scrollbar">
                    {searchResults.length > 0 ? (
                        searchResults.map(user => {
                            const isInvited = !!invitedUsers[user.userId];
                            const isProcessing = processingUsers[user.userId];
                                const canViewProfile = user.userId > 0;
                            return (
                                <div key={user.userId} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group">
                                    <div 
                                        className={`flex items-center gap-3 ${canViewProfile ? 'cursor-pointer group/name' : ''}`}
                                        onClick={() => {
                                            if (!canViewProfile) return;
                                            navigate(`/profile/${user.userId}`);
                                        }}
                                    >
                                        <MemberAvatar
                                            fullName={user.fullName}
                                            email={user.email}
                                            avatarUrl={user.avatar}
                                            className="size-10 rounded-full object-cover border border-gray-100 transition-transform group-hover/name:scale-105"
                                        />
                                        <div>
                                            <h4 className={`font-bold text-gray-900 text-sm transition-colors ${canViewProfile ? 'group-hover/name:text-orange-600' : ''}`}>{user.fullName}</h4>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => isInvited ? handleCancelInvite(user.userId) : handleInvite(user)}
                                                disabled={isProcessing}
                                                className={`
                                                    flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer
                                                    ${isInvited
                                                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                        : 'bg-orange-50 text-orange-600 hover:bg-orange-100 hover:shadow-orange-100'
                                                    }
                                                    ${isProcessing ? 'opacity-70 cursor-wait' : ''}
                                                `}
                                            >
                                                {isProcessing ? (
                                                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                                ) : isInvited ? (
                                                    <>
                                                        <span className="material-symbols-outlined text-lg">close</span>
                                                        Cancel
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined text-lg">add</span>
                                                        Invite
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                </div>
                            );
                        })
                    ) : (hasSearched && !isLoading) ? (
                        <div className="text-center py-8 text-gray-500">
                            <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">search_off</span>
                            <p>No results found.</p>
                        </div>
                    ) : !isLoading ? (
                        <div className="text-center py-12 text-gray-400">
                            <span className="material-symbols-outlined text-4xl mb-2 text-gray-200">search</span>
                            <p>Loading available mentors...</p>
                        </div>
                    ) : null}
                </div>
            </div>
        </Dialog>
    );
};

export default InviteMentorModal;
