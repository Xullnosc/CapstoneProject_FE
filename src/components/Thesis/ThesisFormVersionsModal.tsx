import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { format } from 'date-fns';
import { thesisFormService } from '../../services/thesisFormService';
import type { ThesisFormHistory } from '../../types/thesisForm';

interface ThesisFormVersionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ThesisFormVersionsModal: React.FC<ThesisFormVersionsModalProps> = ({ isOpen, onClose }) => {
    const [histories, setHistories] = useState<ThesisFormHistory[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchHistories();
        }
    }, [isOpen]);

    const fetchHistories = async () => {
        try {
            setLoading(true);
            const response = await thesisFormService.getFormHistories();
            setHistories(response.data);
        } catch (error) {
            console.error('Failed to fetch thesis form histories:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog
            header={
                <div className="flex flex-col">
                    <span className="text-xl font-bold text-gray-800">Thesis Form Versions</span>
                    <span className="text-sm font-normal text-gray-500 mt-1">
                        Select a version to download
                    </span>
                </div>
            }
            visible={isOpen}
            style={{ width: '600px', maxWidth: '95vw' }}
            onHide={onClose}
            className="rounded-xl overflow-hidden shadow-2xl"
            maskClassName="backdrop-blur-sm bg-gray-900/40"
            contentClassName="p-0 border-t border-gray-100"
            headerClassName="bg-gray-50/50 border-b border-gray-100 py-4 px-6"
        >
            <div className="p-6 bg-slate-50 min-h-[300px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-48 space-y-4">
                        <i className="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
                        <p className="text-sm text-gray-500">Loading versions...</p>
                    </div>
                ) : histories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                        <i className="pi pi-folder-open text-5xl text-gray-300 mb-3"></i>
                        <p className="text-gray-500 font-medium">No versions found</p>
                        <p className="text-sm text-gray-400 mt-1">There are no uploaded thesis forms yet.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {histories.map((history, index) => {
                            const isLatest = index === 0; // The API returns order by desc
                            return (
                                <div
                                    key={history.id}
                                    className={`bg-white border rounded-xl p-4 flex items-center justify-between transition-all hover:shadow-md ${isLatest ? 'border-blue-200 ring-1 ring-blue-50' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 p-2 rounded-lg flex items-center justify-center shrink-0 ${isLatest ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'
                                            }`}>
                                            <i className="pi pi-file-word text-xl"></i>
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-800">
                                                    Version {history.versionNumber}
                                                </h4>
                                                {isLatest && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                                                        Latest
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                                                <i className="pi pi-calendar text-[10px]"></i>
                                                {format(new Date(history.createdAt), 'MMM dd, yyyy HH:mm')}
                                            </p>
                                            {history.uploaderName && (
                                                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                                                    <i className="pi pi-user text-[10px]"></i>
                                                    {history.uploaderName}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <a
                                        href={history.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isLatest
                                                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <i className="pi pi-download text-xs"></i>
                                        Download
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Dialog>
    );
};

export default ThesisFormVersionsModal;
