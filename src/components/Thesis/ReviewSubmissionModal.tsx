import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { SelectButton } from 'primereact/selectbutton';
import { Checkbox } from 'primereact/checkbox';
import type { CheckboxChangeEvent } from 'primereact/checkbox';
import { thesisService } from '../../services/thesisService';
import type { Checklist } from '../../types/thesis';
import Swal from '../../utils/swal';

interface ReviewSubmissionModalProps {
    visible: boolean;
    onHide: () => void;
    thesisId: string;
    thesisFileUrl?: string; // Add this
    onSuccess: () => void;
}

const ReviewSubmissionModal: React.FC<ReviewSubmissionModalProps> = ({ visible, onHide, thesisId, thesisFileUrl, onSuccess }) => {
    const [status, setStatus] = useState<'OK' | 'Consider' | null>(null);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Checklist state
    const [checklists, setChecklists] = useState<Checklist[]>([]);
    const [checkedIds, setCheckedIds] = useState<number[]>([]);
    const [loadingChecklists, setLoadingChecklists] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchChecklists();
        }
    }, [visible]);

    const fetchChecklists = async () => {
        setLoadingChecklists(true);
        try {
            const data = await thesisService.getChecklists();
            setChecklists(data);
        } catch (err) {
            console.error('Failed to fetch checklists:', err);
        } finally {
            setLoadingChecklists(false);
        }
    };

    const onChecklistChange = (e: CheckboxChangeEvent) => {
        let _checkedIds = [...checkedIds];
        if (e.checked) {
            _checkedIds.push(e.value);
        } else {
            _checkedIds = _checkedIds.filter(id => id !== e.value);
        }
        setCheckedIds(_checkedIds);
    };

    const statusOptions = [
        { label: 'OK', value: 'OK', icon: 'pi pi-check' },
        { label: 'Consider', value: 'Consider', icon: 'pi pi-times' }
    ];

    const handleSubmit = async () => {
        if (!status) {
            Swal.fire({ icon: 'warning', title: 'Decision Required', text: 'Please select OK or Consider.' });
            return;
        }

        if (status === 'Consider' && !comment.trim()) {
            Swal.fire({ icon: 'warning', title: 'Comment Required', text: 'Please provide a comment for consideration.' });
            return;
        }

        setLoading(true);
        try {
            await thesisService.evaluateThesis(thesisId, {
                status,
                comment: comment.trim() || undefined,
                checkedChecklistIds: checkedIds.length > 0 ? checkedIds : undefined
            });
            Swal.fire({ icon: 'success', title: 'Submitted', text: 'Your evaluation has been recorded.', timer: 2000, showConfirmButton: false });
            onSuccess();
            onHide();
            // Reset
            setStatus(null);
            setComment('');
            setCheckedIds([]);
        } catch (err: unknown) {
            console.error(err);
            let msg = 'Submit review failed';
            if (typeof err === 'object' && err !== null && 'response' in err) {
                const e = err as { response?: { data?: { message?: string } } };
                msg = e.response?.data?.message ?? msg;
            }
            Swal.fire('Error', msg, 'error');
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
                icon={loading ? "pi pi-send" : "pi pi-send"}
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
            style={{ width: '95vw', maxWidth: '1400px' }}
            footer={footer}
            draggable={false}
            resizable={false}
            modal
            className="p-fluid shadow-2xl rounded-[2.5rem] overflow-hidden"
            pt={{
                header: { className: 'p-6 border-b border-gray-100 bg-white' },
                content: { className: 'p-6 bg-white overflow-hidden' },
                mask: { className: 'backdrop-blur-sm bg-slate-900/40' }
            }}
        >
            <div className="flex flex-col lg:flex-row gap-6 h-[70vh]">
                {/* Left Pane: Document Preview */}
                <div className="flex-1 flex flex-col h-full border border-slate-100 rounded-[2rem] bg-slate-50 overflow-hidden shadow-inner relative">
                    <div className="absolute top-4 left-4 z-10">
                        <div className="bg-slate-800 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                             <i className="pi pi-file-pdf" /> Document Preview
                        </div>
                    </div>
                    {thesisFileUrl ? (
                         <iframe 
                            src={`https://docs.google.com/gview?url=${encodeURIComponent(thesisFileUrl)}&embedded=true`} 
                            className="w-full h-full border-none rounded-[2rem]"
                            title="Thesis Document Preview"
                         />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 p-8 text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                                <i className="pi pi-file-excel text-4xl" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-600 mb-1">No file available</h3>
                                <p className="text-xs font-semibold leading-relaxed max-w-[250px]">
                                    This thesis does not have a support file for preview.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Pane: Checklist & Feedback (Compact) */}
                <div className="w-full lg:w-[500px] flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    {/* Checklist Section */}
                    <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1 border-l-4 border-orange-500 pl-3">
                            Checklist (Evaluation Criteria)
                        </label>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2">
                            {loadingChecklists ? (
                                <div className="flex items-center justify-center py-8 text-slate-400 text-xs italic">
                                    <i className="pi pi-spin pi-spinner mr-2"></i> Loading criteria...
                                </div>
                            ) : checklists.length === 0 ? (
                                <div className="text-slate-400 text-xs italic py-4 px-4">No checklist items defined.</div>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    {checklists.map((item) => (
                                        <div 
                                            key={item.checklistId} 
                                            className={`flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer border ${checkedIds.includes(item.checklistId) ? 'bg-orange-50/50 border-orange-100 shadow-sm' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'}`}
                                            onClick={() => onChecklistChange({ checked: !checkedIds.includes(item.checklistId), value: item.checklistId } as unknown as CheckboxChangeEvent)}
                                        >
                                            <Checkbox
                                                inputId={`item-${item.checklistId}`}
                                                value={item.checklistId}
                                                checked={checkedIds.includes(item.checklistId)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    onChecklistChange(e);
                                                }}
                                                className="mt-0.5"
                                                pt={{
                                                    box: {
                                                        className: `w-5 h-5 rounded-lg border-2 transition-all duration-200 ${
                                                            checkedIds.includes(item.checklistId)
                                                            ? 'bg-orange-500 border-orange-500 shadow-sm shadow-orange-200' 
                                                            : 'bg-white border-slate-200 hover:border-orange-300'
                                                        }`
                                                    },
                                                    icon: { className: 'text-xs text-white' }
                                                }}
                                            />
                                            <label 
                                                htmlFor={`item-${item.checklistId}`} 
                                                className={`text-xs font-bold leading-relaxed cursor-pointer transition-colors ${checkedIds.includes(item.checklistId) ? 'text-orange-900' : 'text-slate-600'}`}
                                            >
                                                {item.content}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Verdict Section */}
                    <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
                            Final Decision
                        </label>
                        <SelectButton
                            value={status}
                            options={statusOptions}
                            onChange={(e) => setStatus(e.value)}
                            className="premium-select-button evaluation-select"
                            itemTemplate={(option) => {
                                const isSelected = status === option.value;
                                const isConsider = option.value === 'Consider';
                                
                                let activeClass = '';
                                if (isSelected) {
                                    activeClass = isConsider 
                                        ? 'bg-red-500 text-white scale-105 shadow-lg shadow-red-200' 
                                        : 'bg-emerald-500 text-white scale-105 shadow-lg shadow-emerald-200';
                                } else {
                                    activeClass = 'bg-slate-50 text-slate-400 opacity-60 hover:opacity-100 hover:bg-slate-100';
                                }

                                return (
                                    <div className={`flex items-center justify-center gap-2 py-3 w-full transition-all duration-300 rounded-xl ${activeClass}`}>
                                        <i className={`${option.icon} ${isSelected ? 'text-base' : 'text-xs'}`} />
                                        <span className={`font-black uppercase tracking-widest ${isSelected ? 'text-xs' : 'text-[10px]'}`}>{option.label}</span>
                                    </div>
                                );
                            }}
                        />
                    </div>

                    {/* Feedback Section */}
                    <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
                            Overall Feedback {status === 'Consider' && <span className="text-red-500 font-black">*</span>}
                        </label>
                        <InputTextarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={5}
                            placeholder={status === 'Consider' ? "Explain the reasons for consideration..." : "Provide overall feedback or suggestions..."}
                            className="text-xs border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 p-4 leading-relaxed outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default ReviewSubmissionModal;
