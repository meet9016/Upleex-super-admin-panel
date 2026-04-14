/**
 * Utility functions for date formatting and manipulation
 */

/**
 * Format date to DD/MM/YYYY format
 * @param date - Date string or Date object
 * @returns Formatted date string or 'N/A' if invalid
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return 'N/A';
    
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Format date to DD/MM/YYYY HH:MM format
 * @param date - Date string or Date object
 * @returns Formatted date and time string or 'N/A' if invalid
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return 'N/A';
    
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Format date for display in tables (consistent format)
 * @param date - Date string or Date object
 * @returns Formatted date string or 'N/A' if invalid
 */
export const formatTableDate = (date: string | Date | null | undefined): string => {
  return formatDate(date);
};

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 * @param date - Date string or Date object
 * @returns Relative time string or 'N/A' if invalid
 */
export const getRelativeTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return 'N/A';
    
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    // For older dates, return formatted date
    return formatDate(date);
  } catch (error) {
    return 'N/A';
  }
};