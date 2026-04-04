import { useState, type ChangeEvent, type FC } from 'react';
import { Dialog } from 'primereact/dialog';
import Swal from '../../utils/swal';
import { whitelistService } from '../../services/whitelistService';
import type { ImportWhitelistRow, ImportError, ImportResult, WhitelistRowOverride } from '../../services/whitelistService';
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
    const PREVIEW_PAGE_SIZE = 10;
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<ImportWhitelistRow[]>([]);
    const [previewErrors, setPreviewErrors] = useState<ImportError[]>([]);
    const [excludedRowNumbers, setExcludedRowNumbers] = useState<number[]>([]);
    const [rowOverrides, setRowOverrides] = useState<WhitelistRowOverride[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Edit-row state: which conflict row is being corrected
    const [editingConflictRow, setEditingConflictRow] = useState<ImportWhitelistRow | null>(null);
    const [editForm, setEditForm] = useState({ email: '', fullName: '', studentCode: '' });

    const conflictRows = previewData.filter((row) => row.isMarked);
    const hasBlockingConflicts = conflictRows.length > 0;

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        await processFile(e.target.files[0]);
    };

    const loadPreview = async (selectedFile: File, excluded?: number[], overrides?: WhitelistRowOverride[]) => {
        if (!semesterId) return;

        setIsUploading(true);
        try {
            const effectiveExcludedRows = excluded ?? excludedRowNumbers;
            const effectiveOverrides = overrides ?? rowOverrides;
            const result: ImportResult<ImportWhitelistRow> = await whitelistService.previewImport(semesterId, selectedFile, {
                excludedRowNumbers: effectiveExcludedRows,
                rowOverrides: effectiveOverrides,
            });

            setPreviewData(result.items);
            setPreviewErrors(result.errors);
            if (result.errors.length > 0) {
                Swal.fire('Notice', `${result.errors.length} row(s) contain errors.`, 'warning');
            }
            const markedCount = result.items.filter((item) => item.isMarked).length;
            if (markedCount > 0) {
                Swal.fire(
                    'Conflict detected',
                    `${markedCount} row(s) conflict with non-student roles and cannot be imported until corrected.`,
                    'warning'
                );
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

    const processFile = async (selectedFile: File) => {
        if (!semesterId) return;
        setFile(selectedFile);
        setExcludedRowNumbers([]);
        setRowOverrides([]);
        setEditingConflictRow(null);
        await loadPreview(selectedFile, [], []);
    };

    const handleRemovePreviewRow = async (row: ImportWhitelistRow) => {
        if (row.rowNumber == null) {
            Swal.fire('Error', 'Unable to remove this row because row number is missing.', 'error');
            return;
        }

        const result = await Swal.fire({
            title: 'Remove this row?',
            text: `Row ${row.rowNumber} will be excluded from this import batch.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f26e21',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, remove row'
        });

        if (!result.isConfirmed || !file) return;

        const nextExcluded = Array.from(new Set([...excludedRowNumbers, row.rowNumber]));
        setExcludedRowNumbers(nextExcluded);
        // Remove any override for this row so it doesn't linger.
        setRowOverrides((prev) => prev.filter((o) => o.rowNumber !== row.rowNumber));
        setPreviewData((prev) => prev.filter((item) => item.rowNumber !== row.rowNumber));
    };

    // Open the edit dialog for a specific preview row.
    const startEditConflictRow = (row: ImportWhitelistRow) => {
        const existing = rowOverrides.find((o) => o.rowNumber === row.rowNumber);
        setEditForm({
            email: existing?.email ?? row.email,
            fullName: existing?.fullName ?? row.fullName ?? '',
            studentCode: existing?.studentCode ?? row.studentCode ?? '',
        });
        setEditingConflictRow(row);
    };

    const handleSaveEditedRow = async () => {
        if (editingConflictRow?.rowNumber == null || !file) return;
        const newOverride: WhitelistRowOverride = {
            rowNumber: editingConflictRow.rowNumber,
            ...(editForm.email.trim() && { email: editForm.email.trim() }),
            ...(editForm.fullName.trim() && { fullName: editForm.fullName.trim() }),
            ...(editForm.studentCode.trim() && { studentCode: editForm.studentCode.trim() }),
        };
        const updatedOverrides = [
            ...rowOverrides.filter((o) => o.rowNumber !== editingConflictRow.rowNumber),
            newOverride,
        ];
        setRowOverrides(updatedOverrides);
        setEditingConflictRow(null);
        // Re-run preview so backend can re-validate with the new values.
        await loadPreview(file, excludedRowNumbers, updatedOverrides);
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
        if (hasBlockingConflicts) {
            Swal.fire('Import blocked', 'Please remove or fix rows marked as conflicts before importing.', 'warning');
            return;
        }

        Swal.fire({
            title: 'Importing...',
            text: 'Please wait while we import the data.',
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const result: ImportResult<ImportWhitelistRow> = await whitelistService.importWhitelist(semesterId, file, excludedRowNumbers, rowOverrides);
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
                                onClick={() => {
                                    setFile(null);
                                    setPreviewData([]);
                                    setPreviewErrors([]);
                                    setExcludedRowNumbers([]);
                                    setRowOverrides([]);
                                    setEditingConflictRow(null);
                                }}
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
                            {hasBlockingConflicts && (
                            <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                                {conflictRows.length} conflicting row(s) — click <span className="material-symbols-outlined text-[11px] align-middle">edit</span> to fix
                            </span>
                        )}
                        </div>
                        <SemesterWhitelistsTable
                            whitelists={previewData.map((row, idx) => ({
                                whitelistId: idx, // dummy for preview
                                email: row.email,
                                fullName: row.fullName,
                                roleName: row.role,
                                studentCode: row.studentCode,
                                campus: row.campus || '',
                                semesterCode: row.semesterCode,
                                semesterName: row.semesterName,
                                isReviewer: false,
                                addedDate: new Date().toISOString(),
                                semesterId: semesterId,
                                avatar: ''
                            }))}
                            showStudentCode={true}
                            showSemester={true}
                            canEdit={(user) => {
                                const sourceRow = previewData.find((row) => row.email === user.email && row.studentCode === user.studentCode)
                                    ?? previewData.find((row) => row.email === user.email)
                                    ?? null;
                                return Boolean(sourceRow?.isMarked);
                            }}
                            onEdit={(user) => {
                                const sourceRow = previewData.find((row) => row.email === user.email && row.studentCode === user.studentCode)
                                    ?? previewData.find((row) => row.email === user.email)
                                    ?? null;
                                if (!sourceRow?.isMarked) return;
                                startEditConflictRow(sourceRow);
                            }}
                            onDelete={(user) => {
                                const sourceRow = previewData.find((row) => row.email === user.email && row.studentCode === user.studentCode)
                                    ?? previewData.find((row) => row.email === user.email)
                                    ?? null;
                                if (!sourceRow) return;
                                return handleRemovePreviewRow(sourceRow);
                            }}
                            rowsPerPage={PREVIEW_PAGE_SIZE}
                        />
                    </div>
                )}

                {hasBlockingConflicts && (
                    <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-red-800">Blocking Conflicts</h4>
                            <span className="text-xs text-red-600">Edit student info to resolve each conflict</span>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {conflictRows.map((row, idx) => (
                                <div key={`${row.email}-${idx}`} className="flex items-start justify-between gap-3 text-xs py-1 border-b border-red-100 last:border-0">
                                    <span className="text-red-700 leading-relaxed">
                                        <strong>Row {row.rowNumber ?? '-'}</strong> (<em>{row.email}</em>) —{' '}
                                        conflicts with role &quot;{row.existingRole || 'Unknown'}&quot;: {row.markedReason || 'This record is marked as conflicting.'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => startEditConflictRow(row)}
                                        className="shrink-0 flex items-center gap-1 px-2 py-1 bg-orange-500 text-white text-[11px] font-bold rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[13px]">edit</span>
                                        Fix
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Edit-row dialog — floats on top; avoids scroll/overflow clipping issues */}
                <Dialog
                    header={
                        <div className="flex items-center gap-2 text-gray-800">
                            <span className="material-symbols-outlined text-orange-500">edit</span>
                            <span className="font-bold text-base">
                                Edit Row {editingConflictRow?.rowNumber} — Resolve Conflict
                            </span>
                        </div>
                    }
                    visible={editingConflictRow != null}
                    style={{ width: '480px', maxWidth: '96vw' }}
                    onHide={() => setEditingConflictRow(null)}
                    className="font-sans"
                    headerClassName="rounded-t-2xl border-b border-gray-100 bg-white px-6 py-4"
                    contentClassName="p-0 rounded-b-2xl"
                    maskClassName="bg-gray-900/50 backdrop-blur-sm"
                    draggable={false}
                    resizable={false}
                >
                    <div className="p-6 flex flex-col gap-4 bg-white">
                        {editingConflictRow && (
                            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                Existing conflict: &quot;{editingConflictRow.existingRole || 'Unknown'}&quot; role already uses this email or student code.
                                Change the values below so they no longer overlap.
                            </p>
                        )}
                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={editForm.fullName}
                                    onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Student Code</label>
                                <input
                                    type="text"
                                    value={editForm.studentCode}
                                    onChange={(e) => setEditForm((p) => ({ ...p, studentCode: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400">
                            Changes are validated by the server. If the conflict persists after saving, the row will remain blocked.
                        </p>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setEditingConflictRow(null)}
                            className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveEditedRow}
                            disabled={isUploading}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-orange-500/20"
                        >
                            {isUploading
                                ? <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                                : <span className="material-symbols-outlined text-[18px]">check</span>
                            }
                            Apply & Re-validate
                        </button>
                    </div>
                </Dialog>

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
                        setFile(null);
                        setPreviewData([]);
                        setPreviewErrors([]);
                        setExcludedRowNumbers([]);
                        setRowOverrides([]);
                        setEditingConflictRow(null);
                        onClose();
                    }}
                    className="text-gray-600 font-bold text-sm px-5 py-2.5 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                    Cancel
                </button>
                <button
                    onClick={handleImport}
                    disabled={previewData.length === 0 || isUploading || hasBlockingConflicts}
                    className="bg-orange-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">upload</span>
                    {hasBlockingConflicts ? 'Resolve Conflicts To Import' : 'Import Data'}
                </button>
            </div>
        </Dialog>
    );
};

export default ImportWhitelistModal;
