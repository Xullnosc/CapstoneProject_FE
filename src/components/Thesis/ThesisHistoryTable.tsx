import type { ThesisHistory } from '../../types/thesis';

interface Props {
    histories: ThesisHistory[];
}

const ThesisHistoryTable = ({ histories }: Props) => {
    if (!histories || histories.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400 text-sm">
                <i className="pi pi-history text-3xl mb-2 block" />
                <p>No version history yet.</p>
            </div>
        );
    }

    const sorted = [...histories].sort((a, b) => b.versionNumber - a.versionNumber);

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                        <th className="px-6 py-3">Version</th>
                        <th className="px-6 py-3">Upload Date</th>
                        <th className="px-6 py-3">Uploaded By</th>
                        <th className="px-6 py-3">Note</th>
                        <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {sorted.map((h, index) => {
                        const isLatest = index === 0;
                        return (
                            <tr
                                key={h.id}
                                className={isLatest ? 'bg-primary/5' : 'hover:bg-slate-50'}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-bold ${isLatest ? 'text-primary' : 'text-slate-700'}`}>
                                            V{h.versionNumber}
                                        </span>
                                        {isLatest && (
                                            <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-bold uppercase">
                                                Latest
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {formatDate(h.createdAt)}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {h.uploaderName ?? '—'}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 italic">
                                    {h.note ? `"${h.note}"` : '—'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {h.fileUrl ? (
                                        <a
                                            href={h.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:bg-orange-50 p-2 rounded-lg transition-colors inline-block"
                                            title="Download this version"
                                        >
                                            <i className="pi pi-download" />
                                        </a>
                                    ) : (
                                        <span className="text-slate-300 p-2 inline-block">
                                            <i className="pi pi-download" />
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ThesisHistoryTable;
