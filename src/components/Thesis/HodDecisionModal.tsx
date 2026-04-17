import React, { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { SelectButton } from "primereact/selectbutton";
import { Checkbox } from "primereact/checkbox";
import type { CheckboxChangeEvent } from "primereact/checkbox";
import { thesisService } from "../../services/thesisService";
import type { Checklist, DuplicationCheckResult } from "../../types/thesis";
import Swal from "../../utils/swal";

interface HodDecisionModalProps {
  visible: boolean;
  onHide: () => void;
  thesisId: string;
  thesisFileUrl?: string;
  onSuccess: () => void;
}

const HodDecisionModal: React.FC<HodDecisionModalProps> = ({
  visible,
  onHide,
  thesisId,
  thesisFileUrl,
  onSuccess,
}) => {
  const [decision, setDecision] = useState<"OK" | "Consider" | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  // Checklist state
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [loadingChecklists, setLoadingChecklists] = useState(false);
  const [aiReviewing, setAiReviewing] = useState(false);
  const [duplicationResult, setDuplicationResult] = useState<DuplicationCheckResult | null>(null);
  const aiRunRef = useRef(0);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleHide = () => {
    aiRunRef.current += 1;
    setAiReviewing(false);
    onHide();
  };

  useEffect(() => {
    if (visible) {
      fetchChecklists();
    }
  }, [visible]);

  const fetchChecklists = async (): Promise<Checklist[]> => {
    setLoadingChecklists(true);
    try {
      const data = await thesisService.getChecklists();
      setChecklists(data);
      return data;
    } catch (err) {
      console.error("Failed to fetch checklists:", err);
      return [];
    } finally {
      setLoadingChecklists(false);
    }
  };

  useEffect(() => {
    if (!visible) {
      aiRunRef.current += 1;
      setAiReviewing(false);
      setDuplicationResult(null);
    }
  }, [visible]);

  const onChecklistChange = (e: CheckboxChangeEvent) => {
    let _checkedIds = [...checkedIds];
    if (e.checked) {
      _checkedIds.push(e.value);
    } else {
      _checkedIds = _checkedIds.filter((id) => id !== e.value);
    }
    setCheckedIds(_checkedIds);
  };

  const decisionOptions = [
    { label: "OK", value: "OK", icon: "pi pi-verified" },
    { label: "Consider", value: "Consider", icon: "pi pi-times-circle" },
  ];

  const handleSubmit = async () => {
    if (!decision) {
      Swal.fire({
        icon: "warning",
        title: "Decision Required",
        text: "Please select OK or Consider.",
      });
      return;
    }

    if (decision === "Consider" && !comment.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Comment Required",
        text: "Please provide a reason for the Consider decision.",
      });
      return;
    }

    setLoading(true);
    try {
      await thesisService.submitHodDecision(thesisId, {
        decision: decision,
        comment: comment.trim() || undefined,
        checkedChecklistIds: checkedIds.length > 0 ? checkedIds : undefined,
      });
      Swal.fire({
        icon: "success",
        title: "Final Decision Recorded",
        text: `The thesis has been marked as ${decision === "OK" ? "Published" : "Need Update"}.`,
        timer: 3000,
        showConfirmButton: false,
      });
      onSuccess();
      handleHide();
      // Reset
      setDecision(null);
      setComment("");
      setCheckedIds([]);
    } catch (err: unknown) {
      console.error(err);
      let msg = "Finalize decision failed";
      if (typeof err === "object" && err !== null && "response" in err) {
        const e = err as { response?: { data?: { message?: string } } };
        msg = e.response?.data?.message ?? msg;
      }
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAiReview = async () => {
    if (aiReviewing || loading || loadingChecklists || !thesisId) {
      return;
    }

    const runId = ++aiRunRef.current;
    setAiReviewing(true);

    try {
      let criteria = checklists;
      if (!criteria.length) {
        criteria = await fetchChecklists();
      }

      if (!criteria.length) {
        Swal.fire({
          icon: "warning",
          title: "Checklist unavailable",
          text: "No checklist criteria found. Please add criteria before running AI review.",
        });
        return;
      }

      const [preview, duplication] = await Promise.all([
        thesisService.getAiReviewPreview(thesisId),
        thesisService.getDuplicationCheckResult(thesisId),
      ]);
      if (aiRunRef.current !== runId) {
        return;
      }

      setDuplicationResult(duplication);

      const checkedSet = new Set<number>(checkedIds);
      for (const item of preview.checklist) {
        if (item.checked) {
          checkedSet.add(item.checklistId);
        }

        if (aiRunRef.current !== runId) {
          return;
        }

        setCheckedIds(Array.from(checkedSet));
        await delay(250);
      }

      const aiFeedback = (preview.feedback || "").trim();
      if (aiFeedback.length > 0) {
        const currentComment = comment.trim();
        const prefix = currentComment.length > 0 ? `${currentComment}\n\n` : "";
        let typed = prefix;

        for (const ch of aiFeedback) {
          if (aiRunRef.current !== runId) {
            return;
          }

          typed += ch;
          setComment(typed);
          await delay(25);
        }
      }

      if (aiRunRef.current !== runId) {
        return;
      }

      if (preview.suggestedDecision === "OK" || preview.suggestedDecision === "Consider") {
        setDecision(preview.suggestedDecision);
      }

      const notices: string[] = [];
      if (preview.warnings?.length) {
        notices.push(...preview.warnings);
      }
      notices.push(
        duplication.isSuspicious
          ? `Duplication check: suspicious (${duplication.matches.length} match(es)).`
          : `Duplication check: clean (${duplication.candidatesScanned} candidate thesis(es) checked).`
      );

      if (notices.length) {
        Swal.fire({
          icon: "info",
          title: "AI review completed",
          text: notices.join("\n"),
        });
      }
    } catch (err: unknown) {
      console.error("AI review failed:", err);
      let msg = "Could not complete AI review. Any generated checks or text were kept.";
      if (typeof err === "object" && err !== null && "response" in err) {
        const e = err as { response?: { data?: { message?: string } } };
        msg = e.response?.data?.message ?? msg;
      }
      Swal.fire({
        icon: "error",
        title: "AI review failed",
        text: msg,
      });
    } finally {
      if (aiRunRef.current === runId) {
        setAiReviewing(false);
      }
    }
  };

  const footer = (
    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
      <Button
        label="Cancel"
        icon="pi pi-times"
        onClick={handleHide}
        className="p-button-text p-button-secondary font-bold px-4 p-button-sm"
        disabled={loading}
      />
      <Button
        label={loading ? "Processing..." : "Confirm Final Decision"}
        icon={loading ? "pi pi-spin pi-spinner" : "pi pi-shield"}
        onClick={handleSubmit}
        disabled={!decision || loading}
        className="font-bold px-6 shadow-md hover:shadow-lg transition-all active:scale-95 p-button-sm"
        style={{ backgroundColor: "#1e293b", borderColor: "#1e293b" }}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={handleHide}
      style={{ width: "95vw", maxWidth: "1400px" }}
      footer={footer}
      draggable={false}
      resizable={false}
      modal
      className="p-fluid shadow-2xl rounded-[2.5rem] overflow-hidden"
      icons={
        <Button
          icon={aiReviewing ? "pi pi-spin pi-spinner" : "pi pi-sparkles"}
          label={aiReviewing ? "Reviewing..." : "AI Review"}
          className="p-button-sm font-bold text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100"
          tooltip="AI-assisted review (includes duplication check)"
          tooltipOptions={{ position: "bottom" }}
          onClick={handleAiReview}
          disabled={loading || loadingChecklists || aiReviewing}
        />
      }
      header={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-900 shadow-sm">
            <i className="pi pi-shield text-xl" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-none mb-1">
              HOD Final Authority
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Decisive Action
            </p>
          </div>
        </div>
      }
      pt={{
        header: { className: "p-6 border-b border-gray-100 bg-white" },
        headerIcons: { className: "flex items-center gap-2" },
        closeButton: {
          style: {
            width: "2.5rem",
            minWidth: "2.5rem",
            height: "2.5rem",
            borderRadius: "50%",
            padding: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
        },
        closeButtonIcon: {
          style: { fontSize: "1.1rem" },
        },
        content: { className: "p-6 bg-white overflow-hidden" },
        mask: { className: "backdrop-blur-sm bg-slate-900/40" },
      }}
    >
      <div className="flex flex-col lg:flex-row gap-6 h-[60vh]">
        {/* Left Pane: Document Preview */}
        <div className="flex-1 flex flex-col h-full border border-slate-100 rounded-[2rem] bg-slate-50 overflow-hidden shadow-inner relative">
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-slate-800 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
              <i className="pi pi-file-pdf" /> Document Preview
            </div>
          </div>
          {thesisFileUrl ? (
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(thesisFileUrl)}&embedded=true`}
              className="w-full h-full border-none rounded-[2rem]"
              title="Thesis Document Preview"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 p-8 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                <i className="pi pi-file-excel text-4xl" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-600 mb-1">
                  No file available
                </h3>
                <p className="text-xs font-semibold leading-relaxed max-w-[250px]">
                  This thesis does not have a support file for preview.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: Checklist & Feedback */}
        <div className="w-full lg:w-[500px] flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
            <i className="pi pi-info-circle text-amber-600 text-sm mt-0.5" />
            <p className="text-[10px] text-amber-800 leading-relaxed font-bold">
              Your decision will <strong>override</strong> all current reviewer
              votes.
            </p>
          </div>

          {/* Checklist Section */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1 border-l-4 border-slate-900 pl-3">
              Checklist (Criteria Met)
            </label>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2">
              {loadingChecklists ? (
                <div className="flex items-center justify-center py-6 text-slate-400 text-xs italic">
                  <i className="pi pi-spin pi-spinner mr-2"></i> Loading
                  criteria...
                </div>
              ) : checklists.length === 0 ? (
                <div className="text-slate-400 text-xs italic py-4 px-4">
                  No checklist items defined.
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {checklists.map((item) => (
                    <div
                      key={item.checklistId}
                      className={`flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer border ${checkedIds.includes(item.checklistId) ? "bg-slate-900/5 border-slate-900/10 shadow-sm" : "bg-transparent border-transparent hover:bg-white hover:border-slate-200"}`}
                      onClick={() =>
                        onChecklistChange({
                          checked: !checkedIds.includes(item.checklistId),
                          value: item.checklistId,
                        } as unknown as CheckboxChangeEvent)
                      }
                    >
                      <Checkbox
                        inputId={`hod-item-${item.checklistId}`}
                        value={item.checklistId}
                        checked={checkedIds.includes(item.checklistId)}
                        onChange={(e) => {
                          e.stopPropagation();
                          onChecklistChange(e);
                        }}
                        className="mt-0.5"
                        pt={{
                          box: {
                            className: `w-5 h-5 rounded-lg border-2 transition-all duration-200 ${
                              checkedIds.includes(item.checklistId)
                                ? "bg-orange-500 border-orange-500 shadow-sm shadow-orange-200"
                                : "bg-white border-slate-200 hover:border-orange-300"
                            }`,
                          },
                          icon: { className: "text-xs text-white" },
                        }}
                      />
                      <label
                        className={`text-xs font-bold leading-relaxed cursor-pointer transition-colors ${checkedIds.includes(item.checklistId) ? "text-orange-900" : "text-slate-600"}`}
                      >
                        {item.content}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Duplication Check Section */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1 border-l-4 border-sky-500 pl-3">
              Duplication Check Result
            </label>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
              {!duplicationResult ? (
                <div className="text-slate-400 text-xs italic py-2 px-1">
                  This will be generated automatically when you run <span className="font-semibold not-italic">AI Review</span>.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 rounded-xl p-3 border bg-white border-slate-200">
                    <div className="text-xs text-slate-600 font-bold">
                      {duplicationResult.semestersScanned} semester(s) scanned, {duplicationResult.candidatesScanned} candidate thesis(es)
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        duplicationResult.isSuspicious
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {duplicationResult.isSuspicious ? "Suspicious" : "Clean"}
                    </span>
                  </div>

                  {duplicationResult.matches.length === 0 ? (
                    <div className="text-slate-400 text-xs italic py-2 px-1">
                      No matches above reporting threshold.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                      {duplicationResult.matches.slice(0, 5).map((match) => (
                        <div
                          key={match.candidateThesisId}
                          className="bg-white border border-slate-200 rounded-xl p-3"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="text-xs font-bold text-slate-700 line-clamp-2">
                              {match.candidateTitle || match.candidateThesisId}
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              match.similarityBand === "HIGH"
                                ? "bg-red-100 text-red-700"
                                : match.similarityBand === "MEDIUM"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}>
                              {match.similarityBand}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-semibold">
                            Max similarity: {(match.maxChunkSimilarity * 100).toFixed(1)}% | Avg top chunk similarity: {(match.averageTopChunkSimilarity * 100).toFixed(1)}%
                          </div>
                          <div className="text-[11px] text-slate-400 font-semibold mt-1">
                            Semester: {match.candidateSemesterCode || match.candidateSemesterId || "N/A"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Verdict Section */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
              Final Outcome
            </label>
            <SelectButton
              value={decision}
              options={decisionOptions}
              onChange={(e) => setDecision(e.value)}
              className="premium-select-button evaluation-select"
              itemTemplate={(option) => {
                const isSelected = decision === option.value;
                const isConsider = option.value === "Consider";

                let activeClass = "";
                if (isSelected) {
                  activeClass = isConsider
                    ? "bg-red-500 text-white scale-105 shadow-lg shadow-red-200"
                    : "bg-emerald-500 text-white scale-105 shadow-lg shadow-emerald-200";
                } else {
                  activeClass =
                    "bg-slate-50 text-slate-400 opacity-60 hover:opacity-100 hover:bg-slate-100";
                }

                return (
                  <div
                    className={`flex items-center justify-center gap-2 py-3 w-full transition-all duration-300 rounded-xl ${activeClass}`}
                  >
                    <i
                      className={`${option.icon} ${isSelected ? "text-base" : "text-xs"}`}
                    />
                    <span
                      className={`font-black uppercase tracking-widest ${isSelected ? "text-xs" : "text-[10px]"}`}
                    >
                      {option.label}
                    </span>
                  </div>
                );
              }}
            />
          </div>

          {/* Rationale Section */}
          <div className="flex flex-col gap-3 pb-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
              Rationale / Feedback{" "}
              {decision === "Consider" && (
                <span className="text-red-500 font-black">*</span>
              )}
            </label>
            <InputTextarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={6}
              placeholder={
                decision === "Consider"
                  ? "State the reasons for considering this proposal..."
                  : "Add final instructions (optional)..."
              }
              className="text-xs border border-slate-200 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 p-4 leading-relaxed outline-none transition-all shadow-sm"
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default HodDecisionModal;
