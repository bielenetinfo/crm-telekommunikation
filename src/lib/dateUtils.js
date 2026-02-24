import { format as dateFnsFormat, isValid, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Safely format a date value, returning a fallback if invalid
 * @param {*} date - Date value (string, Date object, or null/undefined)
 * @param {string} formatStr - Format string for date-fns
 * @param {string} fallback - Fallback text if date is invalid
 * @returns {string} Formatted date or fallback
 */
export const safeFormatDate = (date, formatStr = 'dd.MM.yyyy', fallback = '-') => {
    if (!date) return fallback;

    try {
        let dateObj;

        // If it's already a Date object
        if (date instanceof Date) {
            dateObj = date;
        }
        // If it's a string, try to parse it
        else if (typeof date === 'string') {
            // Try ISO format first
            dateObj = parseISO(date);

            // If that didn't work, try direct Date constructor
            if (!isValid(dateObj)) {
                dateObj = new Date(date);
            }
        }
        // If it's something else, try to convert
        else {
            dateObj = new Date(date);
        }

        // Check if the date is valid
        if (!isValid(dateObj) || isNaN(dateObj.getTime())) {
            return fallback;
        }

        return dateFnsFormat(dateObj, formatStr, { locale: de });
    } catch (error) {
        console.warn('Date formatting error:', error, 'for date:', date);
        return fallback;
    }
};

/**
 * Safely parse a date to a Date object
 * @param {*} date - Date value to parse
 * @returns {Date|null} Valid Date object or null
 */
export const safeParseDate = (date) => {
    if (!date) return null;

    try {
        let dateObj;

        if (date instanceof Date) {
            dateObj = date;
        } else if (typeof date === 'string') {
            dateObj = parseISO(date);
            if (!isValid(dateObj)) {
                dateObj = new Date(date);
            }
        } else {
            dateObj = new Date(date);
        }

        return isValid(dateObj) && !isNaN(dateObj.getTime()) ? dateObj : null;
    } catch {
        return null;
    }
};

/**
 * Format a date for display with German locale
 * @param {*} date - Date to format
 * @param {boolean} includeTime - Whether to include time  
 * @returns {string} Formatted date string
 */
export const formatDateDE = (date, includeTime = false) => {
    const formatStr = includeTime ? 'dd.MM.yyyy HH:mm' : 'dd.MM.yyyy';
    return safeFormatDate(date, formatStr);
};

/**
 * Format a date relative to today (e.g., "in 5 days", "2 days ago")
 * @param {*} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeDate = (date) => {
    const parsedDate = safeParseDate(date);
    if (!parsedDate) return '-';

    const today = new Date();
    const diffTime = parsedDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Morgen';
    if (diffDays === -1) return 'Gestern';
    if (diffDays > 0) return `in ${diffDays} Tagen`;
    return `vor ${Math.abs(diffDays)} Tagen`;
};
