// User Profile Management
// Handles loading and saving user profile data

let currentUser = null;

// Initialize profile page
document.addEventListener('DOMContentLoaded', () => {
    // Only run on profile.html
    if (!window.location.pathname.includes('profile.html')) {
        return;
    }

    console.log('Initializing profile page...');

    // Check auth state
    firebaseApp.auth.onAuthStateChanged(async (user) => {
        const authRequired = document.getElementById('authRequired');
        const loadingState = document.getElementById('loadingState');
        const profileContainer = document.getElementById('profileContainer');

        if (!user) {
            // User not logged in
            if (loadingState) loadingState.classList.add('hidden');
            if (authRequired) authRequired.classList.remove('hidden');
            if (profileContainer) profileContainer.classList.add('hidden');
            return;
        }

        // User is logged in
        currentUser = user;
        if (authRequired) authRequired.classList.add('hidden');
        if (profileContainer) profileContainer.classList.remove('hidden');

        // Load user profile
        await loadUserProfile(user.uid);

        // Hide loading
        if (loadingState) loadingState.classList.add('hidden');
    });

    // Setup form listeners
    setupFormListeners();

    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (window.authHelpers) {
                window.authHelpers.logout();
            }
        });
    }
});

// Setup form listeners
function setupFormListeners() {
    const profileForm = document.getElementById('profileForm');
    const emailPrefsForm = document.getElementById('emailPrefsForm');

    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSave);
    }

    if (emailPrefsForm) {
        emailPrefsForm.addEventListener('submit', handleEmailPrefsSave);
    }
}

// Load user profile from Firestore
async function loadUserProfile(uid) {
    try {
        const userDoc = await firebaseApp.usersCollection.doc(uid).get();

        if (!userDoc.exists) {
            console.log('User profile not found, showing empty form');
            return;
        }

        const userData = userDoc.data();
        console.log('User profile loaded:', userData);

        // Populate basic info
        document.getElementById('email').value = userData.email || '';
        document.getElementById('firstName').value = userData.firstName || '';
        document.getElementById('lastName').value = userData.lastName || '';
        document.getElementById('school').value = userData.school || '';
        document.getElementById('program').value = userData.program || '';
        document.getElementById('year').value = userData.year || '';

        // Populate interests checkboxes
        if (userData.interests && userData.interests.length > 0) {
            userData.interests.forEach(interest => {
                const checkbox = document.querySelector(`input[name="interests"][value="${interest}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }

        // Populate career goals checkboxes
        if (userData.careerGoals && userData.careerGoals.length > 0) {
            userData.careerGoals.forEach(goal => {
                const checkbox = document.querySelector(`input[name="careerGoals"][value="${goal}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }

        // Populate email preferences
        const emailPrefs = userData.emailPreferences || {};
        document.getElementById('digestFrequency').value = emailPrefs.digestFrequency || 'weekly';
        document.getElementById('eventAlerts').checked = emailPrefs.eventAlerts !== false;
        document.getElementById('reminderBefore').value = emailPrefs.reminderBefore || 24;

        // Load saved events
        if (userData.savedEvents && userData.savedEvents.length > 0) {
            await loadSavedEvents(userData.savedEvents);
        }

    } catch (error) {
        console.error('Error loading user profile:', error);
        alert('Error loading profile. Please try again.');
    }
}

// Handle profile form save
async function handleProfileSave(e) {
    e.preventDefault();

    if (!currentUser) {
        alert('You must be logged in to save your profile');
        return;
    }

    const saveSuccess = document.getElementById('saveSuccess');
    if (saveSuccess) saveSuccess.classList.add('hidden');

    try {
        // Collect form data
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const school = document.getElementById('school').value;
        const program = document.getElementById('program').value;
        const year = document.getElementById('year').value;

        // Collect interests
        const interestsCheckboxes = document.querySelectorAll('input[name="interests"]:checked');
        const interests = Array.from(interestsCheckboxes).map(cb => cb.value);

        // Collect career goals
        const careerGoalsCheckboxes = document.querySelectorAll('input[name="careerGoals"]:checked');
        const careerGoals = Array.from(careerGoalsCheckboxes).map(cb => cb.value);

        // Validate
        if (!firstName || !lastName || !school || !program || !year) {
            alert('Please fill in all required fields');
            return;
        }

        // Update Firestore
        await firebaseApp.usersCollection.doc(currentUser.uid).update({
            firstName,
            lastName,
            school,
            program,
            year,
            interests,
            careerGoals,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('Profile updated successfully');

        // Show success message
        if (saveSuccess) {
            saveSuccess.classList.remove('hidden');
            setTimeout(() => {
                saveSuccess.classList.add('hidden');
            }, 3000);
        }

    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Error saving profile. Please try again.');
    }
}

// Handle email preferences save
async function handleEmailPrefsSave(e) {
    e.preventDefault();

    if (!currentUser) {
        alert('You must be logged in to save your preferences');
        return;
    }

    const emailPrefsSuccess = document.getElementById('emailPrefsSuccess');
    if (emailPrefsSuccess) emailPrefsSuccess.classList.add('hidden');

    try {
        const digestFrequency = document.getElementById('digestFrequency').value;
        const eventAlerts = document.getElementById('eventAlerts').checked;
        const reminderBefore = parseInt(document.getElementById('reminderBefore').value);

        await firebaseApp.usersCollection.doc(currentUser.uid).update({
            emailPreferences: {
                digestFrequency,
                eventAlerts,
                reminderBefore
            },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('Email preferences updated');

        // Show success message
        if (emailPrefsSuccess) {
            emailPrefsSuccess.classList.remove('hidden');
            setTimeout(() => {
                emailPrefsSuccess.classList.add('hidden');
            }, 3000);
        }

    } catch (error) {
        console.error('Error saving email preferences:', error);
        alert('Error saving preferences. Please try again.');
    }
}

// Load saved events
async function loadSavedEvents(eventIds) {
    const savedEventsList = document.getElementById('savedEventsList');
    if (!savedEventsList) return;

    if (!eventIds || eventIds.length === 0) {
        savedEventsList.innerHTML = '<p class="text-center" style="color: #4A4A4A;">You haven\'t saved any events yet.</p>';
        return;
    }

    try {
        savedEventsList.innerHTML = '<p>Loading saved events...</p>';

        const events = [];
        for (const eventId of eventIds.slice(0, 10)) { // Show max 10 saved events
            try {
                const eventDoc = await firebaseApp.eventsCollection.doc(eventId).get();
                if (eventDoc.exists) {
                    events.push({
                        id: eventDoc.id,
                        ...eventDoc.data()
                    });
                }
            } catch (error) {
                console.error(`Error loading event ${eventId}:`, error);
            }
        }

        if (events.length === 0) {
            savedEventsList.innerHTML = '<p class="text-center" style="color: #4A4A4A;">No saved events found.</p>';
            return;
        }

        // Display saved events
        savedEventsList.innerHTML = '';
        events.forEach(event => {
            const eventCard = createSavedEventCard(event);
            savedEventsList.appendChild(eventCard);
        });

    } catch (error) {
        console.error('Error loading saved events:', error);
        savedEventsList.innerHTML = '<p style="color: #DC3545;">Error loading saved events.</p>';
    }
}

// Create saved event card
function createSavedEventCard(event) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cursor = 'pointer';
    card.onclick = () => window.location.href = `event-details.html?id=${event.id}`;

    const dateStr = event.date && event.date.toDate
        ? event.date.toDate().toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        })
        : 'Date TBD';

    card.innerHTML = `
        <h4 style="color: #00274C; margin-bottom: 0.5rem;">${event.name}</h4>
        <p style="color: #4A4A4A; font-size: 0.9rem; margin-bottom: 0.5rem;">
            📅 ${dateStr} • 📍 ${event.location || 'Location TBD'}
        </p>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${event.category ? event.category.slice(0, 2).map(cat =>
                `<span class="tag tag-category">${cat}</span>`
            ).join('') : ''}
        </div>
    `;

    return card;
}

// Export functions for use in other scripts
window.profileHelpers = {
    loadUserProfile
};
