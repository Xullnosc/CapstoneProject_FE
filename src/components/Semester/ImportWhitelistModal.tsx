import { useState, type ChangeEvent, type FC } from 'react';
import { Dialog } from 'primereact/dialog';
import Swal from '../../utils/swal';

interface ImportWhitelistModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface PreviewRow {
    email: string;
    fullName: string;
    role: 'Student' | 'Lecturer' | 'Mentor';
    studentCode?: string;
}

const ImportWhitelistModal: FC<ImportWhitelistModalProps> = ({ isOpen, onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);

            // Mock processing file
            handleMockPreview();
        }
    };

    const handleMockPreview = () => {
        setIsUploading(true);
        setTimeout(() => {
            setPreviewData([
                { email: 'student1@fpt.edu.vn', fullName: 'Nguyen Van A', role: 'Student', studentCode: 'SE123456' },
                { email: 'lecturer1@fpt.edu.vn', fullName: 'Le Thi B', role: 'Lecturer' },
                { email: 'student2@fpt.edu.vn', fullName: 'Tran Van C', role: 'Student', studentCode: 'SE654321' },
                { email: 'mentor1@fpt.edu.vn', fullName: 'Mentor X', role: 'Mentor' },
            ]);
            setIsUploading(false);
        }, 800);
    };

    const handleImport = () => {
        if (previewData.length === 0) return;

        Swal.fire({
            title: 'Importing...',
            text: 'Please wait while we import the data.',
            didOpen: () => {
                Swal.showLoading();
            }
        });

        setTimeout(() => {
            Swal.fire('Success', `Successfully imported ${previewData.length} users.`, 'success');
            onClose();
            setFile(null);
            setPreviewData([]);
        }, 1500);
    };

    const dialogHeader = (
        <div className="flex items-center gap-3 text-gray-800">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-600">upload_file</span>
            </div>
            <div>
                <h3 className="text-xl font-bold">Import Whitelist</h3>
                <p className="text-xs text-gray-500 font-normal">Upload an Excel file to add users in bulk</p>
            </div>
        </div>
    );

    return (
        <Dialog
            header={dialogHeader}
            visible={isOpen}
            style={{ width: '1200px', maxWidth: '98vw' }}
            onHide={onClose}
            className="font-sans"
            contentClassName="p-0 rounded-b-2xl"
            headerClassName="rounded-t-2xl border-b border-gray-100 bg-white p-6"
            maskClassName="bg-gray-900/40 backdrop-blur-sm"
        >
            <div className="flex flex-col gap-6 p-6 bg-white min-h-100">

                {/* File Upload Area */}
                <div className={`
                    border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all
                    ${file ? 'border-green-200 bg-green-50/30 py-4' : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/10 py-8'}
                `}>
                    {!file ? (
                        <div className="flex flex-row items-center gap-6">
                            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                            </div>
                            <div className="text-left">
                                <h4 className="text-base font-bold text-gray-700">Drag & Drop or Click to Upload</h4>
                                <p className="text-xs text-gray-500 mt-0.5">Supported formats: .xlsx, .xls, .csv</p>
                            </div>
                            <label className="cursor-pointer bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm text-sm ml-4">
                                Browse
                                <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
                            </label>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 w-full max-w-md bg-white p-4 rounded-xl border border-green-100 shadow-sm">
                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined">description</span>
                            </div>
                            <div className="flex-1 text-left overflow-hidden">
                                <p className="text-sm font-bold text-gray-800 truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                            <button
                                onClick={() => { setFile(null); setPreviewData([]); }}
                                className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Preview Table */}
                {isUploading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                ) : previewData.length > 0 && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                Data Preview
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{previewData.length} rows</span>
                            </h4>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1 max-h-150 min-h-100  custom-scrollbar relative">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/80 border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student Code</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {previewData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-900 font-medium">{row.email}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-500">{row.fullName}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${row.role === 'Student' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    row.role === 'Lecturer' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                        'bg-gray-50 text-gray-700 border-gray-100'
                                                    }`}>
                                                    {row.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 font-mono">{row.studentCode || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100 flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="text-gray-600 font-bold text-sm px-5 py-2.5 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                    Cancel
                </button>
                <button
                    onClick={handleImport}
                    disabled={previewData.length === 0}
                    className="bg-orange-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">upload</span>
                    Import Data
                </button>
            </div>
        </Dialog>
    );
};

export default ImportWhitelistModal;
