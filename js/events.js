// Events Display and Management
// Handles loading, filtering, searching, and displaying events

// Global state
let allEvents = [];
let filteredEvents = [];
let displayedEvents = [];
let currentFilters = {
    date: 'all',
    category: 'all',
    school: 'all',
    search: ''
};
let eventsPerPage = 20;
let currentPage = 1;
let userPreferences = null;

// Initialize events page
document.addEventListener('DOMContentLoaded', async () => {
    // Only run on events.html
    if (!window.location.pathname.includes('events.html')) {
        return;
    }

    console.log('🔵 Initializing events page...');

    // Wait for Firebase to be ready
    while (!window.firebaseApp) {
        console.log('⏳ Waiting for Firebase...');
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ Firebase ready, setting up events page');

    // Setup event listeners
    setupEventListeners();

    // Load user preferences if logged in
    const user = firebaseApp.auth.currentUser;
    if (user) {
        await loadUserPreferences(user.uid);
    }

    // Load events
    await loadEvents();
});

// Setup event listeners
function setupEventListeners() {
    // Search
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');

    if (searchButton) {
        searchButton.addEventListener('click', handleSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }

    // Filter chips
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', handleFilterClick);
    });

    // Clear filters
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }

    // Load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreEvents);
    }
}

// Load user preferences for personalization
async function loadUserPreferences(uid) {
    try {
        const userDoc = await firebaseApp.usersCollection.doc(uid).get();
        if (userDoc.exists) {
            userPreferences = userDoc.data();
            console.log('User preferences loaded:', userPreferences);
        }
    } catch (error) {
        console.error('Error loading user preferences:', error);
    }
}

// Load events from Firestore
async function loadEvents() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const eventsList = document.getElementById('eventsList');

    try {
        // Show loading
        if (loadingState) loadingState.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');
        if (eventsList) eventsList.innerHTML = '';

        // Query Firestore
        const snapshot = await firebaseApp.eventsCollection
            .where('isActive', '==', true)
            .orderBy('date', 'asc')
            .limit(100) // Load first 100 events
            .get();

        console.log(`Loaded ${snapshot.size} events from Firestore`);

        allEvents = [];
        snapshot.forEach(doc => {
            allEvents.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Apply personalization if user is logged in
        if (userPreferences) {
            allEvents = personalizeEvents(allEvents);
        }

        // Apply filters
        applyFilters();

        // Display events
        displayEvents();

        // Hide loading
        if (loadingState) loadingState.classList.add('hidden');

    } catch (error) {
        console.error('Error loading events:', error);

        // Hide loading and show error
        if (loadingState) loadingState.classList.add('hidden');
        if (emptyState) {
            emptyState.classList.remove('hidden');
            emptyState.innerHTML = `
                <div class="empty-state-icon">⚠️</div>
                <h3>Error Loading Events</h3>
                <p>${error.message}</p>
                <p>Please make sure Firebase is configured correctly.</p>
            `;
        }
    }
}

// Personalize events based on user preferences
function personalizeEvents(events) {
    if (!userPreferences) return events;

    return events.map(event => {
        let score = 0;

        // Match school
        if (event.school === userPreferences.school) {
            score += 10;
        }

        // Match interests
        if (userPreferences.interests && event.category) {
            const matchingInterests = userPreferences.interests.filter(interest =>
                event.category.some(cat => cat.toLowerCase().includes(interest.toLowerCase()))
            );
            score += matchingInterests.length * 5;
        }

        // Match career goals
        if (userPreferences.careerGoals && event.category) {
            const matchingGoals = userPreferences.careerGoals.filter(goal =>
                event.category.some(cat => cat.toLowerCase().includes(goal.toLowerCase()))
            );
            score += matchingGoals.length * 5;
        }

        // Boost recent events
        if (event.createdAt && event.createdAt.toDate) {
            const daysSinceCreation = (Date.now() - event.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceCreation < 7) {
                score += 3;
            }
        }

        return { ...event, personalityScore: score };
    }).sort((a, b) => {
        // Sort by personality score first, then by date
        if (b.personalityScore !== a.personalityScore) {
            return b.personalityScore - a.personalityScore;
        }
        // If scores are equal, sort by date
        const dateA = a.date && a.date.toDate ? a.date.toDate() : new Date(0);
        const dateB = b.date && b.date.toDate ? b.date.toDate() : new Date(0);
        return dateA - dateB;
    });
}

// Handle filter chip click
function handleFilterClick(e) {
    const chip = e.target;
    const filterType = chip.dataset.filter;
    const filterValue = chip.dataset.value;

    // Remove active class from siblings
    const siblings = chip.parentElement.querySelectorAll('.filter-chip');
    siblings.forEach(sibling => sibling.classList.remove('active'));

    // Add active class to clicked chip
    chip.classList.add('active');

    // Update filter state
    currentFilters[filterType] = filterValue;

    // Apply filters and redisplay
    applyFilters();
    displayEvents();
}

// Handle search
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        currentFilters.search = searchInput.value.trim().toLowerCase();
        applyFilters();
        displayEvents();
    }
}

// Clear all filters
function clearAllFilters() {
    // Reset filter state
    currentFilters = {
        date: 'all',
        category: 'all',
        school: 'all',
        search: ''
    };

    // Reset UI
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
        if (chip.dataset.value === 'all') {
            chip.classList.add('active');
        }
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }

    // Reapply filters and display
    applyFilters();
    displayEvents();
}

// Apply filters to events
function applyFilters() {
    filteredEvents = allEvents.filter(event => {
        // Date filter
        if (currentFilters.date !== 'all') {
            const eventDate = event.date && event.date.toDate ? event.date.toDate() : null;
            if (!eventDate) return false;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            switch (currentFilters.date) {
                case 'today':
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    if (eventDate < today || eventDate >= tomorrow) return false;
                    break;
                case 'week':
                    const nextWeek = new Date(today);
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    if (eventDate < today || eventDate >= nextWeek) return false;
                    break;
                case 'month':
                    const nextMonth = new Date(today);
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    if (eventDate < today || eventDate >= nextMonth) return false;
                    break;
            }
        }

        // Category filter
        if (currentFilters.category !== 'all') {
            if (!event.category || !event.category.some(cat =>
                cat.toLowerCase().includes(currentFilters.category.toLowerCase())
            )) {
                return false;
            }
        }

        // School filter
        if (currentFilters.school !== 'all') {
            if (!event.school || !event.school.toLowerCase().includes(currentFilters.school.toLowerCase())) {
                return false;
            }
        }

        // Search filter
        if (currentFilters.search) {
            const searchLower = currentFilters.search;
            const matchesName = event.name && event.name.toLowerCase().includes(searchLower);
            const matchesDescription = event.description && event.description.toLowerCase().includes(searchLower);
            const matchesShortDesc = event.shortDescription && event.shortDescription.toLowerCase().includes(searchLower);
            const matchesLocation = event.location && event.location.toLowerCase().includes(searchLower);
            const matchesSchool = event.school && event.school.toLowerCase().includes(searchLower);

            if (!matchesName && !matchesDescription && !matchesShortDesc && !matchesLocation && !matchesSchool) {
                return false;
            }
        }

        return true;
    });

    console.log(`Filtered ${filteredEvents.length} events out of ${allEvents.length}`);
    currentPage = 1; // Reset pagination
}

// Display events
function displayEvents() {
    const eventsList = document.getElementById('eventsList');
    const emptyState = document.getElementById('emptyState');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    if (!eventsList) return;

    // Check if there are filtered events
    if (filteredEvents.length === 0) {
        eventsList.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
        return;
    }

    // Hide empty state
    if (emptyState) emptyState.classList.add('hidden');

    // Calculate which events to display
    const startIndex = 0;
    const endIndex = currentPage * eventsPerPage;
    displayedEvents = filteredEvents.slice(startIndex, endIndex);

    // Clear and render events
    eventsList.innerHTML = '';
    displayedEvents.forEach(event => {
        const eventCard = createEventCard(event);
        eventsList.appendChild(eventCard);
    });

    // Show/hide load more button
    if (loadMoreBtn) {
        if (endIndex < filteredEvents.length) {
            loadMoreBtn.classList.remove('hidden');
        } else {
            loadMoreBtn.classList.add('hidden');
        }
    }
}

// Load more events (pagination)
function loadMoreEvents() {
    currentPage++;
    displayEvents();
}

// Create event card element
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.onclick = () => window.location.href = `event-details.html?id=${event.id}`;

    // Event image or placeholder
    let imageHTML = '';
    if (event.imageUrl) {
        imageHTML = `<img src="${event.imageUrl}" alt="${event.name}" class="event-image">`;
    } else {
        imageHTML = `<div class="event-image-placeholder">📅</div>`;
    }

    // Event date
    const dateStr = event.date && event.date.toDate
        ? event.date.toDate().toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        })
        : 'Date TBD';

    // Event time
    const timeStr = event.time || 'Time TBD';

    // Event location
    const locationStr = event.location || 'Location TBD';

    // Event categories
    const categories = event.category ? event.category.slice(0, 3) : [];
    const categoriesHTML = categories.map(cat =>
        `<span class="tag tag-category">${cat}</span>`
    ).join('');

    // School tag
    const schoolHTML = `<span class="tag tag-school">${event.school || 'UMich'}</span>`;

    // Short description
    const description = event.shortDescription || event.description || 'No description available.';
    const truncatedDescription = description.length > 150
        ? description.substring(0, 150) + '...'
        : description;

    card.innerHTML = `
        ${imageHTML}
        <div class="event-content">
            <div class="event-header">
                <h3 class="event-title">${event.name}</h3>
            </div>
            <div class="event-meta">
                <div class="event-meta-item">
                    <span>📅 ${dateStr}</span>
                </div>
                <div class="event-meta-item">
                    <span>🕒 ${timeStr}</span>
                </div>
                <div class="event-meta-item">
                    <span>📍 ${locationStr}</span>
                </div>
            </div>
            <p class="event-description">${truncatedDescription}</p>
            <div class="event-tags">
                ${categoriesHTML}
                ${schoolHTML}
            </div>
        </div>
    `;

    return card;
}

// Export functions for use in other scripts
window.eventsHelpers = {
    loadEvents,
    applyFilters,
    displayEvents
};
