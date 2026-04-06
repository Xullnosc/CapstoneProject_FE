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
  const displayDecision = decision === 'Pass' ? 'OK' : decision === 'Fail' ? 'Consider' : decision;
  const decisionText = decision
    ? `Current final decision: ${displayDecision}.`
    : "No final decision has been submitted yet.";

  const isPass = decision === "Pass";
  const isFail = decision === "Fail";
  const accent = isPass
    ? {
        dot: "border-emerald-500",
        card: "border-emerald-300/70 bg-emerald-50/35",
        icon: "bg-emerald-500",
        title: "text-emerald-900",
        decision: "text-emerald-700 bg-emerald-50 border-emerald-200",
      }
    : isFail
      ? {
          dot: "border-rose-500",
          card: "border-rose-300/70 bg-rose-50/35",
          icon: "bg-rose-500",
          title: "text-rose-900",
          decision: "text-rose-700 bg-rose-50 border-rose-200",
        }
      : {
          dot: "border-orange-400",
          card: "border-slate-300/25 bg-white",
          icon: "bg-orange-500",
          title: "text-slate-900",
          decision: "text-slate-600 bg-slate-50 border-slate-200",
        };

  return (
    <section className="relative z-10 pl-10">
      <span className={`absolute left-[10px] top-7 w-3 h-3 rounded-full bg-white border-2 shadow-sm ${accent.dot}`} />
      <div className={`rounded-xl border p-6 shadow-sm ${accent.card}`}>
        <div className="flex items-start gap-4">
          <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0 ${accent.icon}`}>
            <i className="pi pi-check-circle text-sm" />
          </div>
          <div className="flex-1">
            <h3 className={`text-base font-semibold ${accent.title}`}>
            Thesis Result
            </h3>
            <p className="text-sm text-slate-500 mt-1 mb-2 leading-relaxed">
              The proposed idea has been evaluated based on its core merits. HOD
              has the authority to finalize the decision.
            </p>
            <p className={`text-xs mb-5 inline-flex items-center px-2.5 py-1 rounded-md border font-semibold ${accent.decision}`}>
              {decisionText}
            </p>
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
