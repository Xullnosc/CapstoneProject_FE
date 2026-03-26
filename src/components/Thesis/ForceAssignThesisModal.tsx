import { useState, useEffect, type FC } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { teamService } from '../../services/teamService';
import { thesisService } from '../../services/thesisService';
import Swal from '../../utils/swal';

interface ForceAssignThesisModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    thesisId: string;
    thesisTitle: string;
    semesterId: number;
}

const ForceAssignThesisModal: FC<ForceAssignThesisModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    thesisId,
    thesisTitle,
    semesterId,
}) => {
    const [teams, setTeams] = useState<{ label: string; value: number }[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingTeams, setIsLoadingTeams] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedTeamId(null);
            fetchTeams();
        }
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchTeams = async () => {
        setIsLoadingTeams(true);
        try {
            const [allTeams, allTheses] = await Promise.all([
                teamService.getTeamsBySemester(semesterId),
                thesisService.getAllTheses({ semesterId })
            ]);

            // A team is considered to have a thesis if its ID is referenced in any thesis
            // or if its leader is the owner of an approved/published thesis
            const teamsWithThesisIds = new Set<number>();
            const leadersWithThesisIds = new Set<number>();

            allTheses.forEach((th) => {
                // If it's already assigned to a team
                if (th.teamId) {
                    teamsWithThesisIds.add(th.teamId);
                }
                // If it's an approved thesis without teamId (older data), block the leader's team
                if (th.status === 'Published') {
                    if (th.userId) leadersWithThesisIds.add(th.userId);
                }
                // Exclude the CURRENT thesis from blocking (though it shouldn't have a team yet)
            });

            const availableTeams = allTeams.filter(t => 
                !teamsWithThesisIds.has(t.teamId) && 
                !leadersWithThesisIds.has(t.leaderId) &&
                t.status !== 'Disbanded'
            );

            setTeams(
                availableTeams.map((t) => ({
                    label: `${t.teamName}${t.teamCode ? ` (${t.teamCode})` : ''}`,
                    value: t.teamId,
                }))
            );
        } catch {
            setTeams([]);
        } finally {
            setIsLoadingTeams(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTeamId) {
            Swal.fire({ icon: 'warning', title: 'Missing Info', text: 'Please select a team.' });
            return;
        }

        try {
            setIsSubmitting(true);
            await thesisService.forceAssignThesis(thesisId, selectedTeamId);
            Swal.fire({ icon: 'success', title: 'Assigned!', text: 'Thesis has been assigned to the team.', timer: 1500, showConfirmButton: false });
            onClose();
            onSuccess();
        } catch (error: unknown) {
            const message =
                (error as { response?: { data?: { Message?: string; message?: string } } }).response?.data?.Message ||
                (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
                'Failed to assign thesis.';
            Swal.fire({ icon: 'error', title: 'Error', text: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const dialogHeader = (
        <div className="flex items-center gap-3 text-gray-800">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-100 text-orange-600">
                <span className="material-symbols-outlined">link</span>
            </div>
            <div>
                <h3 className="text-xl font-bold">Force Assign Thesis</h3>
                <p className="text-xs text-gray-500 font-normal">Assign this thesis to a team</p>
            </div>
        </div>
    );

    return (
        <Dialog
            header={dialogHeader}
            visible={isOpen}
            style={{ width: '480px' }}
            onHide={onClose}
            draggable={false}
            resizable={false}
            className="font-sans"
            headerClassName="border-b border-gray-100 p-6"
            contentClassName="p-6"
            maskClassName="bg-gray-900/40 backdrop-blur-sm"
            blockScroll
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Thesis Info */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-gray-700">Thesis</label>
                    <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 truncate">
                        {thesisTitle}
                    </div>
                </div>

                {/* Team Selection (PrimeReact Dropdown) */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-gray-700">Select Team <span className="text-red-500">*</span></label>

                    {isLoadingTeams ? (
                        <div className="flex items-center justify-center py-8 text-gray-400">
                            <span className="material-symbols-outlined animate-spin text-xl mr-2">progress_activity</span>
                            <span className="text-sm">Loading teams...</span>
                        </div>
                    ) : teams.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <span className="material-symbols-outlined text-3xl mb-2">group_off</span>
                            <p className="text-sm font-medium">No teams available in this semester</p>
                        </div>
                    ) : (
                        <Dropdown
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.value)}
                            options={teams}
                            optionLabel="label"
                            placeholder="Select a team..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm"
                            pt={{
                                root: { style: { padding: '4px 8px' } },
                                input: { className: 'text-sm font-medium py-2' },
                                item: { className: 'text-sm' }
                            }}
                        />
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !selectedTeamId}
                        className="px-6 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isSubmitting && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>}
                        Assign Thesis
                    </button>
                </div>
            </form>
        </Dialog>
    );
};

export default ForceAssignThesisModal;
