/**
 * Semester Module Constants
 * Centralized constants for Semester-related features
 */

export const SEMESTER_STATUS = {
    /** Mở — Tất cả hoạt động được phép (tạo nhóm, nộp đề tài, mời mentor...) */
    OPEN: 'Open',
    /** Đang giữa kỳ — Chỉ phục vụ review giữa kỳ, không tạo nhóm/đề tài mới */
    IN_PROGRESS: 'In Progress',
    /** Đóng — Chỉ xem, không thao tác gì */
    CLOSED: 'Closed',

    // ── Deprecated aliases (giá trị cũ, giữ để tránh lỗi FE chưa cập nhật) ──
    /** @deprecated Dùng OPEN thay thế */
    ACTIVE: 'Active',
    /** @deprecated Dùng OPEN thay thế */
    UPCOMING: 'Upcoming',
    /** @deprecated Dùng IN_PROGRESS thay thế */
    THESIS_REVIEW: 'Review Thesis',
    /** @deprecated Dùng IN_PROGRESS thay thế */
    FINAL_REVIEW: 'Review Middle Semester',
    /** @deprecated Dùng OPEN thay thế */
    ONGOING: 'Active',
    /** @deprecated Dùng CLOSED thay thế */
    ENDED: 'Closed',
} as const;

export type SemesterStatus = typeof SEMESTER_STATUS[keyof typeof SEMESTER_STATUS];

export const SEMESTER_SEASON = {
    SPRING: 'Spring',
    SUMMER: 'Summer',
    FALL: 'Fall',
} as const;

export type SemesterSeason = typeof SEMESTER_SEASON[keyof typeof SEMESTER_SEASON];

export const SEMESTER_CODE_PREFIX = {
    SPRING: 'SP',
    SUMMER: 'SU',
    FALL: 'FA',
} as const;

export const SEMESTER_SEASON_COLORS = {
    [SEMESTER_SEASON.SPRING]: 'green',
    [SEMESTER_SEASON.SUMMER]: 'yellow',
    [SEMESTER_SEASON.FALL]: 'orange',
} as const;

export const SEMESTER_SEASON_GRADIENTS = {
    [SEMESTER_SEASON.SPRING]: 'from-emerald-200 via-green-200 to-teal-100',
    [SEMESTER_SEASON.SUMMER]: 'from-amber-200 via-yellow-200 to-orange-200',
    [SEMESTER_SEASON.FALL]: 'from-amber-500 via-orange-500 to-rose-500',
} as const;

export const SEMESTER_SEASON_SOFT_GRADIENTS = {
    [SEMESTER_SEASON.SPRING]: 'from-emerald-100 via-green-100 to-teal-100',
    [SEMESTER_SEASON.SUMMER]: 'from-yellow-100 via-amber-100 to-orange-100',
    [SEMESTER_SEASON.FALL]: 'from-orange-100 via-amber-100 to-rose-100',
} as const;

export const SEMESTER_STATUS_COLORS = {
    // ── 3-stage model (new) ──────────────────────────────────
    [SEMESTER_STATUS.OPEN]: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
        border: 'border-emerald-100',
    },
    [SEMESTER_STATUS.IN_PROGRESS]: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        dot: 'bg-blue-500',
        border: 'border-blue-100',
    },
    [SEMESTER_STATUS.CLOSED]: {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        dot: 'bg-gray-400',
        border: 'border-gray-200',
    },
    // ── Backward compat (Sử dụng cho các giá trị cũ trong DB nếu chưa migration) ──
    ['Active']: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
        border: 'border-emerald-100',
    },
    ['Upcoming']: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        dot: 'bg-yellow-500',
        border: 'border-yellow-100',
    },
    ['Review Thesis']: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        dot: 'bg-blue-500',
        border: 'border-blue-100',
    },
    ['Review Middle Semester']: {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        dot: 'bg-purple-500',
        border: 'border-purple-100',
    },
} as const;

