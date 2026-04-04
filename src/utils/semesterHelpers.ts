import { SEMESTER_SEASON, SEMESTER_SEASON_COLORS, SEMESTER_SEASON_GRADIENTS, SEMESTER_STATUS, type SemesterSeason, type SemesterStatus } from '../constants/semesterConstants';

/**
 * Determines the semester season from the semester name
 */
export const getSemesterSeason = (semesterName: string): SemesterSeason => {
    const nameLower = semesterName.toLowerCase();

    if (nameLower.includes('spring')) return SEMESTER_SEASON.SPRING;
    if (nameLower.includes('summer')) return SEMESTER_SEASON.SUMMER;
    if (nameLower.includes('fall') || nameLower.includes('autumn')) return SEMESTER_SEASON.FALL;

    return SEMESTER_SEASON.SPRING; // Default fallback
};

/**
 * Gets the color associated with a semester season
 */
export const getSeasonColor = (season: SemesterSeason): string => {
    return SEMESTER_SEASON_COLORS[season] || 'gray';
};

/**
 * Gets the gradient class for a semester season
 */
export const getSeasonGradient = (season: SemesterSeason): string => {
    return SEMESTER_SEASON_GRADIENTS[season] || 'from-gray-100 to-gray-200';
};

/**
 * Determines if a date is in the future
 */
export const isUpcomingDate = (dateStr: string): boolean => {
    return new Date(dateStr) > new Date();
};

/**
 * Calculates semester status based on isActive flag and start date
 */
export const calculateSemesterStatus = (status: 'Upcoming' | 'Active' | 'Review Thesis' | 'Review Middle Semester' | 'Closed'): SemesterStatus => {
    if (status === 'Active') return SEMESTER_STATUS.ONGOING;
    if (status === 'Review Thesis') return SEMESTER_STATUS.THESIS_REVIEW;
    if (status === 'Review Middle Semester') return SEMESTER_STATUS.FINAL_REVIEW;
    if (status === 'Closed') return SEMESTER_STATUS.ENDED;
    return SEMESTER_STATUS.UPCOMING;
};

/**
 * Formats a date string to localized date format
 */
export const formatSemesterDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString();
};
