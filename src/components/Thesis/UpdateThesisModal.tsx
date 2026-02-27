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

    const formatFileSize = (bytes: number) =>
        bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

    // Current version = max versionNumber from history array
    const currentVersion = thesis?.histories?.length
        ? Math.max(...thesis.histories.map(h => h.versionNumber))
        : null;

    return (
        <Dialog
            header={
                <div className="flex items-center gap-2 text-slate-800">
                    <i className="pi pi-cloud-upload text-primary text-lg" />
                    <span className="font-bold text-lg">Upload New Version</span>
                </div>
            }
            visible={visible}
            style={{ width: '90vw', maxWidth: '600px' }}
            onHide={handleClose}
            closable={!isUploading}
            pt={{
                header: { className: 'rounded-t-2xl border-b border-slate-100 pb-4' },
                content: { className: 'p-6 rounded-b-2xl' }
            }}
        >
            <div className="flex flex-col gap-5">
                {/* Current version info */}
                {thesis && (
                    <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-3">
                        <i className="pi pi-file-pdf text-slate-400 text-xl" />
                        <div>
                            <p className="text-xs text-slate-400 mb-0.5">Current file</p>
                            <p className="text-sm font-semibold text-slate-700 leading-none line-clamp-1">
                                {thesis.title}
                                {currentVersion !== null && (
                                    <span className="ml-2 text-xs text-slate-500 font-normal">(Version {currentVersion})</span>
                                )}
                            </p>
                        </div>
                    </div>
                )}

                {/* Upload zone */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Upload New File <span className="text-red-500">*</span>
                    </label>
                    <div
                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3
                            ${isDragging ? 'border-primary bg-orange-50 scale-[1.01]' : 'border-slate-300 hover:border-primary hover:bg-orange-50/30'}
                            ${file ? 'bg-orange-50/50 border-primary/50' : ''}
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
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={(e) => e.target.files && handleFiles(e.target.files)}
                        />
                        {file ? (
                            <>
                                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-sm">
                                    <i className="pi pi-file text-3xl" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{file.name}</p>
                                    <p className="text-sm text-slate-400 mt-0.5">{formatFileSize(file.size)}</p>
                                </div>
                                <button
                                    type="button"
                                    className="text-sm text-primary font-semibold hover:underline"
                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                >
                                    Remove
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                                    <i className="pi pi-cloud-upload text-3xl" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">Drag & drop your file here</p>
                                    <p className="text-sm text-slate-400 mt-1">or click to browse (PDF / Word, max 50MB)</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Note */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Version Note <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <InputTextarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        placeholder="e.g. Updated chapter 3 and conclusion..."
                        className="w-full rounded-xl border border-slate-300 hover:border-primary focus:ring-1 focus:ring-primary/30 focus:border-primary transition-colors text-sm resize-none"
                        disabled={isUploading}
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                    <Button
                        label="Cancel"
                        type="button"
                        severity="secondary"
                        text
                        className="px-5 py-2.5 rounded-xl font-semibold"
                        onClick={handleClose}
                        disabled={isUploading}
                    />
                    <Button
                        label={isUploading ? 'Uploading...' : 'Confirm Upload'}
                        icon={isUploading ? 'pi pi-spin pi-spinner' : 'pi pi-cloud-upload'}
                        type="button"
                        disabled={!file || isUploading}
                        className="px-6 py-2.5 bg-primary border-primary text-white font-bold rounded-xl"
                        onClick={handleUpload}
                    />
                </div>
            </div>
        </Dialog>
    );
};

export default UpdateThesisModal;
