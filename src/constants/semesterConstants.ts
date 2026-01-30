/**
 * Semester Module Constants
 * Centralized constants for Semester-related features
 */

export const SEMESTER_STATUS = {
    ONGOING: 'Ongoing',
    UPCOMING: 'Upcoming',
    ENDED: 'Ended',
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
    [SEMESTER_SEASON.SPRING]: 'from-emerald-100 via-green-100 to-teal-50',
    [SEMESTER_SEASON.SUMMER]: 'from-yellow-100 via-orange-100 to-amber-50',
    [SEMESTER_SEASON.FALL]: 'from-amber-400 via-orange-400 to-rose-400',
} as const;

export const SEMESTER_STATUS_COLORS = {
    [SEMESTER_STATUS.ONGOING]: {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        dot: 'bg-orange-600',
    },
    [SEMESTER_STATUS.UPCOMING]: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        dot: 'bg-green-600',
    },
    [SEMESTER_STATUS.ENDED]: {
        bg: 'bg-gray-50',
        text: 'text-gray-500',
        dot: 'bg-gray-400',
    },
} as const;
