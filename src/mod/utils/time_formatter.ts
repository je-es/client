// src/mod/utils/time_formatter.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    import { t } from "../services/i18n";

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    /**
     * Formats a timestamp into a relative time string with translation
     * Returns the formatted time and original ISO string as title attribute
     *
     * @param timestamp - ISO 8601 timestamp string or Date object
     * @returns Object with formatted time and original timestamp for title
     */
    export function formatRelativeTime(timestamp: string | Date) {
        const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        let formatted = '';

        if (diffSecs < 0) {
            // Future date
            formatted = t('time.just_now');
        } else if (diffSecs < 60) {
            // Less than a minute
            formatted = t('time.just_now');
        } else if (diffMins < 2) {
            // 1 minute
            formatted = t('time.minute_ago');
        } else if (diffMins < 60) {
            // Multiple minutes
            formatted = t('time.minutes_ago', { count: diffMins.toString() });
        } else if (diffHours < 2) {
            // 1 hour
            formatted = t('time.hour_ago');
        } else if (diffHours < 24) {
            // Multiple hours
            formatted = t('time.hours_ago', { count: diffHours.toString() });
        } else if (diffDays < 2) {
            // 1 day
            formatted = t('time.day_ago');
        } else if (diffDays < 7) {
            // Multiple days
            formatted = t('time.days_ago', { count: diffDays.toString() });
        } else if (diffWeeks < 2) {
            // 1 week
            formatted = t('time.week_ago');
        } else if (diffWeeks < 4) {
            // Multiple weeks
            formatted = t('time.weeks_ago', { count: diffWeeks.toString() });
        } else if (diffMonths < 2) {
            // 1 month
            formatted = t('time.month_ago');
        } else if (diffMonths < 12) {
            // Multiple months
            formatted = t('time.months_ago', { count: diffMonths.toString() });
        } else if (diffYears < 2) {
            // 1 year
            formatted = t('time.year_ago');
        } else {
            // Multiple years
            formatted = t('time.years_ago', { count: diffYears.toString() });
        }

        return {
            formatted,
            originalDate: date.toISOString(),
            title: date.toLocaleString()
        };
    }

    /**
     * Creates an HTML time element with relative time and title attribute
     * Usage: place this directly in your component render
     *
     * @param timestamp - ISO 8601 timestamp string or Date object
     * @returns Object with text content and title for use in createElement
     */
    export function getTimeDisplay(timestamp: string | Date) {
        const { formatted, title } = formatRelativeTime(timestamp);
        return {
            text: formatted,
            title
        };
    }

    /**
     * Format time for display with full date fallback
     * @param timestamp - ISO 8601 timestamp string or Date object
     * @returns Formatted string like "2 hours ago"
     */
    export function formatTimeAgo(timestamp: string | Date): string {
        return formatRelativeTime(timestamp).formatted;
    }

    /**
     * Get the ISO string for title attribute
     * @param timestamp - ISO 8601 timestamp string or Date object
     * @returns Localized full date string
     */
    export function getTimeTitle(timestamp: string | Date): string {
        return formatRelativeTime(timestamp).title;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
