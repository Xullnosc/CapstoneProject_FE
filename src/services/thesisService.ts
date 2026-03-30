import api from "./api";
import type {
  Thesis,
  GetThesisFilters,
  ThesisReviewStatus,
  ReviewTimelineEvent,
  ReviewTimelineComment,
  Checklist,
  ThesisAIReviewPreview,
} from "../types/thesis";

export type ThesisDecision = "Pass" | "Fail";

// ─── Propose ────────────────────────────────────────────────────────────────
interface ProposeThesisRequest {
  title: string;
  shortDescription?: string;
  file: File;
  thesisNameEn: string;
  thesisNameVi: string;
  abbreviation: string;
  isFromEnterprise: boolean;
  enterpriseName?: string;
  isApplied: boolean;
  isAppUsed: boolean;
  authorId?: number;
}

// ─── Update (upload new version) ────────────────────────────────────────────
interface UpdateThesisFileRequest {
  file: File;
  note?: string;
}

export const thesisService = {
  /** Keep propose as-is (no breaking change) */
  proposeThesis: async (data: ProposeThesisRequest) => {
    const formData = new FormData();
    formData.append("Title", data.title);
    if (data.shortDescription) {
      formData.append("ShortDescription", data.shortDescription);
    }
    formData.append("File", data.file);
    formData.append("ThesisNameEn", data.thesisNameEn);
    formData.append("ThesisNameVi", data.thesisNameVi);
    formData.append("Abbreviation", data.abbreviation);
    formData.append("IsFromEnterprise", data.isFromEnterprise.toString());
    if (data.enterpriseName) {
      formData.append("EnterpriseName", data.enterpriseName);
    }
    formData.append("IsApplied", data.isApplied.toString());
    formData.append("IsAppUsed", data.isAppUsed.toString());
    if (data.authorId) {
      formData.append("AuthorId", data.authorId.toString());
    }
    const response = await api.post("/thesis/propose", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /** GET /thesis - list with optional filters */
  getAllTheses: async (filters?: GetThesisFilters): Promise<Thesis[]> => {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (filters?.searchTitle) params.searchTitle = filters.searchTitle;
    if (filters?.status) params.status = filters.status;
    if (filters?.lecturerId) params.lecturerId = filters.lecturerId;
    if (filters?.semesterId) params.semesterId = filters.semesterId;
    if (filters?.userId) params.userId = filters.userId;
    if (filters?.isLocked !== undefined) params.isLocked = filters.isLocked;
    if (filters?.lecturerOnly) params.lecturerOnly = filters.lecturerOnly;
    const response = await api.get<Thesis[]>("/thesis", { params });
    return response.data;
  },

  /** GET /thesis/my - thesis belonging to the current user */
  getMyTheses: async (filters?: GetThesisFilters): Promise<Thesis[]> => {
    const params: Record<string, string | number | undefined> = {};
    if (filters?.searchTitle) params.searchTitle = filters.searchTitle;
    if (filters?.status) params.status = filters.status;
    const response = await api.get<Thesis[]>("/thesis/my", { params });
    return response.data;
  },

  /** GET /thesis/:id - full detail with version histories */
  getThesisById: async (id: string): Promise<Thesis> => {
    const response = await api.get<Thesis>(`/thesis/${id}`);
    return response.data;
  },

  /** PUT /thesis/:id - upload a new version */
  updateThesisFile: async (id: string, data: UpdateThesisFileRequest) => {
    const formData = new FormData();
    formData.append("File", data.file);
    if (data.note) formData.append("Note", data.note);
    const response = await api.put(`/thesis/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  evaluateThesis: async (
    id: string,
    data: {
      status: "OK" | "Consider";
      comment?: string;
      checkedChecklistIds?: number[]
    },
  ): Promise<void> => {
    const formData = new FormData();
    // Map FE 'OK'/'Consider' to BE 'Pass'/'Fail'
    const decision = data.status === "OK" ? "Pass" : "Fail";
    formData.append("Decision", decision);

    if (data.comment) formData.append("Comment", data.comment);
    if (data.checkedChecklistIds && data.checkedChecklistIds.length > 0) {
      data.checkedChecklistIds.forEach((id) => {
        formData.append("CheckedChecklistIds", id.toString());
      });
    }

    await api.put(`/thesis/${id}/review`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /** PUT /thesis/:id/cancel - cancel a thesis proposal */
  cancelThesis: async (id: string) => {
    const response = await api.put(`/thesis/${id}/cancel`);
    return response.data;
  },

  /** PUT /thesis/:id/lock - Lecturer: toggle lock/unlock on their own thesis */
  toggleThesisLock: async (id: string): Promise<Thesis> => {
    const response = await api.put<{ data: Thesis }>(`/thesis/${id}/lock`);
    return response.data.data;
  },

  submitHodDecision: async (
    id: string,
    data: {
      decision: "OK" | "Consider";
      comment?: string;
      checkedChecklistIds?: number[]
    },
  ): Promise<void> => {
    // Map FE 'OK'/'Consider' to BE 'Pass'/'Fail'
    const payload = {
      ...data,
      decision: data.decision === "OK" ? "Pass" : "Fail"
    };
    await api.put(`/thesis/${id}/hod-decision`, payload);
  },

  getAiReviewPreview: async (id: string): Promise<ThesisAIReviewPreview> => {
    const response = await api.post<ThesisAIReviewPreview>(
      `/thesis/${id}/ai-review-preview`,
    );
    return response.data;
  },

  /** GET /thesis/:id/review-status - get review status */
  getThesisReviewStatus: async (id: string): Promise<ThesisReviewStatus> => {
    const response = await api.get<ThesisReviewStatus>(
      `/thesis/${id}/review-status`,
    );
    return response.data;
  },

  getReviewTimeline: async (id: string): Promise<ReviewTimelineEvent[]> => {
    const response = await api.get<ReviewTimelineEvent[]>(
      `/thesis/${id}/review-timeline`,
    );
    return response.data;
  },

  addReviewComment: async (
    id: string,
    data: {
      eventId?: number;
      parentCommentId?: number;
      body: string;
      commentType?: string;
      visibilityScope?: string;
    },
  ): Promise<ReviewTimelineComment> => {
    const response = await api.post<ReviewTimelineComment>(
      `/thesis/${id}/review-comments`,
      {
        eventId: data.eventId,
        parentCommentId: data.parentCommentId,
        body: data.body,
        commentType: data.commentType,
        visibilityScope: data.visibilityScope,
      },
    );
    return response.data;
  },

  /** GET /checklist - get all checklist items */
  getChecklists: async (): Promise<Checklist[]> => {
    const response = await api.get<Checklist[]>("/checklist");
    return response.data;
  },

  /** POST /thesis/:id/force-assign - HOD: force-assign thesis to a team */
  forceAssignThesis: async (id: string, teamId: number) => {
    const response = await api.post(`/thesis/${id}/force-assign`, { teamId });
    return response.data;
  },
};

