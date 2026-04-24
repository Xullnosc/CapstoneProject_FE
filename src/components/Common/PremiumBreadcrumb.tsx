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
        <nav className={`flex items-center gap-2 text-sm ${className}`}>
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    {item.to ? (
                        <Link
                            to={item.to}
                            className="text-slate-500 hover:text-orange-600 transition-colors duration-200"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-orange-600 font-bold">{item.label}</span>
                    )}
                    {index < items.length - 1 && (
                        <span className="material-symbols-outlined text-[18px] text-slate-300 select-none">
                            chevron_right
                        </span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};

export default PremiumBreadcrumb;
