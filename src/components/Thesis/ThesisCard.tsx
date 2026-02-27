import { useNavigate } from 'react-router-dom';
import type { Thesis } from '../../types/thesis';
import ThesisStatusBadge from './ThesisStatusBadge';

interface Props {
    thesis: Thesis;
    onUploadClick?: (thesis: Thesis) => void;
    canUpload?: boolean;
}

const ThesisCard = ({ thesis, onUploadClick, canUpload = false }: Props) => {
    const navigate = useNavigate();

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'N/A';
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

    // Use updateDate first, then upDate as fallback (both may be returned from BE)
    const displayDate = thesis.updateDate ?? thesis.upDate;

    return (
        <div className="bg-white border rounded-2xl border-slate-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col overflow-hidden">
            <div className="p-6 flex-1 bg-white">
                {/* Header: Title + Status */}
                <div className="flex justify-between items-start gap-4 mb-4">
                    <h3 className="text-slate-900 font-bold text-base leading-snug line-clamp-2 flex-1">
                        {thesis.title}
                    </h3>
                    <ThesisStatusBadge status={thesis.status} />
                </div>

                {/* Author */}
                {thesis.ownerName && (
                    <div className="flex items-center gap-3 mb-3">
                        <div className="size-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold flex-shrink-0">
                            {thesis.ownerName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-slate-600 text-sm font-medium">{thesis.ownerName}</span>
                    </div>
                )}

                {/* Description */}
                {thesis.shortDescription && (
                    <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">
                        {thesis.shortDescription}
                    </p>
                )}

                {/* Footer: date */}
                <div className="flex items-center text-xs text-slate-400 gap-1">
                    <i className="pi pi-history text-xs" />
                    <span>Last updated: {formatDate(displayDate)}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 pt-2 flex flex-col sm:flex-row gap-3">
                <button
                    onClick={() => navigate(`/thesis/${thesis.thesisId}`)}
                    className="flex-1 py-2.5 border-2 border-primary text-primary font-bold rounded-xl hover:bg-orange-50 transition-colors text-sm"
                >
                    View Details
                </button>
                {canUpload && (
                    <button
                        onClick={() => onUploadClick?.(thesis)}
                        className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm text-sm"
                    >
                        Upload New
                    </button>
                )}
            </div>
        </div>
    );
};

export default ThesisCard;
