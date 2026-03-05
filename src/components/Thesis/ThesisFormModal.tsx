import React, { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import Swal from '../../utils/swal';
import { thesisFormService } from '../../services/thesisFormService';

interface ThesisFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ThesisFormModal: React.FC<ThesisFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = e.dataTransfer.files;
        handleFiles(droppedFiles);
    };

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (files: FileList) => {
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
                setSelectedFile(file);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid File',
                    text: 'Please upload a Word document (.doc or .docx)',
                    confirmButtonColor: '#f97415'
                });
            }
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            Swal.fire({
                icon: 'warning',
                title: 'No file selected',
                text: 'Please select a file to upload.',
                confirmButtonColor: '#f97415'
            });
            return;
        }

        try {
            setIsUploading(true);
            await thesisFormService.uploadForm(selectedFile);
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Thesis form uploaded successfully',
                confirmButtonColor: '#f97415'
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Upload error', error);
            const err = error as { response?: { data?: { message?: string } } };
            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: err?.response?.data?.message || 'Failed to upload thesis form',
                confirmButtonColor: '#f97415'
            });
        } finally {
            setIsUploading(false);
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleHide = () => {
        setSelectedFile(null);
        setIsDragging(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onClose();
    };

    const renderFooter = () => {
        return (
            <div className="flex justify-end gap-3 mt-4 border-t border-gray-100 pt-4">
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    onClick={handleHide}
                    className="p-button-text text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors font-semibold"
                    disabled={isUploading}
                    type="button"
                />
                <Button
                    label={isUploading ? "Uploading..." : "Upload"}
                    icon={isUploading ? "pi pi-spin pi-spinner" : "pi pi-upload"}
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    className="bg-orange-500 hover:bg-orange-600 border-none px-6 py-2 rounded-xl text-white font-semibold transition-all shadow-md shadow-orange-500/20"
                    type="button"
                />
            </div>
        );
    };

    return (
        <Dialog
            header={
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                        <i className="pi pi-cloud-upload text-xl"></i>
                    </div>
                    <span className="font-bold text-xl text-gray-800">Upload Global Thesis Form</span>
                </div>
            }
            visible={isOpen}
            style={{ width: '40vw', minWidth: '450px' }}
            onHide={handleHide}
            footer={renderFooter()}
            className="p-fluid rounded-2xl overflow-hidden shadow-2xl"
            pt={{
                header: { className: 'border-b border-gray-100 py-4 px-6 bg-white' },
                content: { className: 'p-6 bg-gray-50/50' },
                footer: { className: 'bg-white p-4 m-0' },
                mask: { className: 'backdrop-blur-sm bg-black/40' }
            }}
        >
            <div className="flex flex-col gap-4">
                <p className="text-gray-600 text-center leading-relaxed mb-2">
                    Upload the latest official version of the Thesis Proposal Form. <br />
                    This form will be available globally for all semesters.
                </p>

                <div
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 bg-white ${isDragging ? 'border-orange-500 bg-orange-50 scale-[1.02]' : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/30'
                        } ${selectedFile ? 'bg-orange-50/50 border-orange-300' : ''}`}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={onFileSelect}
                    />

                    {selectedFile ? (
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm mb-3">
                                <i className="pi pi-file-word text-4xl"></i>
                            </div>
                            <p className="font-bold text-gray-800 text-lg text-center break-all">{selectedFile.name}</p>
                            <p className="text-sm text-gray-500 mt-1 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <p className="text-xs text-orange-500 mt-4 font-medium flex items-center gap-1 group-hover:text-orange-600">
                                <i className="pi pi-sync"></i> Click to change file
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mb-4 group-hover:scale-110 transition-transform">
                                <i className="pi pi-cloud-upload text-4xl"></i>
                            </div>
                            <p className="font-bold text-gray-800 text-xl mb-2">Drag and drop file here</p>
                            <p className="text-gray-500">or click to browse from your computer</p>
                            <div className="mt-4 flex items-center gap-2 text-sm text-gray-400 font-medium">
                                <i className="pi pi-file-word text-blue-400"></i>
                                <span>Word Documents only (.doc, .docx)</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Dialog>
    );
};

export default ThesisFormModal;
