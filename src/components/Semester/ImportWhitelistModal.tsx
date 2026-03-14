import { useState, type ChangeEvent, type FC } from 'react';
import { Dialog } from 'primereact/dialog';
import Swal from '../../utils/swal';
import { whitelistService } from '../../services/whitelistService';
import type { PreviewRow, ImportError, ImportResult } from '../../services/whitelistService';
import SemesterWhitelistsTable from './SemesterWhitelistsTable';

interface ImportWhitelistModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** id of semester we are importing into */
    semesterId: number;
    /** optional callback when import succeeds (parent may refresh data) */
    onSuccess?: () => void;
}

const ImportWhitelistModal: FC<ImportWhitelistModalProps> = ({ isOpen, onClose, semesterId, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
    const [previewErrors, setPreviewErrors] = useState<ImportError[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        await processFile(e.target.files[0]);
    };

    const processFile = async (selectedFile: File) => {
        if (!semesterId) return;
        setFile(selectedFile);
        setIsUploading(true);
        try {
            const result: ImportResult<PreviewRow> = await whitelistService.previewImport(semesterId, selectedFile);
            setPreviewData(result.items);
            setPreviewErrors(result.errors);
            if (result.errors.length > 0) {
                Swal.fire('Notice', `${result.errors.length} row(s) contain errors.`, 'warning');
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Unable to parse file.', 'error');
            setPreviewData([]);
            setPreviewErrors([]);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = e.dataTransfer.files;
        if (!droppedFiles || droppedFiles.length === 0) return;

        const droppedFile = droppedFiles[0];
        const isExcelFile = droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            droppedFile.type === 'application/vnd.ms-excel' ||
            droppedFile.name.endsWith('.xlsx') ||
            droppedFile.name.endsWith('.xls');

        if (!isExcelFile) {
            Swal.fire('Invalid file', 'Please drop an Excel file (.xlsx or .xls)', 'error');
            return;
        }

        await processFile(droppedFile);
    };

    const handleImport = async () => {
        if (!file || previewData.length === 0 || !semesterId) return;

        Swal.fire({
            title: 'Importing...',
            text: 'Please wait while we import the data.',
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const result: ImportResult<PreviewRow> = await whitelistService.importWhitelist(semesterId, file);
            const successCount = result.items.length;
            const errorCount = result.errors.length;
            let msg = `Successfully imported ${successCount} users.`;
            if (errorCount) msg += `\n${errorCount} row(s) were skipped due to conflicts.`;
            Swal.fire({
                icon: successCount > 0 ? 'success' : 'warning',
                title: successCount > 0 ? 'Import Complete' : 'Nothing Imported',
                text: msg
            });
            if (errorCount) {
                console.warn('import errors', result.errors);
            }
            if (onSuccess) onSuccess();
            onClose();
            setFile(null);
            setPreviewData([]);
            setPreviewErrors([]);
        } catch (err: unknown) {
    console.error(err);

    let msg = 'Import failed. Please try again.';

    if (typeof err === 'object' && err !== null && 'response' in err) {
        const e = err as { response?: { data?: { message?: string } } };
        msg = e.response?.data?.message ?? msg;
    }

    Swal.fire('Error', msg, 'error');
}
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
                <div
                    className={`
                        border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all
                        ${isDragging ? 'border-orange-400 bg-orange-50/30 scale-105' :
                            file ? 'border-green-200 bg-green-50/30 py-4' : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/10 py-8'}
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {!file ? (
                        <div className="flex flex-row items-center gap-6">
                            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                            </div>
                            <div className="text-left">
                                <h4 className="text-base font-bold text-gray-700">Drag & Drop or Click to Upload</h4>
                                <p className="text-xs text-gray-500 mt-0.5">Supported formats: .xlsx, .xls</p>
                            </div>
                            <label className="cursor-pointer bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm text-sm ml-4">
                                Browse
                                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
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
                            </h4>
                        </div>
                        <SemesterWhitelistsTable
                            whitelists={previewData.map((row, idx) => ({
                                whitelistId: idx, // dummy for preview
                                email: row.email,
                                fullName: row.fullName,
                                roleName: row.role,
                                studentCode: row.studentCode,
                                campus: '',
                                isReviewer: false,
                                addedDate: new Date().toISOString(),
                                semesterId: semesterId,
                                avatar: ''
                            }))}
                            showStudentCode={true}
                            rowsPerPage={5} // Smaller for modal
                        />
                    </div>
                )}

                {/* Preview errors */}
                {previewErrors.length > 0 && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="text-sm font-bold text-yellow-800 mb-2">Preview Errors</h4>
                        <ul className="list-disc list-inside text-xs text-yellow-700 max-h-40 overflow-y-auto">
                            {previewErrors.map((err, idx) => (
                                <li key={idx}>
                                    Row {err.row}, column "{err.column}": {err.message}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100 flex justify-end gap-3">
                <button
                    onClick={() => {
                        // reset when closing
                        setFile(null);
                        setPreviewData([]);
                        onClose();
                    }}
                    className="text-gray-600 font-bold text-sm px-5 py-2.5 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                    Cancel
                </button>
                <button
                    onClick={handleImport}
                    disabled={previewData.length === 0 || isUploading}
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
