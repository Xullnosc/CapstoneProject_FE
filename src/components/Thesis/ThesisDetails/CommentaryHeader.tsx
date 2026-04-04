import React from "react";
import type { Thesis } from "../../../types/thesis";
import ThesisStatusBadge from "../ThesisStatusBadge";
import MemberAvatar from "../../team/MemberAvatar";

interface CommentaryHeaderProps {
  thesis: Thesis;
  authorName: string;
  relativeTime: string;
}

const CommentaryHeader: React.FC<CommentaryHeaderProps> = ({
  thesis,
  authorName,
  relativeTime,
}) => {
  return (
    <header className="bg-white pt-7 pb-6 px-6 md:px-10 rounded-3xl border border-slate-200/60 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col gap-4 max-w-[1440px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              {thesis.title}
            </span>
            <span className="font-mono text-slate-300 text-sm md:text-lg tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100 uppercase">
              #{thesis.thesisId.slice(0, 8)}
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <ThesisStatusBadge status={thesis.status} />
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-xl border border-slate-100/50 hover:bg-white transition-colors group cursor-default">
              <MemberAvatar
                email={thesis.ownerEmail ?? ""}
                fullName={authorName}
                avatarUrl={thesis.ownerAvatar ?? undefined}
                className="w-5 h-5 rounded-full shrink-0 shadow-none border-0"
              />
              <span className="text-slate-600 tracking-tight">{authorName}</span>
            </div>

            <div className="w-1 h-1 rounded-full bg-slate-200 hidden md:block" />

            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100/50 hover:bg-white transition-colors group cursor-default">
              <i className="pi pi-clock text-[10px] text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-slate-500 font-medium lowercase italic">{relativeTime}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default React.memo(CommentaryHeader);
