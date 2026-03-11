import { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import type { Thesis } from '../../types/thesis';
import { thesisService } from '../../services/thesisService';
import Swal from '../../utils/swal';
import { AxiosError } from 'axios';

interface Props {
    visible: boolean;
    thesis: Thesis | null;
    onHide: () => void;
    onSuccess: () => void;
}

const UpdateThesisModal = ({ visible, thesis, onHide, onSuccess }: Props) => {
    const [file, setFile] = useState<File | null>(null);
    const [note, setNote] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClose = () => {
        if (isUploading) return;
        setFile(null);
        setNote('');
        setIsDragging(false);
        onHide();
    };

    const handleFiles = (files: FileList) => {
        if (files.length === 0) return;
        const selected = files[0];
        const isPdf = selected.type === 'application/pdf' || selected.name.endsWith('.pdf');
        const isWord =
            selected.type === 'application/msword' ||
            selected.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            selected.name.endsWith('.doc') ||
            selected.name.endsWith('.docx');

        if (!isPdf && !isWord) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid File',
                text: 'Please upload a PDF or Word document (.pdf, .doc, .docx)',
                confirmButtonColor: '#f97415'
            });
            return;
        }

        const maxMB = 50;
        if (selected.size > maxMB * 1024 * 1024) {
            Swal.fire({
                icon: 'error',
                title: 'File Too Large',
                text: `File size must be under ${maxMB}MB.`,
                confirmButtonColor: '#f97415'
            });
            return;
        }
        setFile(selected);
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleUpload = async () => {
        if (!file || !thesis) return;
        setIsUploading(true);
        try {
            // Endpoint: PUT /api/thesis/{thesisId}
            await thesisService.updateThesisFile(thesis.thesisId, { file, note: note.trim() || undefined });
            Swal.fire({
                icon: 'success',
                title: 'Upload Successful',
                text: 'A new version of your thesis has been uploaded.',
                confirmButtonColor: '#f97415'
            });
            handleClose();
            onSuccess();
        } catch (err) {
            const axiosError = err as AxiosError<{ message?: string }>;
            const msg = axiosError.response?.data?.message ?? axiosError.message ?? 'Upload failed. Please try again.';
            Swal.fire({ icon: 'error', title: 'Upload Failed', text: msg, confirmButtonColor: '#f97415' });
        } finally {
            setIsUploading(false);
        }
    };


    // Current version = max versionNumber from history array
    const currentVersion = thesis?.histories?.length
        ? Math.max(...thesis.histories.map(h => h.versionNumber))
        : null;

    return (
        <Dialog
            header={
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                        <i className="pi pi-cloud-upload text-xl"></i>
                    </div>
                    <span className="font-bold text-xl text-gray-800">Submit New Revision</span>
                </div>
            }
            visible={visible}
            style={{ width: '40vw', minWidth: '450px' }}
            onHide={handleClose}
            closable={!isUploading}
            className="p-fluid rounded-2xl overflow-hidden shadow-2xl"
            pt={{
                header: { className: 'border-b border-gray-100 py-4 px-6 bg-white' },
                content: { className: 'p-6 bg-gray-50/50' },
                footer: { className: 'bg-white p-4 m-0' },
                mask: { className: 'backdrop-blur-sm bg-black/40' }
            }}
            footer={
                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        label="Cancel"
                        onClick={handleClose}
                        disabled={isUploading}
                        className="p-button-text text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors font-semibold shadow-none"
                    />
                    <Button
                        label={isUploading ? 'Uploading...' : 'Upload Revision'}
                        icon={isUploading ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                        disabled={!file || isUploading}
                        className="bg-orange-500 hover:bg-orange-600 border-none px-6 py-2 rounded-xl text-white font-semibold transition-all shadow-none"
                        onClick={handleUpload}
                    />
                </div>
            }
        >
            <div className="flex flex-col gap-5">
                {/* Current info banner */}
                {thesis && (
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                            <i className="pi pi-file-pdf text-2xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Current Version</p>
                            <p className="font-bold text-slate-800 truncate">V{currentVersion ?? 1} — {thesis.title}</p>
                        </div>
                    </div>
                )}

                {/* Upload zone */}
                <div
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 bg-white
                        ${isDragging ? 'border-orange-500 bg-orange-50 scale-[1.01]' : 'border-slate-200 hover:border-orange-400 hover:bg-orange-50/10'}
                        ${file ? 'bg-orange-50/30 border-orange-500/50' : ''}
                    `}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    />
                    {file ? (
                        <>
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-sm">
                                <i className="pi pi-file-word text-4xl" />
                            </div>
                            <p className="font-bold text-slate-800 break-all px-4">{file.name}</p>
                            <button
                                type="button"
                                className="text-sm text-orange-600 font-bold hover:underline"
                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                            >
                                Change File
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
                                <i className="pi pi-cloud-upload text-3xl" />
                            </div>
                            <div>
                                <p className="font-black text-slate-800">Drop revision file here</p>
                                <p className="text-xs text-slate-400 font-medium">PDF or Word documents (max 50MB)</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Note */}
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Revision Summary (Optional)</label>
                    <InputTextarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        placeholder="What changes did you make in this version?"
                        className="w-full !rounded-2xl !border-slate-100 !bg-white focus:!ring-2 focus:!ring-orange-500/10 focus:!border-orange-500 transition-all text-sm resize-none shadow-sm shadow-slate-100"
                        disabled={isUploading}
                    />
                </div>
            </div>
        </Dialog>
    );
};

export default UpdateThesisModal;
