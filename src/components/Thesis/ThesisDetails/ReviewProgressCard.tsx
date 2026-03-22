import React from "react";

interface ReviewProgressCardProps {
  reviewedCount: number;
  totalCount: number;
  latestReviewer?: string;
}

const ReviewProgressCard: React.FC<ReviewProgressCardProps> = ({
  reviewedCount,
  totalCount,
  latestReviewer,
}) => {
  const safeTotal = Math.max(totalCount, 1);
  const progress = Math.min(100, Math.round((reviewedCount / safeTotal) * 100));

  return (
    <section className="relative z-10 pl-10">
      <span className="absolute left-[10px] top-7 w-3 h-3 rounded-full bg-white border-2 border-orange-400 shadow-sm" />
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
            <i className="pi pi-hourglass text-orange-600 text-sm" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              {reviewedCount} of {safeTotal} reviewers have reviewed
            </h4>
            <p className="text-xs text-slate-500">
              {latestReviewer
                ? `${latestReviewer} submitted the latest review`
                : "Awaiting reviewer feedback"}
            </p>
          </div>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </section>
  );
};

export default React.memo(ReviewProgressCard);
