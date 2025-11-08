// Utility Functions
// Helper functions used across the application

// Format date to readable string
function formatDate(date) {
    if (!date) return 'Date TBD';

    const dateObj = date.toDate ? date.toDate() : new Date(date);

    return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format time to readable string
function formatTime(time) {
    if (!time) return 'Time TBD';
    return time;
}

// Generate .ics file content for calendar export
function generateICSFile(event) {
    const eventDate = event.date && event.date.toDate ? event.date.toDate() : new Date();

    // Format date for ICS (YYYYMMDDTHHMMSSZ)
    const formatICSDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const dtStart = formatICSDate(eventDate);
    const dtStamp = formatICSDate(new Date());

    // Calculate end time (assume 2 hours duration if not specified)
    const endDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000);
    const dtEnd = formatICSDate(endDate);

    // Escape special characters in ICS format
    const escapeICS = (str) => {
        if (!str) return '';
        return str.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//UMich Events//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${event.id || 'event'}@umich-events.com
DTSTAMP:${dtStamp}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${escapeICS(event.name)}
DESCRIPTION:${escapeICS(event.description || event.shortDescription || '')}
LOCATION:${escapeICS(event.location || '')}
URL:${event.registrationLink || event.sourceUrl || ''}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

    return icsContent;
}

// Download .ics file
function downloadICSFile(event) {
    const icsContent = generateICSFile(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFilename(event.name)}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Sanitize filename
function sanitizeFilename(filename) {
    return filename
        .replace(/[^a-z0-9]/gi, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);
}

// Copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Clipboard copy failed:', error);

        // Fallback method
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch (err) {
            console.error('Fallback copy failed:', err);
            document.body.removeChild(textArea);
            return false;
        }
    }
}

// Truncate text to specified length
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Get category emoji
function getCategoryEmoji(category) {
    const emojiMap = {
        'career': '💼',
        'academic': '📚',
        'networking': '🤝',
        'social': '🎉',
        'cultural': '🎭',
        'entrepreneurship': '🚀',
        'startup': '🚀',
        'sustainability': '🌱',
        'sports': '⚽',
        'health': '🏥',
        'tech': '💻',
        'technology': '💻',
        'arts': '🎨',
        'diversity': '🌈',
        'research': '🔬',
        'finance': '💰',
        'consulting': '💼',
        'leadership': '👔'
    };

    return emojiMap[category.toLowerCase()] || '📅';
}

// Save event to user's saved events
async function saveEventToProfile(eventId) {
    const user = firebaseApp.auth.currentUser;
    if (!user) {
        alert('Please login to save events');
        return false;
    }

    try {
        const userRef = firebaseApp.usersCollection.doc(user.uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            console.error('User profile not found');
            return false;
        }

        const userData = userDoc.data();
        const savedEvents = userData.savedEvents || [];

        // Check if already saved
        if (savedEvents.includes(eventId)) {
            alert('Event already saved!');
            return false;
        }

        // Add to saved events
        await userRef.update({
            savedEvents: firebase.firestore.FieldValue.arrayUnion(eventId)
        });

        alert('Event saved to your profile!');
        return true;

    } catch (error) {
        console.error('Error saving event:', error);
        alert('Error saving event. Please try again.');
        return false;
    }
}

// Remove event from user's saved events
async function unsaveEventFromProfile(eventId) {
    const user = firebaseApp.auth.currentUser;
    if (!user) {
        return false;
    }

    try {
        await firebaseApp.usersCollection.doc(user.uid).update({
            savedEvents: firebase.firestore.FieldValue.arrayRemove(eventId)
        });

        return true;

    } catch (error) {
        console.error('Error unsaving event:', error);
        return false;
    }
}

// Track event view
async function trackEventView(eventId) {
    const user = firebaseApp.auth.currentUser;
    if (!user) return;

    try {
        const userRef = firebaseApp.usersCollection.doc(user.uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) return;

        const userData = userDoc.data();
        let viewedEvents = userData.viewedEvents || [];

        // Add to beginning of array (most recent first)
        viewedEvents = [eventId, ...viewedEvents.filter(id => id !== eventId)];

        // Keep only last 50 viewed events
        if (viewedEvents.length > 50) {
            viewedEvents = viewedEvents.slice(0, 50);
        }

        await userRef.update({
            viewedEvents
        });

    } catch (error) {
        console.error('Error tracking event view:', error);
    }
}

// Calculate days until event
function daysUntilEvent(eventDate) {
    if (!eventDate) return null;

    const date = eventDate.toDate ? eventDate.toDate() : new Date(eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

// Get relative time string (e.g., "in 3 days", "tomorrow")
function getRelativeTimeString(eventDate) {
    const days = daysUntilEvent(eventDate);

    if (days === null) return 'Date TBD';
    if (days < 0) return 'Past event';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days <= 7) return `In ${days} days`;
    if (days <= 30) return `In ${Math.floor(days / 7)} weeks`;
    return `In ${Math.floor(days / 30)} months`;
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show loading spinner
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    }
}

// Hide loading spinner
function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const loading = element.querySelector('.loading');
        if (loading) {
            loading.remove();
        }
    }
}

// Show error message
function showError(message, elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="alert alert-error">
                <p>${message}</p>
            </div>
        `;
    }
}

// Export utility functions
window.utils = {
    formatDate,
    formatTime,
    generateICSFile,
    downloadICSFile,
    copyToClipboard,
    truncateText,
    getCategoryEmoji,
    saveEventToProfile,
    unsaveEventFromProfile,
    trackEventView,
    daysUntilEvent,
    getRelativeTimeString,
    debounce,
    showLoading,
    hideLoading,
    showError,
    sanitizeFilename
};
