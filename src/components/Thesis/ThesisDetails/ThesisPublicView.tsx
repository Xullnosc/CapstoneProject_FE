import React from "react";
import type { Thesis } from "../../../types/thesis";
import { Button as PrimeButton } from "primereact/button";
import CommentaryHeader from "./CommentaryHeader";
import ResearchDocumentCard from "./ResearchDocumentCard";
import MemberAvatar from "../../team/MemberAvatar";
import type { ApplicationStatus } from "../../../types/application";
import type { Team } from "../../../types/team";

interface ThesisPublicViewProps {
  thesis: Thesis;
  authorName: string;
  relativeTime: string;
  isLeader: boolean;
  team?: Team | null;
  applyingForThesis: boolean;
  existingAppStatus: ApplicationStatus | null;
  onApply: () => void;
  onCancelApply: () => void;
}

const ThesisPublicView: React.FC<ThesisPublicViewProps> = ({
  thesis,
  authorName,
  relativeTime,
  isLeader,
  team,
  applyingForThesis,
  existingAppStatus,
  onApply,
  onCancelApply,
}) => {
  const isInsufficient = React.useMemo(() => {
    if (!team) return false;
    const count = team.members?.length ?? 0;
    return count < 5 && !team.isSpecial;
  }, [team]);

  return (
    <div className="p-6 lg:p-10 font-sans bg-[#fafbfc] min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <CommentaryHeader thesis={thesis} authorName={authorName} relativeTime={relativeTime} />

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Description Section */}
            <section className="bg-white rounded-2xl p-8 border border-slate-200/70 shadow-sm space-y-6">
              <div>
                <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">
                  Thesis Description
                </h2>
                <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                  {thesis.shortDescription || "No description provided."}
                </p>
              </div>

              {/* Classification Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">
                        English Name
                    </span>
                    <span className="text-sm font-medium text-slate-700 italic">
                        "{thesis.thesisNameEn || thesis.title}"
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">
                        Vietnamese Name
                    </span>
                    <span className="text-sm font-medium text-slate-700 italic">
                        "{thesis.thesisNameVi || "N/A"}"
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">
                            Abbreviation
                        </span>
                        <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md inline-block w-fit">
                            {thesis.abbreviation || "N/A"}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                        {thesis.isFromEnterprise && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 shadow-sm" title={thesis.enterpriseName || "Enterprise Partner"}>
                                <i className="pi pi-briefcase text-[10px]" />
                                ENTERPRISE
                            </span>
                        )}
                        {thesis.isApplied && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-100 shadow-sm">
                                <i className="pi pi-bolt text-[10px]" />
                                APPLIED
                            </span>
                        )}
                        {thesis.isAppUsed && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 text-[10px] font-bold border border-purple-100 shadow-sm">
                                <i className="pi pi-mobile text-[10px]" />
                                HAS APP
                            </span>
                        )}
                    </div>
                </div>
              </div>
            </section>

            {/* Document Preview */}
            <div className="space-y-4">
                <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Research Document
                </h2>
                <ResearchDocumentCard fileUrl={thesis.fileUrl} />
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-6">
            {/* Proposer Info */}
            <section className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-sm">
              <h3 className="text-[10px] font-black uppercase text-slate-400 mb-5">
                Proposer
              </h3>
              <div className="flex items-center gap-3">
                <MemberAvatar
                  email={thesis.ownerEmail ?? ""}
                  fullName={thesis.ownerName ?? "Author"}
                  avatarUrl={thesis.ownerAvatar ?? undefined}
                  className="w-10 h-10 rounded-full shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">
                    {thesis.ownerName || "Unknown Author"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {thesis.ownerEmail || ""}
                  </span>
                </div>
              </div>
            </section>

            {/* Registration Card (Only if Published) */}
            {thesis.status === "Published" && isLeader && (
              <section className="bg-white rounded-2xl p-6 border-2 border-orange-100/50 shadow-sm">
                <h3 className="text-[10px] font-black uppercase text-orange-400 mb-5">
                  Registration
                </h3>
                <div className="space-y-4">
                    <p className="text-xs text-slate-500 leading-relaxed italic">
                        {existingAppStatus === 'Pending' 
                            ? "Your application is currently under review by the mentor."
                            : "Interested in this thesis? You can apply to join this team."}
                    </p>
                    {existingAppStatus ? (
                    <PrimeButton
                        label={
                        existingAppStatus === "Pending"
                            ? applyingForThesis
                            ? "Cancelling..."
                            : "Cancel Request"
                            : `Status: ${existingAppStatus}`
                        }
                        icon={
                        existingAppStatus === "Approved" ? "pi pi-check" : "pi pi-times"
                        }
                        onClick={
                        existingAppStatus === "Pending" ? onCancelApply : undefined
                        }
                        loading={applyingForThesis}
                        disabled={existingAppStatus !== "Pending"}
                        className="p-button-sm w-full font-bold uppercase py-4 rounded-xl border-0 !border-none !shadow-none !outline-none"
                        style={{
                        backgroundColor:
                            existingAppStatus === "Approved" ? "#10b981" : "#ef4444",
                        boxShadow: 'none',
                        border: 'none',
                        outline: 'none'
                        }}
                    />
                    ) : (
                    <div className="space-y-4">
                        {isInsufficient && (
                            <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl">
                                <p className="text-[10px] text-orange-600 font-medium leading-relaxed">
                                    <i className="pi pi-exclamation-triangle mr-1" />
                                    Your team must have 5 members or be a Special Team to apply.
                                </p>
                            </div>
                        )}
                        <PrimeButton
                            label={applyingForThesis ? "Submitting..." : "Apply for Thesis"}
                            icon="pi pi-send"
                            onClick={onApply}
                            loading={applyingForThesis}
                            disabled={isInsufficient || applyingForThesis}
                            className="p-button-sm p-button-orange w-full font-bold uppercase py-4 rounded-xl border-0 !border-none !shadow-none !outline-none"
                            style={{ backgroundColor: "#f26f21", boxShadow: 'none', border: 'none', outline: 'none' }}
                        />
                    </div>
                    )}
                </div>
              </section>
            )}
            
            {/* Disclaimer */}
            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                    <i className="pi pi-info-circle mr-1 text-[9px]" />
                    This is a public research proposal view. Internal review details and iteration history are hidden from other students to maintain academic integrity.
                </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default React.memo(ThesisPublicView);
