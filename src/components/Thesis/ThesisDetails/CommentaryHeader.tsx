import React from "react";
import type { Thesis } from "../../../types/thesis";

interface CommentaryHeaderProps {
  thesis: Thesis;
  subtitle: string;
}

const CommentaryHeader: React.FC<CommentaryHeaderProps> = ({
  thesis,
  subtitle,
}) => {
  return (
    <header className="bg-white pt-6 pb-2 px-4 md:px-8 rounded-2xl border border-slate-200/70 shadow-sm">
      <div className="flex flex-col gap-2 max-w-[1440px] mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
            {thesis.title}{" "}
            <span className="font-light text-slate-500 ml-0 md:ml-2 block md:inline text-base md:text-2xl">
              #{thesis.thesisId.slice(0, 8).toUpperCase()}
            </span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 font-semibold text-xs border border-orange-100">
            <i className="pi pi-eye text-[12px] mr-1" />
            {thesis.status}
          </span>
          <span className="text-slate-500 font-medium">{subtitle}</span>
        </div>
      </div>
    </header>
  );
};

export default React.memo(CommentaryHeader);
