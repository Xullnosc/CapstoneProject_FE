import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { invitationService } from '../../services/invitationService';
import MemberAvatar from './MemberAvatar';
import { Dialog } from 'primereact/dialog';
import Swal from '../../utils/swal';
import axios from 'axios';

interface UserInfo {
    userId: number;
    fullName: string;
    studentCode: string;
    email: string;
    avatar: string;
    hasTeam: boolean;
    pendingInvitationId?: number | null;
    // Local state helper
    invitationId?: number;
    isInvited?: boolean;
}

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamId: number;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose, teamId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [invitedUsers, setInvitedUsers] = useState<Record<number, number>>({}); // userId -> invitationId

    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
            setSearchResults([]);
            setInvitedUsers({});
            setHasSearched(false);
        }
    }, [isOpen]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setIsLoading(true);
        setHasSearched(true); // Mark as searched
        try {
            const results = await userService.searchStudents(searchTerm, teamId);
            setSearchResults(results);

            // Sync initial state from backend results
            const newInvitedUsers = { ...invitedUsers };
            results.forEach(u => {
                if (u.pendingInvitationId) {
                    newInvitedUsers[u.userId] = u.pendingInvitationId;
                }
            });
            setInvitedUsers(newInvitedUsers);

        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Search Failed',
                text: 'Could not find students. Please try again.',
                timer: 1500,
                showConfirmButton: false
            });
        } finally {
            setIsLoading(false);
        }
    };



    const [processingUsers, setProcessingUsers] = useState<Record<number, boolean>>({});

    const handleInvite = async (user: UserInfo) => {
        try {
            setProcessingUsers(prev => ({ ...prev, [user.userId]: true }));
            const invitation = await invitationService.sendInvitation(teamId, user.studentCode || user.email);


            setProcessingUsers(prev => ({ ...prev, [user.userId]: false }));

            setInvitedUsers(prev => ({ ...prev, [user.userId]: invitation.invitationId }));


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
        }
    };

    const handleCancelInvite = async (userId: number) => {
        const invitationId = invitedUsers[userId];
        if (!invitationId) return;

        try {
            setProcessingUsers(prev => ({ ...prev, [userId]: true }));
            await invitationService.cancelInvitation(invitationId);
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
            header="Invite Members"
            visible={isOpen}
            style={{ width: '50vw' }}
            onHide={onClose}
            footer={footer}
            className="invite-member-dialog"
        >
            <div className="">
                {/* Search Form */}
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
                                setHasSearched(false); // Reset on typing
                            }}
                            placeholder="Type Name, MSSV, or Email to search..."
                            className="w-full pl-10 pr-20 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-gray-900"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !searchTerm.trim()}
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

                {/* Results List */}
                <div className="space-y-2 max-h-100 overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        // Loading Skeleton
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-gray-200"></div>
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                            <div className="h-3 w-48 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="h-8 w-20 bg-gray-200 rounded-lg"></div>
                                </div>
                            ))}
                        </div>
                    ) : searchResults.length > 0 ? (
                        searchResults.map(user => {
                            const isInvited = !!invitedUsers[user.userId];
                            const isProcessing = processingUsers[user.userId];
                            return (
                                <div key={user.userId} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <MemberAvatar
                                            fullName={user.fullName}
                                            email={user.email}
                                            avatarUrl={user.avatar}
                                            className="size-10 rounded-full object-cover border border-gray-100"
                                        />
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">{user.fullName}</h4>
                                            <p className="text-xs text-gray-500 flex items-center gap-2">
                                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">{user.studentCode}</span>
                                                <span>{user.email}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {user.hasTeam ? (
                                        <button
                                            disabled
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-gray-100 text-gray-400 cursor-not-allowed"
                                        >
                                            <span className="material-symbols-outlined text-lg">group_off</span>
                                            Already in Team
                                        </button>
                                    ) : (
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
                                    )}
                                </div>
                            );
                        })
                    ) : (hasSearched && !isLoading) ? (
                        <div className="text-center py-8 text-gray-500">
                            <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">search_off</span>
                            <p>No results found.</p>
                        </div>
                    ) : null}

                    {(!hasSearched && !isLoading) && (
                        <div className="text-center py-12 text-gray-400">
                            <span className="material-symbols-outlined text-4xl mb-2 text-gray-200">search</span>
                            <p>Enter a name, MSSV or email to search for students</p>
                        </div>
                    )}
                </div>
            </div>
        </Dialog>
    );
};

export default InviteMemberModal;
