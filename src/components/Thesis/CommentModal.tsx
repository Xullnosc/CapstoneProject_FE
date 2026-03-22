import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import Swal from "../../utils/swal";

interface CommentModalProps {
  visible: boolean;
  onHide: () => void;
  thesisId: string;
  onSubmit: (comment: string) => Promise<void>;
}

const CommentModal: React.FC<CommentModalProps> = ({
  visible,
  onHide,
  thesisId,
  onSubmit,
}) => {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = comment.trim();
    if (!trimmed) {
      Swal.fire("Warning", "Please enter a comment.", "warning");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(trimmed);
      Swal.fire("Success", "Comment added successfully.", "success");
      setComment("");
      onHide();
    } catch (err: unknown) {
      console.error(err);
      let msg = "Failed to add comment";
      if (typeof err === "object" && err !== null && "response" in err) {
        const e = err as { response?: { data?: { message?: string } } };
        msg = e.response?.data?.message ?? msg;
      }
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
      <Button
        label="Cancel"
        icon="pi pi-times"
        onClick={onHide}
        className="p-button-text p-button-secondary p-button-sm font-bold px-4"
      />
      <Button
        label={loading ? "Adding..." : "Add Comment"}
        icon={loading ? "pi pi-spin pi-spinner" : "pi pi-send"}
        onClick={handleSubmit}
        disabled={loading}
        className="p-button-sm font-bold px-6 shadow-sm hover:shadow-md transition-all active:scale-95"
        style={{ backgroundColor: "#475569", borderColor: "#475569" }}
      />
    </div>
  );

  return (
    <Dialog
      header={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 shadow-sm">
            <i className="pi pi-comments text-xl" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-none mb-1">
              Add Comment
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Share your thoughts
            </p>
          </div>
        </div>
      }
      visible={visible}
      onHide={onHide}
      modal
      style={{ width: "90vw", maxWidth: "600px" }}
      footer={footer}
    >
      <div className="space-y-4">
        <InputTextarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={6}
          placeholder="Write your comment here..."
          className="w-full"
          style={{ fontSize: "14px" }}
        />
        <p className="text-xs text-slate-500">
          Your comment will be visible to reviewers, lecturers, and HOD.
        </p>
      </div>
    </Dialog>
  );
};

export default React.memo(CommentModal);
