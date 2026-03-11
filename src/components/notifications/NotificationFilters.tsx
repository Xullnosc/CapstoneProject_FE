import React from 'react';
import type { FilterType } from '../../types/notification';

interface NotificationFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const NotificationFilters: React.FC<NotificationFiltersProps> = ({ activeFilter, onFilterChange }) => {
  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'archived', label: 'Archived' },
  ];

  return (
    <div className="flex border-t border-orange-100">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`
            flex-1 py-3 text-sm font-medium transition-all
            ${
              activeFilter === filter.value
                ? 'border-b-2 border-orange-500 text-orange-600 font-bold'
                : 'border-b-2 border-transparent text-gray-500 hover:text-orange-500 hover:border-orange-200'
            }
          `}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default NotificationFilters;
