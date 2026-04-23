import React from 'react';

interface DiscoveryGridProps<T> {
  items: T[];
  loading: boolean;
  renderItem: (item: T) => React.ReactNode;
  emptyIcon: string;
  emptyMessage: string;
}

const DiscoveryGrid = <T,>({ items, loading, renderItem, emptyIcon, emptyMessage }: DiscoveryGridProps<T>) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <span className="material-symbols-outlined text-4xl text-[#F27123] animate-spin">progress_activity</span>
        <p className="mt-4 text-slate-500 font-medium">Scanning for partners...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="col-span-full py-20 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
        <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">{emptyIcon}</span>
        <p className="text-slate-500 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(renderItem)}
    </div>
  );
};

export default DiscoveryGrid;
