import { useState, useEffect } from 'react';
import { mentorInvitationService } from '../services/mentorInvitationService';
import type { MentorInvitationDTO } from '../services/mentorInvitationService';

export const useMentorInvitations = () => {
    const [invitations, setInvitations] = useState<MentorInvitationDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTeamCount, setActiveTeamCount] = useState(0);
    const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

    const fetchInvitations = async () => {
        try {
            setIsLoading(true);
            const [pagedResult, countResult] = await Promise.all([
                mentorInvitationService.getMyMentorInvitations(1, 50),
                mentorInvitationService.getActiveTeamCount()
            ]);
            setInvitations(pagedResult.items);
            setActiveTeamCount(countResult.count);
        } catch (error) {
            console.error('Failed to fetch mentor invitations:', error);
            setInvitations([]);
            setActiveTeamCount(0);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, []);

    const accept = async (id: number) => {
        try {
            setProcessingIds(prev => new Set(prev).add(id));
            await mentorInvitationService.acceptInvitation(id);
            await fetchInvitations();
        } finally {
            setProcessingIds(prev => {
                const updated = new Set(prev);
                updated.delete(id);
                return updated;
            });
        }
    };

    const decline = async (id: number) => {
        try {
            setProcessingIds(prev => new Set(prev).add(id));
            await mentorInvitationService.declineInvitation(id);
            await fetchInvitations();
        } finally {
            setProcessingIds(prev => {
                const updated = new Set(prev);
                updated.delete(id);
                return updated;
            });
        }
    };

    return {
        invitations,
        isLoading,
        activeTeamCount,
        processingIds,
        accept,
        decline,
        refresh: fetchInvitations
    };
};
