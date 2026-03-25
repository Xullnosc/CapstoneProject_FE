import React from "react";

interface ResultTimelineItemProps {
  canFinalize: boolean;
  onFinalize: () => void;
  decision: string | null | undefined;
}

const ResultTimelineItem: React.FC<ResultTimelineItemProps> = ({
  canFinalize,
  onFinalize,
  decision,
}) => {
  const decisionText = decision
    ? `Current final decision: ${decision}.`
    : "No final decision has been submitted yet.";

  return (
    <section className="relative z-10 pl-10">
      <span className="absolute left-[10px] top-7 w-3 h-3 rounded-full bg-white border-2 border-orange-400 shadow-sm" />
      <div className="bg-white rounded-xl border border-slate-300/25 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
            <i className="pi pi-check-circle text-sm" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900">
              Idea Result
            </h3>
            <p className="text-sm text-slate-500 mt-1 mb-2 leading-relaxed">
              The proposed idea has been evaluated based on its core merits. HOD
              has the authority to finalize the decision.
            </p>
            <p className="text-xs text-slate-500 mb-5">{decisionText}</p>
            {canFinalize && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onFinalize}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded font-semibold text-sm transition-all active:scale-[0.98] flex items-center gap-2"
                >
                  <i className="pi pi-check-circle text-sm" />
                  Finalize Idea
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(ResultTimelineItem);
