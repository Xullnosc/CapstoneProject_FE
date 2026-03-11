import React from 'react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
    label: string;
    to?: string;
}

interface PremiumBreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

const PremiumBreadcrumb: React.FC<PremiumBreadcrumbProps> = ({ items, className = '' }) => {
    return (
        <nav className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${className}`}>
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    {item.to ? (
                        <Link
                            to={item.to}
                            className="text-slate-400 hover:text-orange-600 transition-colors duration-200"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-slate-900">{item.label}</span>
                    )}
                    {index < items.length - 1 && (
                        <i className="pi pi-chevron-right text-[10px] text-slate-300" />
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};

export default PremiumBreadcrumb;
