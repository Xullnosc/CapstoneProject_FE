import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { invitationService } from '../../services/invitationService';
import MemberAvatar from './MemberAvatar';
import Swal from 'sweetalert2';

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

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
            setSearchResults([]);
            setInvitedUsers({});
        }
    }, [isOpen]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setIsLoading(true);
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

    const handleInvite = async (user: UserInfo) => {
        try {
            const invitation = await invitationService.sendInvitation(teamId, user.studentCode || user.email);
            setInvitedUsers(prev => ({ ...prev, [user.userId]: invitation.invitationId }));
            Swal.fire({
                icon: 'success',
                title: 'Sent',
                text: `Invitation sent to ${user.fullName}`,
                timer: 1500,
                showConfirmButton: false,
                backdrop: false
            });
        } catch (error: any) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: error.response?.data?.message || 'Failed to send invitation',
                timer: 2000,
                backdrop: false
            });
        }
    };

    const handleCancelInvite = async (userId: number) => {
        const invitationId = invitedUsers[userId];
        if (!invitationId) return;

        try {
            await invitationService.cancelInvitation(invitationId);
            setInvitedUsers(prev => {
                const newState = { ...prev };
                delete newState[userId];
                return newState;
            });
            Swal.fire({
                icon: 'info',
                title: 'Cancelled',
                text: 'Invitation cancelled',
                timer: 1500,
                showConfirmButton: false,
                backdrop: false
            });
        } catch (error: any) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: error.response?.data?.message || 'Failed to cancel invitation',
                timer: 2000,
                backdrop: false
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden transform transition-all animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900">Invite Members</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="mb-6 relative">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <span className="material-symbols-outlined">search</span>
                            </span>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by Name, MSSV, or Email..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-gray-900"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !searchTerm.trim()}
                                className="absolute inset-y-1 right-1 px-4 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {searchResults.length > 0 ? (
                            searchResults.map(user => {
                                const isInvited = !!invitedUsers[user.userId];
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
                                                className={`
                                                    flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all
                                                    ${isInvited
                                                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                        : 'bg-orange-50 text-orange-600 hover:bg-orange-100 hover:shadow-orange-100'
                                                    }
                                                `}
                                            >
                                                {isInvited ? (
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
                        ) : searchTerm && !isLoading ? (
                            <div className="text-center py-8 text-gray-500">
                                <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">person_off</span>
                                <p>No students found matching "{searchTerm}"</p>
                            </div>
                        ) : null}

                        {!searchTerm && (
                            <div className="text-center py-12 text-gray-400">
                                <span className="material-symbols-outlined text-4xl mb-2 text-gray-200">search</span>
                                <p>Enter a name, MSSV or email to search for students</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InviteMemberModal;
