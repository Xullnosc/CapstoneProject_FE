import { useState, type FC } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import type { Whitelist } from '../../services/semesterService';
import { whitelistService } from '../../services/whitelistService';
import Swal from '../../utils/swal';
import MemberAvatar from '../team/MemberAvatar';

interface ReviewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    lecturers: Whitelist[];
    onUpdate?: () => void;
}

const ReviewerModal: FC<ReviewerModalProps> = ({ isOpen, onClose, lecturers, onUpdate }) => {
    const [selectedLecturer, setSelectedLecturer] = useState<Whitelist | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Derived state from props
    const reviewers = lecturers.filter(l => l.isReviewer);
    const availableLecturers = lecturers.filter(l => !l.isReviewer);

    const handleAddReviewer = async () => {
        if (!selectedLecturer) return;

        try {
            setIsProcessing(true);
            await whitelistService.updateReviewerStatus(selectedLecturer.whitelistId, true);

            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: `${selectedLecturer.fullName || selectedLecturer.email} added as reviewer`,
                timer: 1500,
                showConfirmButton: false
            });

            setSelectedLecturer(null);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Failed to add reviewer', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemoveReviewer = async (reviewer: Whitelist) => {
        try {
            // Confirm removal
            const result = await Swal.fire({
                title: 'Remove Reviewer?',
                text: `Are you sure you want to remove ${reviewer.fullName || reviewer.email} from reviewers?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, remove'
            });

            if (result.isConfirmed) {
                setIsProcessing(true);
                await whitelistService.updateReviewerStatus(reviewer.whitelistId, false);

                Swal.fire({
                    icon: 'success',
                    title: 'Removed!',
                    text: 'Reviewer permission revoked.',
                    timer: 1500,
                    showConfirmButton: false
                });

                if (onUpdate) onUpdate();
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Failed to remove reviewer', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const lecturerOptionTemplate = (option: Whitelist) => {
        return (
            <div className="flex items-center gap-2">
                <MemberAvatar
                    email={option.email}
                    fullName={option.fullName || option.email}
                    avatarUrl={option.avatar}
                    className="w-6 h-6 rounded-full object-cover"
                />
                <span>{option.fullName || option.email}</span>
            </div>
        );
    };

    const dialogHeader = (
        <div className="flex items-center gap-3 text-gray-800">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-600">settings_account_box</span>
            </div>
            <div>
                <h3 className="text-xl font-bold">Reviewer Management</h3>
                <p className="text-xs text-gray-500 font-normal">Add or remove reviewers for this semester</p>
            </div>
        </div>
    );

    return (
        <Dialog
            header={dialogHeader}
            visible={isOpen}
            style={{ width: '600px', maxWidth: '90vw' }}
            onHide={onClose}
            className="font-sans reviewer-modal"
            contentClassName="p-0 rounded-b-2xl"
            headerClassName="rounded-t-2xl border-b border-gray-100 bg-white p-6"
            maskClassName="bg-gray-900/40 backdrop-blur-sm"
        >
            <div className="flex flex-col gap-6 p-6 bg-white">

                {/* Add Reviewer Section */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Add New Reviewer</label>
                    <div className="flex gap-3">
                        <Dropdown
                            value={selectedLecturer}
                            onChange={(e) => setSelectedLecturer(e.value)}
                            options={availableLecturers}
                            optionLabel="fullName"
                            placeholder="Select a Lecturer"
                            className="w-full md:w-14rem p-inputtext-sm border-gray-300 rounded-xl"
                            itemTemplate={lecturerOptionTemplate}
                            filter
                            disabled={isProcessing}
                            emptyMessage="No available lecturers"
                        />
                        <button
                            onClick={handleAddReviewer}
                            disabled={!selectedLecturer || isProcessing}
                            className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 active:scale-95 cursor-pointer shrink-0"
                        >
                            {isProcessing ? (
                                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                            ) : (
                                <span className="material-symbols-outlined text-lg">add</span>
                            )}
                            Add
                        </button>
                    </div>
                </div>

                {/* Reviewer List */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-800">Current Reviewers</h3>
                        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                            {reviewers.length} Active
                        </span>
                    </div>

                    {reviewers.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="material-symbols-outlined text-3xl opacity-50">face_retouching_off</span>
                            </div>
                            <p className="font-medium text-gray-500">No reviewers assigned yet</p>
                            <p className="text-xs mt-1">Select a lecturer above to add them.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 max-h-87.5 overflow-y-auto pr-1 custom-scrollbar">
                            {reviewers.map(reviewer => (
                                <div key={reviewer.whitelistId} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md hover:border-orange-100 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <MemberAvatar
                                            email={reviewer.email}
                                            fullName={reviewer.fullName || reviewer.email}
                                            avatarUrl={reviewer.avatar}
                                            className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-white"
                                        />
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 leading-tight">{reviewer.fullName || 'Unknown Name'}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{reviewer.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveReviewer(reviewer)}
                                        disabled={isProcessing}
                                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100 cursor-pointer disabled:opacity-50"
                                        title="Remove Reviewer"
                                    >
                                        <span className="material-symbols-outlined text-xl">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions if needed, for now just close */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100 flex justify-end">
                <button
                    onClick={onClose}
                    className="text-gray-500 font-bold text-sm px-4 py-2 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                    Close
                </button>
            </div>
        </Dialog>
    );
};

export default ReviewerModal;
