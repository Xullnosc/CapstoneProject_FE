import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface ReviewBreadcrumbProps {
    items: BreadcrumbItem[];
    title: string;
    subtitle?: string;
    semesterCode?: string;
    actions?: React.ReactNode;
}

/**
 * Shared breadcrumb component for all Review pages.
 * Provides consistent navigation hierarchy across: Dashboard → sub-pages.
 */
const ReviewBreadcrumb: React.FC<ReviewBreadcrumbProps> = ({
    items,
    title,
    subtitle,
    semesterCode,
    actions
}) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white border-b border-gray-200 mb-8">
            <div className="max-w-[1200px] mx-auto w-full px-6 py-5">
                {/* Breadcrumb trail */}
                <nav className="mb-3 flex items-center gap-2 text-sm" aria-label="Breadcrumb">
                    {items.map((item, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && (
                                <span className="material-symbols-outlined text-[18px] text-slate-300 select-none">
                                    chevron_right
                                </span>
                            )}
                            {item.path ? (
                                <button
                                    onClick={() => navigate(item.path!)}
                                    className="text-slate-500 hover:text-orange-600 transition-colors cursor-pointer bg-transparent border-none p-0"
                                >
                                    {item.label}
                                </button>
                            ) : (
                                <span className="text-orange-600 font-bold">{item.label}</span>
                            )}
                        </React.Fragment>
                    ))}
                </nav>

                {/* Page header row */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900">{title}</h1>
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                            {subtitle && (
                                <span className="text-sm text-gray-500">{subtitle}</span>
                            )}
                            {semesterCode && (
                                <span className="inline-flex items-center rounded-md bg-orange-50 px-2.5 py-0.5 text-sm font-semibold text-orange-600 ring-1 ring-inset ring-orange-200">
                                    {semesterCode}
                                </span>
                            )}
                        </div>
                    </div>
                    {actions && (
                        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewBreadcrumb;
