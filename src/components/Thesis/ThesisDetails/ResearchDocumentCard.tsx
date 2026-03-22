import React from "react";

interface ResearchDocumentCardProps {
  fileUrl: string | null;
}

const ResearchDocumentCard: React.FC<ResearchDocumentCardProps> = ({
  fileUrl,
}) => {
  return (
    <section className="relative z-10 pl-10">
      <span className="absolute left-[10px] top-7 w-3 h-3 rounded-full bg-white border-2 border-orange-400 shadow-sm" />
      <div className="bg-white rounded-xl overflow-hidden border border-slate-300/25 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <i className="pi pi-file text-sm text-slate-400" />
          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Research document
          </h5>
        </div>
        <button
          type="button"
          className="w-full border-2 border-dashed border-slate-300/40 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-100/40 hover:bg-orange-50/40 transition-colors"
          onClick={() =>
            fileUrl && window.open(fileUrl, "_blank", "noopener,noreferrer")
          }
        >
          <div className="w-12 h-14 bg-white border border-slate-200 rounded-lg flex items-center justify-center mb-4 shadow-sm">
            <i className="pi pi-file-pdf text-slate-400" />
          </div>
          <span className="text-sm font-bold text-slate-900 mb-1">
            {fileUrl ? "Open Proposal PDF" : "No proposal uploaded"}
          </span>
          {fileUrl && (
            <span className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 transition-colors font-medium">
              View in Browser
              <i className="pi pi-external-link text-[10px]" />
            </span>
          )}
        </button>
      </div>
    </section>
  );
};

export default React.memo(ResearchDocumentCard);
