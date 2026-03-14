import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { FileUpload } from 'primereact/fileupload';
import { SelectButton } from 'primereact/selectbutton';
import { thesisService } from '../../services/thesisService';
import Swal from '../../utils/swal';

interface ReviewSubmissionModalProps {
    visible: boolean;
    onHide: () => void;
    thesisId: string;
    onSuccess: () => void;
}

const ReviewSubmissionModal: React.FC<ReviewSubmissionModalProps> = ({ visible, onHide, thesisId, onSuccess }) => {
    const [status, setStatus] = useState<'Approve' | 'Reject' | null>(null);
    const [comment, setComment] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const statusOptions = [
        { label: 'Approve', value: 'Approve', icon: 'pi pi-check' },
        { label: 'Reject', value: 'Reject', icon: 'pi pi-times' }
    ];

    const handleSubmit = async () => {
        if (!status) {
            Swal.fire({ icon: 'warning', title: 'Decision Required', text: 'Please select Approve or Reject.' });
            return;
        }

        if (status === 'Reject' && !comment.trim()) {
            Swal.fire({ icon: 'warning', title: 'Comment Required', text: 'Please provide a comment for rejection.' });
            return;
        }

        setLoading(true);
        try {
            await thesisService.evaluateThesis(thesisId, {
                status,
                comment: comment.trim() || undefined,
                reviewFile: file || undefined
            });
            Swal.fire({ icon: 'success', title: 'Submitted', text: 'Your evaluation has been recorded.', timer: 2000, showConfirmButton: false });
            onSuccess();
            onHide();
            // Reset
            setStatus(null);
            setComment('');
            setFile(null);
        } catch (err: unknown) {
            console.error('Submit review failed', err);
            const axiosError = err as { response?: { data?: { Message?: string } } };
            const msg = axiosError.response?.data?.Message || 'Failed to submit review.';
            Swal.fire({ icon: 'error', title: 'Error', text: msg });
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
                label="Cancel"
                icon="pi pi-times"
                onClick={onHide}
                className="p-button-text p-button-secondary p-button-sm font-bold px-4"
            />
            <Button
                label={loading ? "Submitting..." : "Submit Evaluation"}
                icon={loading ? "pi pi-spin pi-spinner" : "pi pi-send"}
                onClick={handleSubmit}
                disabled={!status || loading}
                className="p-button-sm font-bold px-6 shadow-sm hover:shadow-md transition-all active:scale-95"
                style={{ backgroundColor: '#f26f21', borderColor: '#f26f21' }}
            />
        </div>
    );

    return (
        <Dialog
            header={
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 shadow-sm">
                        <i className="pi pi-list-check text-xl" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 leading-none mb-1">Thesis Evaluation</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reviewer Assessment</p>
                    </div>
                </div>
            }
            visible={visible}
            onHide={onHide}
            style={{ width: '500px' }}
            breakpoints={{ '960px': '75vw', '641px': '90vw' }}
            footer={footer}
            draggable={false}
            resizable={false}
            modal
            className="p-fluid shadow-2xl rounded-[2.5rem] overflow-hidden"
            pt={{
                header: { className: 'p-8 border-b border-gray-100 bg-white' },
                content: { className: 'p-8 bg-white' },
                mask: { className: 'backdrop-blur-sm bg-slate-900/40' }
            }}
        >
            <div className="flex flex-col gap-8">
                {/* Verdict Section */}
                <div className="flex flex-col gap-3">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1">
                        Reviewer Decision
                    </label>
                    <SelectButton
                        value={status}
                        options={statusOptions}
                        onChange={(e) => setStatus(e.value)}
                        className="premium-select-button evaluation-select"
                        itemTemplate={(option) => {
                            const isSelected = status === option.value;
                            const isReject = option.value === 'Reject';
                            
                            let activeClass = '';
                            if (isSelected) {
                                activeClass = isReject 
                                    ? 'bg-red-500 text-white scale-105' 
                                    : 'bg-emerald-500 text-white scale-105';
                            } else {
                                activeClass = 'bg-slate-50 text-slate-400 opacity-60 grayscale';
                            }

                            return (
                                <div className={`flex items-center justify-center gap-2 py-4 w-full transition-all duration-300 rounded-xl ${activeClass}`}>
                                    <i className={`${option.icon} ${isSelected ? 'text-lg' : 'text-sm'}`} />
                                    <span className={`font-black uppercase tracking-widest ${isSelected ? 'text-sm' : 'text-[10px]'}`}>{option.label}</span>
                                </div>
                            );
                        }}
                    />
                </div>

                {/* Comment Section */}
                <div className="flex flex-col gap-3">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1">
                        Detailed Feedback {status === 'Reject' && <span className="text-red-500">*</span>}
                    </label>
                    <InputTextarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={5}
                        placeholder={status === 'Reject' ? "Explain the reasons for rejection and required improvements..." : "Add overall feedback for the team (optional)..."}
                        className="text-sm border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 p-4 leading-relaxed outline-none transition-all shadow-sm"
                    />
                </div>

                {/* File Upload Section */}
                <div className="flex flex-col gap-3">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1">
                        Supporting Document (Optional)
                    </label>
                    <div className="p-5 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50 hover:bg-white hover:border-orange-200 transition-all flex flex-col gap-4 group">
                        <FileUpload
                            mode="basic"
                            auto
                            chooseLabel={file ? file.name : "Attach Review Report"}
                            onSelect={(e) => setFile(e.files[0])}
                            className="p-button-sm p-button-outlined p-button-secondary font-bold w-full rounded-xl border-slate-200 group-hover:border-orange-300 transition-colors"
                        />
                        {file && (
                            <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                        <i className="pi pi-file text-xl" />
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-xs font-bold truncate max-w-[150px]">{file.name}</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">Size: {(file.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                </div>
                                <Button
                                    icon="pi pi-trash"
                                    className="p-button-text p-button-danger p-button-sm p-0 w-8 h-8 rounded-full hover:bg-red-50"
                                    onClick={() => setFile(null)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default ReviewSubmissionModal;
