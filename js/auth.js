// Authentication Logic
// Handles Google sign-in, logout, and session management

// Global auth state variable
let isLoggedIn = false;

// Check auth state on page load
firebaseApp.auth.onAuthStateChanged(async (user) => {
    const authLink = document.getElementById('authLink');
    const profileLink = document.getElementById('profileLink');

    if (user) {
        // User is logged in
        console.log('User logged in:', user.email);
        isLoggedIn = true;

        // Validate @umich.edu email
        if (!user.email.toLowerCase().endsWith('@umich.edu')) {
            alert('Only @umich.edu email addresses are allowed. Please sign in with your UMich Google account.');
            await logout();
            return;
        }

        // Close auth modal if it's open (wait for DOM to be ready)
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', closeAuthModal);
        } else {
            closeAuthModal();
        }

        // Update nav links
        if (authLink) {
            authLink.textContent = 'Logout';
        }

        // Show profile link
        if (profileLink) {
            profileLink.style.display = 'inline-block';
        }

        // Show welcome message on events page
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            try {
                const userDoc = await firebaseApp.usersCollection.doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const userNameElement = document.getElementById('userName');
                    if (userNameElement) {
                        userNameElement.textContent = userData.firstName || user.displayName || user.email.split('@')[0];
                    }
                } else {
                    const userNameElement = document.getElementById('userName');
                    if (userNameElement) {
                        userNameElement.textContent = user.displayName || user.email.split('@')[0];
                    }
                }
                welcomeMessage.classList.remove('hidden');
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        }

        // Create or update user profile in Firestore
        try {
            const userDoc = await firebaseApp.usersCollection.doc(user.uid).get();

            if (!userDoc.exists) {
                // First time login - create profile
                await firebaseApp.usersCollection.doc(user.uid).set({
                    uid: user.uid,
                    email: user.email,
                    firstName: user.displayName ? user.displayName.split(' ')[0] : '',
                    lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
                    photoURL: user.photoURL || '',
                    school: '',
                    year: '',
                    program: '',
                    interests: [],
                    careerGoals: [],
                    savedEvents: [],
                    viewedEvents: [],
                    emailPreferences: {
                        digestFrequency: 'weekly',
                        eventAlerts: true,
                        reminderBefore: 24
                    },
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                    isActive: true
                });

                console.log('New user profile created');

                // Redirect to profile setup on first login
                if (window.location.pathname.includes('events.html') ||
                    window.location.pathname.includes('index.html') ||
                    window.location.pathname === '/') {
                    setTimeout(() => {
                        if (confirm('Welcome! Would you like to set up your profile now to get personalized event recommendations?')) {
                            window.location.href = 'profile.html';
                        }
                    }, 1000);
                }
            } else {
                // Update last login
                await firebaseApp.usersCollection.doc(user.uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error managing user profile:', error);
        }

    } else {
        // User is logged out
        console.log('User logged out');
        isLoggedIn = false;

        // Update nav links
        if (authLink) {
            authLink.textContent = 'Login';
        }

        // Hide profile link
        if (profileLink) {
            profileLink.style.display = 'none';
        }

        // Hide welcome message
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            welcomeMessage.classList.add('hidden');
        }
    }
});

// Show authentication modal
function showAuthModal() {
    // Don't show modal if user is already logged in
    if (firebaseApp.auth.currentUser) {
        console.log('User already logged in, not showing modal');
        return;
    }

    console.log('Opening auth modal...');
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.remove('hidden');
    } else {
        console.error('Auth modal not found!');
    }
}

// Close authentication modal
function closeAuthModal() {
    console.log('closeAuthModal called');
    const authModal = document.getElementById('authModal');
    if (authModal) {
        console.log('Closing auth modal');
        authModal.classList.add('hidden');
    } else {
        console.log('Auth modal element not found');
    }
}

// Handle Google Sign-In
async function handleGoogleSignIn() {
    console.log('Google sign-in initiated...');
    try {
        const provider = new firebase.auth.GoogleAuthProvider();

        // Force account selection and restrict to umich.edu domain
        provider.setCustomParameters({
            prompt: 'select_account',
            hd: 'umich.edu' // Hosted domain - only show @umich.edu accounts
        });

        // Try popup first, fall back to redirect if blocked
        try {
            const result = await firebaseApp.auth.signInWithPopup(provider);
            const user = result.user;

            console.log('Google sign-in successful:', user.email);

            // Validate @umich.edu email
            if (!user.email.toLowerCase().endsWith('@umich.edu')) {
                alert('Only @umich.edu email addresses are allowed. Please sign in with your UMich Google account.');
                await firebaseApp.auth.signOut();
                return;
            }

            // Close modal
            closeAuthModal();

            // Redirect if on landing page
            if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                window.location.href = 'events.html';
            }

        } catch (popupError) {
            // If popup is blocked, use redirect instead
            if (popupError.code === 'auth/popup-blocked') {
                console.log('Popup blocked, using redirect instead...');
                await firebaseApp.auth.signInWithRedirect(provider);
                return;
            }
            throw popupError; // Re-throw if it's a different error
        }

    } catch (error) {
        console.error('Google sign-in error:', error);

        if (error.code === 'auth/popup-closed-by-user') {
            // User closed the popup - no action needed
            return;
        }

        if (error.code === 'auth/cancelled-popup-request') {
            // Multiple popups - ignore
            return;
        }

        alert('Sign-in failed: ' + error.message);
    }
}

// Handle redirect result (when user returns from Google sign-in)
firebaseApp.auth.getRedirectResult().then((result) => {
    if (result.user) {
        console.log('Sign-in via redirect successful:', result.user.email);

        // Validate @umich.edu email
        if (!result.user.email.toLowerCase().endsWith('@umich.edu')) {
            alert('Only @umich.edu email addresses are allowed. Please sign in with your UMich Google account.');
            firebaseApp.auth.signOut();
        } else {
            // Close modal on successful redirect sign-in (wait for DOM to be ready)
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    closeAuthModal();
                    // Redirect to events page if on landing page
                    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                        window.location.href = 'events.html';
                    }
                });
            } else {
                closeAuthModal();
                // Redirect to events page if on landing page
                if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                    window.location.href = 'events.html';
                }
            }
        }
    }
}).catch((error) => {
    if (error.code !== 'auth/popup-closed-by-user') {
        console.error('Redirect sign-in error:', error);
    }
});

// Handle Logout
async function logout() {
    try {
        await firebaseApp.auth.signOut();
        console.log('Logout successful');

        // Redirect to home page
        window.location.href = 'index.html';

    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed. Please try again.');
    }
}

// Get current user
function getCurrentUser() {
    return firebaseApp.auth.currentUser;
}

// Check if user is logged in
function isUserLoggedIn() {
    return firebaseApp.auth.currentUser !== null;
}

// Setup auth modal event listeners - runs immediately when script loads
(function() {
    console.log('🔵 Auth.js loaded, waiting for Firebase...');

    function initAuth() {
        if (!window.firebaseApp) {
            console.log('⏳ Firebase not ready yet, waiting...');
            setTimeout(initAuth, 100);
            return;
        }

        console.log('✅ Firebase ready, setting up auth listeners...');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupListeners);
        } else {
            setupListeners();
        }
    }

    // Start initialization
    initAuth();

    function setupListeners() {
        console.log('🔵 DOM ready, setting up listeners...');

        const closeAuthModalBtn = document.getElementById('closeAuthModal');
        const googleSignInBtn = document.getElementById('googleSignInBtn');
        const authLink = document.getElementById('authLink');
        const authModal = document.getElementById('authModal');

        // Close button
        if (closeAuthModalBtn) {
            console.log('Close button found, adding listener');
            closeAuthModalBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Close button clicked');
                closeAuthModal();
            });
        } else {
            console.warn('Close button not found');
        }

        // Google sign-in button
        if (googleSignInBtn) {
            console.log('Google sign-in button found, adding listener');
            googleSignInBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Google sign-in button clicked');
                handleGoogleSignIn();
            });
        } else {
            console.warn('Google sign-in button not found');
        }

        // Auth link (Login/Logout)
        if (authLink) {
            console.log('Auth link found, adding listener');
            authLink.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Auth link clicked, isLoggedIn:', isLoggedIn);
                if (isLoggedIn) {
                    logout();
                } else {
                    showAuthModal();
                }
            });
        } else {
            console.warn('Auth link not found');
        }

        // Close modal when clicking outside
        if (authModal) {
            authModal.addEventListener('click', function(e) {
                if (e.target === authModal) {
                    console.log('Clicked outside modal, closing');
                    closeAuthModal();
                }
            });
        }

        console.log('All event listeners set up');
    }
})();

// Export functions for use in other scripts
window.authHelpers = {
    getCurrentUser,
    isUserLoggedIn,
    logout,
    showAuthModal,
    closeAuthModal,
    handleGoogleSignIn
};

// Also expose directly for inline onclick handlers
window.showAuthModal = showAuthModal;
window.closeAuthModal = closeAuthModal;
window.handleGoogleSignIn = handleGoogleSignIn;
window.logout = logout;
