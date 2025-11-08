# UMich Calendar Aggregator

A centralized event discovery platform that aggregates all University of Michigan events into one searchable, personalized interface.

![UMich Colors](https://img.shields.io/badge/UMich-Maize%20%26%20Blue-FFCB05?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Firebase Setup](#firebase-setup)
7. [Web Scraping](#web-scraping)
8. [Deployment](#deployment)
9. [Usage](#usage)
10. [Contributing](#contributing)
11. [License](#license)

---

## Overview

The **UMich Calendar Aggregator** solves the problem of fragmented event information across the University of Michigan campus. By automatically scraping and aggregating events from 25+ official sources, students can:

- 📅 Discover all campus events in one place
- 🎯 Get personalized recommendations based on their interests
- 🔍 Search and filter events by category, school, and date
- 💾 Save events and export to their calendar

---

## Features

### Core Features (MVP)

- ✅ **Event Aggregation** - Scrapes 25+ UMich event sources daily
- ✅ **User Authentication** - Email/password auth with @umich.edu validation
- ✅ **Personalized Feed** - Events ranked by user's school, interests, and career goals
- ✅ **Search & Filters** - Filter by date, category, school, and keywords
- ✅ **Event Details** - Full event information with registration links
- ✅ **Calendar Export** - Download .ics files for Google/Apple Calendar
- ✅ **User Profiles** - Save preferences, interests, and bookmarked events
- ✅ **Responsive Design** - Mobile-first, works on all devices

### Planned Features

- 📧 Email digests (weekly/daily)
- 🔔 Push notifications for new events
- 👥 Social features (see which friends are attending)
- 📊 Analytics dashboard for event organizers

---

## Tech Stack

### Frontend

- **HTML5** - Semantic markup
- **CSS3** - Custom styles with UMich branding
- **Vanilla JavaScript** - No frameworks for simplicity

### Backend

- **Firebase Authentication** - User auth with email/password
- **Firebase Firestore** - NoSQL database for events and user data
- **Firebase Hosting** - Static website hosting (optional)

### Scrapers

- **Node.js** - Runtime for scraper scripts
- **Puppeteer** - Headless browser for dynamic pages
- **Cheerio** - Fast HTML parsing for static pages
- **Firebase Admin SDK** - Write scraped data to Firestore

---

## Project Structure

```
umich-calendar/
├── index.html                    # Landing page
├── events.html                   # Main event feed
├── event-details.html            # Individual event page
├── profile.html                  # User profile/settings
├── css/
│   └── styles.css               # Main stylesheet (UMich branding)
├── js/
│   ├── firebase-config.js       # Firebase initialization
│   ├── auth.js                  # Authentication logic
│   ├── events.js                # Event display & filtering
│   ├── profile.js               # Profile management
│   └── utils.js                 # Utility functions
├── data/
│   ├── event-sources.json       # List of 25 event sources
│   └── database-schema.md       # Firestore schema documentation
├── scrapers/
│   ├── package.json             # Node.js dependencies
│   ├── SCRAPING-STRATEGY.md     # Scraper architecture guide
│   └── example-scraper.js       # Template for new scrapers
├── PRD.md                        # Product Requirements Document
└── README.md                     # This file
```

---

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Firebase account (free tier works fine)
- Node.js 18+ (for running scrapers)
- Git

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/your-username/umich-calendar.git
cd umich-calendar
```

#### 2. Set Up Firebase

See detailed instructions in [Firebase Setup](#firebase-setup) section below.

#### 3. Configure Firebase Credentials

Edit `js/firebase-config.js` and replace the placeholder values with your Firebase project configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

#### 4. Run Locally

Simply open `index.html` in your browser, or use a local server:

```bash
# Option 1: Python
python3 -m http.server 8000

# Option 2: Node.js (npx)
npx http-server -p 8000

# Option 3: VS Code Live Server extension
# Right-click index.html and select "Open with Live Server"
```

Then navigate to `http://localhost:8000`

---

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Name your project (e.g., "UMich Events")
4. Disable Google Analytics (optional)
5. Click **"Create project"**

### Step 2: Enable Authentication

1. In Firebase Console, go to **Build > Authentication**
2. Click **"Get started"**
3. Enable **"Email/Password"** sign-in method
4. Save

### Step 3: Create Firestore Database

1. Go to **Build > Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"** (we'll add security rules later)
4. Select a location (e.g., `us-central`)
5. Click **"Enable"**

### Step 4: Set Up Firestore Security Rules

Go to **Firestore Database > Rules** and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Events - readable by all authenticated users
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow write: if false; // Only allow writes from admin/scrapers
    }

    // Users - users can only read/write their own document
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Sources - readable by authenticated users
    match /sources/{sourceId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

### Step 5: Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll down to **"Your apps"**
3. Click **"Web"** icon (</>)
4. Register your app (nickname: "UMich Events Web")
5. Copy the `firebaseConfig` object
6. Paste into `js/firebase-config.js`

### Step 6: (Optional) Set Up Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select your project
# Public directory: . (current directory)
# Single-page app: No
# Deploy: firebase deploy
```

---

## Web Scraping

### Initial Setup

1. Navigate to scrapers directory:

```bash
cd scrapers
```

2. Install dependencies:

```bash
npm install
```

3. Create Firebase service account:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click **"Generate new private key"**
   - Save as `scrapers/service-account-key.json`
   - **DO NOT commit this file to Git!**

### Running Scrapers

#### Test Individual Scraper

```bash
node example-scraper.js
```

#### Run All Scrapers

```bash
npm run scrape:all
```

### Creating New Scrapers

1. Copy `example-scraper.js` to `your-source-scraper.js`
2. Update `SOURCE_CONFIG` with your source details
3. Modify selectors in `scrapeEvents()` to match target website
4. Test: `node your-source-scraper.js`
5. Add to main orchestrator

See `scrapers/SCRAPING-STRATEGY.md` for detailed guide.

---

## Deployment

### Option 1: Firebase Hosting

```bash
firebase deploy
```

Your app will be live at `https://your-project-id.web.app`

### Option 2: GitHub Pages

1. Push code to GitHub
2. Go to repository **Settings > Pages**
3. Source: Deploy from `main` branch
4. Your app will be live at `https://your-username.github.io/umich-calendar/`

### Option 3: Netlify

1. Go to [Netlify](https://netlify.com)
2. Click **"Add new site" > "Import an existing project"**
3. Connect your GitHub repository
4. Deploy

---

## Usage

### For Students

#### 1. Sign Up

- Visit the app
- Click **"Sign Up"**
- Use your `@umich.edu` email address
- Create a password (min. 8 characters)

#### 2. Complete Profile

- Fill in your school, interests, and career goals
- This helps personalize your event recommendations

#### 3. Browse Events

- View personalized event feed on main page
- Use search bar to find specific events
- Apply filters by date, category, or school

#### 4. View Event Details

- Click on any event card
- View full details, location, and time
- Click **"Register"** to sign up (external link)
- Click **"Add to Calendar"** to download .ics file

#### 5. Save Events

- Click **"Save Event"** to bookmark interesting events
- View saved events in your profile

### For Developers

#### Running Scrapers Locally

```bash
cd scrapers
npm install
node example-scraper.js
```

#### Adding New Event Sources

1. Identify event source website
2. Add to `data/event-sources.json`
3. Create scraper in `scrapers/` directory
4. Test thoroughly
5. Schedule with cron or cloud functions

---

## Data Sources

We aggregate events from 25+ official UMich sources:

### Schools & Colleges

- Ross School of Business
- College of Engineering
- College of LSA
- School of Information
- Law School
- Ford School of Public Policy
- School of Public Health
- Medical School
- And more...

### Centers & Institutes

- Zell Lurie Institute
- Tauber Institute
- Center for Entrepreneurship
- Erb Institute
- Graham Sustainability Institute

### University-Wide

- U-M Events Calendar (events.umich.edu)
- Maize Pages (student organizations)
- Career Center
- University Library

See full list in `data/event-sources.json`

---

## Contributing

We welcome contributions from the UMich community!

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Contribution Ideas

- Add scrapers for new event sources
- Improve mobile responsive design
- Add email notification system
- Implement social features
- Write tests
- Improve documentation

---

## Roadmap

### Phase 1: MVP (Complete)

- [x] Event aggregation from 25+ sources
- [x] User authentication
- [x] Personalized event feed
- [x] Search and filters
- [x] Event details page
- [x] Calendar export

### Phase 2: Enhancements

- [ ] Email digests (daily/weekly)
- [ ] Event reminders
- [ ] Save/bookmark events
- [ ] Improved mobile UI
- [ ] Dark mode

### Phase 3: Social & Advanced

- [ ] See which friends are attending
- [ ] Event comments and reviews
- [ ] Admin dashboard for event organizers
- [ ] Analytics and insights
- [ ] Native mobile apps (iOS/Android)

---

## Troubleshooting

### Common Issues

#### Events Not Loading

- Check Firebase configuration in `js/firebase-config.js`
- Verify Firestore security rules allow read access
- Check browser console for errors

#### Authentication Not Working

- Verify Firebase Authentication is enabled
- Check that email/password provider is enabled
- Ensure `@umich.edu` email is used

#### Scrapers Failing

- Check if target website structure has changed
- Verify Firebase Admin SDK credentials
- Check for rate limiting or IP blocking

---

## Privacy & Legal

- **Data Collection**: We only collect publicly available event information
- **User Privacy**: User data is stored securely in Firebase with proper access controls
- **FERPA Compliance**: No personal student information is collected or stored
- **Robots.txt**: All scrapers respect robots.txt directives
- **Rate Limiting**: Scrapers implement proper rate limiting to avoid overloading servers

---

## Support

For questions, issues, or feedback:

- Open an issue on GitHub
- Email: [your-email]@umich.edu

---

## License

This project is licensed under the MIT License - see LICENSE file for details.

---

## Acknowledgments

- University of Michigan community
- All event organizers and student organizations
- Open source libraries: Firebase, Puppeteer, Cheerio

---

## Disclaimer

This project is **not officially affiliated** with the University of Michigan. It is a student-built tool created to help the UMich community discover campus events more easily.

---

**Made with 💙 and 💛 by UMich students, for UMich students.**
