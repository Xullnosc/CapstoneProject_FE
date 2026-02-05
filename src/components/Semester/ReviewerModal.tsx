import { useState, useEffect, type FC } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import type { Whitelist } from '../../services/semesterService';
import Swal from '../../utils/swal';

interface ReviewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    lecturers: Whitelist[];
}

const ReviewerModal: FC<ReviewerModalProps> = ({ isOpen, onClose, lecturers }) => {
    // Mock state for reviewers - in real app this would come from backend
    const [reviewers, setReviewers] = useState<Whitelist[]>([]);
    const [selectedLecturer, setSelectedLecturer] = useState<Whitelist | null>(null);

    // Initialize some mock reviewers if empty
    useEffect(() => {
        if (isOpen && reviewers.length === 0 && lecturers.length > 0) {
            // Just for demo, maybe pick the first one as a reviewer
            // setReviewers([lecturers[0]]); 
        }
    }, [isOpen, lecturers]);

    const handleAddReviewer = () => {
        if (!selectedLecturer) return;

        if (reviewers.some(r => r.email === selectedLecturer.email)) {
            Swal.fire('Warning', 'This lecturer is already a reviewer.', 'warning');
            return;
        }

        setReviewers([...reviewers, selectedLecturer]);
        setSelectedLecturer(null);
        Swal.fire('Success', 'Lecturer added to reviewer list.', 'success');
    };

    const handleRemoveReviewer = (email: string) => {
        setReviewers(reviewers.filter(r => r.email !== email));
        Swal.fire('Success', 'Lecturer removed from reviewer list.', 'success');
    };

    // Filter out lecturers who are already reviewers for the dropdown
    const availableLecturers = lecturers.filter(l => !reviewers.some(r => r.email === l.email));

    const lecturerOptionTemplate = (option: Whitelist) => {
        return (
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                    {option.fullName?.charAt(0) || option.email.charAt(0)}
                </div>
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
                        />
                        <button
                            onClick={handleAddReviewer}
                            disabled={!selectedLecturer}
                            className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 active:scale-95 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
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
                                <div key={reviewer.email} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md hover:border-orange-100 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
                                            {reviewer.fullName?.charAt(0) || reviewer.email.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 leading-tight">{reviewer.fullName || 'Unknown Name'}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{reviewer.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveReviewer(reviewer.email)}
                                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
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
