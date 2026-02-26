import { useState, useRef, useEffect } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { authService } from '../../services/authService';
import { thesisService } from '../../services/thesisService';
import { teamService } from '../../services/teamService';
import Swal from '../../utils/swal';
import { AxiosError } from 'axios';

const ProposeThesisPage = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [hasAccess, setHasAccess] = useState(true);
    const [accessMessage, setAccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingAccess, setIsLoadingAccess] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const checkAccess = async () => {
            setIsLoadingAccess(true);
            try {
                const user = authService.getUser();
                if (!user) {
                    setHasAccess(false);
                    setAccessMessage('Please log in to propose a thesis.');
                    return;
                }

                // Based on user persona constraints
                if (user.roleName === 'Lecturer' || user.roleName === 'Admin' || user.roleName === 'HOD') {
                    setHasAccess(true);
                } else if (user.roleName === 'Student') {
                    try {
                        const myTeam = await teamService.getMyTeam();
                        if (!myTeam) {
                            setHasAccess(false);
                            setAccessMessage('You must be in a team to propose a thesis.');
                        } else if (myTeam.leaderId !== user.userId) {
                            setHasAccess(false);
                            setAccessMessage('Only the Team Leader can propose a thesis.');
                        } else {
                            setHasAccess(true);
                        }
                    } catch {
                        setHasAccess(false);
                        setAccessMessage('Unable to verify team status.');
                    }
                } else {
                    setHasAccess(false);
                    setAccessMessage('You do not have permission to propose a thesis.');
                }
            } finally {
                setIsLoadingAccess(false);
            }
        };

        checkAccess();
    }, []);

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
            const selectedFile = files[0];
            // Accept word documents
            if (selectedFile.type === 'application/msword' || selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || selectedFile.name.endsWith('.doc') || selectedFile.name.endsWith('.docx')) {
                setFile(selectedFile);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !description.trim() || !file) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Fields',
                text: 'Please fill in all fields and attach a file.',
                confirmButtonColor: '#f97415'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await thesisService.proposeThesis({
                title: title.trim(),
                shortDescription: description.trim(),
                file: file
            });

            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Thesis proposal submitted successfully!',
                confirmButtonColor: '#f97415'
            });

            // Reset form
            setTitle('');
            setDescription('');
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err: unknown) {
            console.error('Submit error:', err);
            const axiosError = err as AxiosError<{ message?: string, errors?: any }>;

            let errorText = 'There was an error submitting your proposal. Please try again.';
            if (axiosError.response?.data) {
                if (axiosError.response.data.message) {
                    errorText = axiosError.response.data.message;
                } else if (axiosError.response.data.errors) {
                    errorText = JSON.stringify(axiosError.response.data.errors);
                } else {
                    errorText = JSON.stringify(axiosError.response.data);
                }
            } else if (axiosError.message) {
                errorText = axiosError.message;
            }

            Swal.fire({
                icon: 'error',
                title: 'Submission Failed',
                text: errorText,
                confirmButtonColor: '#f97415'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingAccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <i className="pi pi-spin pi-spinner text-4xl text-orange-500"></i>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans flex items-center justify-center">
                <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
                        <i className="pi pi-lock text-3xl"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
                    <p className="text-gray-500">{accessMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans text-gray-800">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600 mb-2">
                        Propose New Thesis
                    </h1>
                    <p className="text-gray-500">Submit a new thesis topic along with a detailed proposal document.</p>
                </div>

                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                        {/* Title Input */}
                        <div className="flex flex-col gap-2">
                            <label htmlFor="title" className="font-semibold text-gray-700">Thesis Title <span className="text-red-500">*</span></label>
                            <InputText
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter a concise and descriptive title"
                                className="w-full p-3 rounded-xl border border-gray-300 hover:border-orange-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors shadow-sm"
                                pt={{
                                    root: { className: 'font-medium text-gray-800' }
                                }}
                            />
                        </div>

                        {/* Description Input */}
                        <div className="flex flex-col gap-2">
                            <label htmlFor="description" className="font-semibold text-gray-700">Short Description <span className="text-red-500">*</span></label>
                            <InputTextarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                placeholder="Provide a brief summary of the thesis objectives and scope"
                                className="w-full p-3 rounded-xl border border-gray-300 hover:border-orange-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors shadow-sm resize-none"
                                pt={{
                                    root: { className: 'font-medium text-gray-800' }
                                }}
                            />
                        </div>

                        {/* File Upload Area */}
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-gray-700">Detailed Proposal Document (Word) <span className="text-red-500">*</span></label>

                            <div
                                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${isDragging ? 'border-orange-500 bg-orange-50 scale-[1.01]' : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/30'} ${file ? 'bg-orange-50/50 border-orange-300' : ''}`}
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

                                {file ? (
                                    <>
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm mb-2">
                                            <i className="pi pi-file-word text-3xl"></i>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-lg">{file.name}</p>
                                            <p className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <Button
                                            label="Change File"
                                            icon="pi pi-refresh"
                                            size="small"
                                            outlined
                                            severity="secondary"
                                            className="mt-2 rounded-xl"
                                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                            type="button"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mb-2 group-hover:scale-110 transition-transform">
                                            <i className="pi pi-cloud-upload text-3xl"></i>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-lg">Click to upload or drag and drop</p>
                                            <p className="text-sm text-gray-500 mt-1">Word Documents (.doc, .docx) up to 10MB</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Submit Actions */}
                        <div className="flex justify-end gap-4 border-t border-gray-100 pt-6 mt-2">
                            <Button
                                label="Cancel"
                                type="button"
                                severity="secondary"
                                text
                                className="px-6 py-3 rounded-xl font-bold"
                            />
                            <Button
                                label={isSubmitting ? "Submitting..." : "Submit Proposal"}
                                type="submit"
                                disabled={isSubmitting}
                                className={`px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 border-none font-bold text-white transition-all duration-300 ${!isSubmitting ? 'hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-200/50' : 'opacity-70 cursor-not-allowed'}`}
                                pt={{
                                    root: { className: 'focus:ring-2 focus:ring-offset-2 focus:ring-orange-500' }
                                }}
                            />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProposeThesisPage;
