import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { SelectButton } from 'primereact/selectbutton';
import { thesisService } from '../../services/thesisService';
import Swal from '../../utils/swal';

interface HodDecisionModalProps {
    visible: boolean;
    onHide: () => void;
    thesisId: string;
    onSuccess: () => void;
}

const HodDecisionModal: React.FC<HodDecisionModalProps> = ({ visible, onHide, thesisId, onSuccess }) => {
    const [decision, setDecision] = useState<'Pass' | 'Fail' | null>(null);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const decisionOptions = [
        { label: 'Pass', value: 'Pass', icon: 'pi pi-verified' },
        { label: 'Fail', value: 'Fail', icon: 'pi pi-times-circle' }
    ];

    const handleSubmit = async () => {
        if (!decision) {
            Swal.fire({ icon: 'warning', title: 'Decision Required', text: 'Please select Pass or Fail.' });
            return;
        }

        if (decision === 'Fail' && !comment.trim()) {
            Swal.fire({ icon: 'warning', title: 'Comment Required', text: 'Please provide a reason for the Fail decision.' });
            return;
        }

        setLoading(true);
        try {
            await thesisService.submitHodDecision(thesisId, {
                decision,
                comment: comment.trim() || undefined
            });
            Swal.fire({ 
                icon: 'success', 
                title: 'Final Decision Recorded', 
                text: `The thesis has been marked as ${decision === 'Pass' ? 'Published' : 'Need Update'}.`, 
                timer: 3000, 
                showConfirmButton: false 
            });
            onSuccess();
            onHide();
            // Reset
            setDecision(null);
            setComment('');
        } catch (err: unknown) {
         console.error(err);

    let msg = 'Import failed. Please try again.';

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
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
            <Button
                label="Cancel"
                icon="pi pi-times"
                onClick={onHide}
                className="p-button-text p-button-secondary font-bold px-4"
                disabled={loading}
            />
            <Button
                label={loading ? "Processing..." : "Confirm Final Decision"}
                icon={loading ? "pi pi-spin pi-spinner" : "pi pi-shield"}
                onClick={handleSubmit}
                disabled={!decision || loading}
                className="font-bold px-6 shadow-md hover:shadow-lg transition-all active:scale-95"
                style={{ backgroundColor: '#1e293b', borderColor: '#1e293b' }}
            />
        </div>
    );

    return (
        <Dialog
            header={
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-900 shadow-sm">
                        <i className="pi pi-shield text-xl" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 leading-none mb-1">HOD Final Authority</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Decisive Action</p>
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
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-4">
                    <i className="pi pi-info-circle text-amber-600 text-lg mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                        Your decision will <strong>override</strong> all current reviewer votes and immediately set the final status of this thesis.
                    </p>
                </div>

                {/* Verdict Section */}
                <div className="flex flex-col gap-3">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1">
                        Select Outcome
                    </label>
                    <SelectButton
                        value={decision}
                        options={decisionOptions}
                        onChange={(e) => setDecision(e.value)}
                        className="premium-select-button evaluation-select"
                        itemTemplate={(option) => {
                            const isSelected = decision === option.value;
                            const isFail = option.value === 'Fail';
                            
                            let activeClass = '';
                            if (isSelected) {
                                activeClass = isFail 
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

                {/* Note Section */}
                <div className="flex flex-col gap-3">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1">
                        Decision Rationale {decision === 'Fail' && <span className="text-red-500">*</span>}
                    </label>
                    <InputTextarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={5}
                        placeholder={decision === 'Fail' ? "Please state the reasons for failing this proposal..." : "Add any final instructions or feedback (optional)..."}
                        className="text-sm border border-slate-200 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 p-4 leading-relaxed outline-none transition-all shadow-sm"
                    />
                </div>
            </div>
        </Dialog>
    );
};

export default HodDecisionModal;
