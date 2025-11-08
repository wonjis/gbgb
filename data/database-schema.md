# Firebase Firestore Database Schema

## Collections Overview

This document defines the Firestore database structure for the UMich Calendar Aggregator app.

---

## 1. `events` Collection

Stores all aggregated events from various UMich sources.

### Document Structure

```javascript
{
  eventId: string,              // Auto-generated document ID
  name: string,                 // Event title
  description: string,          // Full event description
  shortDescription: string,     // Truncated description (200 chars)
  date: timestamp,              // Event date (Firestore timestamp)
  time: string,                 // Event time (e.g., "5:00 PM - 7:00 PM")
  location: string,             // Physical or virtual location
  locationType: string,         // "physical", "virtual", "hybrid"
  school: string,               // School/department hosting
  organization: string,         // Specific org (if applicable)
  category: array<string>,      // ["career", "networking", "academic"]
  registrationLink: string,     // External registration URL
  imageUrl: string,             // Event image/poster URL (optional)
  sourceUrl: string,            // Original event page URL
  sourceId: string,             // Reference to sources collection
  createdAt: timestamp,         // When scraped/added
  updatedAt: timestamp,         // Last modified
  isActive: boolean,            // Is event still upcoming?
  tags: array<string>           // Additional searchable tags
}
```

### Indexes

- `date` (ascending) - for date-based queries
- `school` (ascending) - for school filtering
- `category` (array-contains) - for category filtering
- `isActive` (ascending) - for active events only
- Composite: `isActive` + `date` - for active upcoming events

### Sample Document

```javascript
{
  eventId: "evt_2025_ross_networking_001",
  name: "Ross Career Fair 2025",
  description: "Annual career fair featuring 50+ companies...",
  shortDescription: "Annual career fair featuring 50+ companies recruiting for internships and full-time roles.",
  date: Timestamp(2025-03-15 14:00:00),
  time: "2:00 PM - 6:00 PM",
  location: "Ross School of Business, Robertson Auditorium",
  locationType: "physical",
  school: "Ross School of Business",
  organization: "Ross Career Services",
  category: ["career", "networking", "professional"],
  registrationLink: "https://michiganross.umich.edu/career-fair-registration",
  imageUrl: "https://example.com/poster.jpg",
  sourceUrl: "https://michiganross.umich.edu/events/career-fair-2025",
  sourceId: "ross-business",
  createdAt: Timestamp(2025-01-10 09:00:00),
  updatedAt: Timestamp(2025-01-10 09:00:00),
  isActive: true,
  tags: ["recruiting", "jobs", "internships", "networking"]
}
```

---

## 2. `users` Collection

Stores user profiles and preferences for personalization.

### Document Structure

```javascript
{
  uid: string,                  // Firebase Auth UID (document ID)
  email: string,                // @umich.edu email
  firstName: string,            // User's first name
  lastName: string,             // User's last name
  school: string,               // Primary school/college
  year: string,                 // "Freshman", "Sophomore", etc.
  program: string,              // "Undergraduate", "Graduate", "PhD"
  interests: array<string>,     // ["entrepreneurship", "AI", "finance"]
  careerGoals: array<string>,   // ["consulting", "tech", "startup"]
  savedEvents: array<string>,   // Array of event IDs (bookmarked)
  viewedEvents: array<string>,  // Recently viewed event IDs
  emailPreferences: {
    digestFrequency: string,    // "daily", "weekly", "biweekly", "none"
    eventAlerts: boolean,       // Enable new event notifications
    reminderBefore: number      // Hours before event (e.g., 24)
  },
  createdAt: timestamp,
  lastLogin: timestamp,
  isActive: boolean             // Account status
}
```

### Sample Document

```javascript
{
  uid: "abc123def456",
  email: "johndoe@umich.edu",
  firstName: "John",
  lastName: "Doe",
  school: "Ross School of Business",
  year: "Junior",
  program: "Undergraduate",
  interests: ["entrepreneurship", "venture capital", "AI"],
  careerGoals: ["consulting", "tech", "startup"],
  savedEvents: ["evt_001", "evt_002", "evt_015"],
  viewedEvents: ["evt_001", "evt_003", "evt_007", "evt_012"],
  emailPreferences: {
    digestFrequency: "weekly",
    eventAlerts: true,
    reminderBefore: 24
  },
  createdAt: Timestamp(2025-01-05 08:30:00),
  lastLogin: Timestamp(2025-11-08 14:25:00),
  isActive: true
}
```

---

## 3. `sources` Collection

Manages event source websites for scraping.

### Document Structure

```javascript
{
  sourceId: string,             // Unique identifier (document ID)
  name: string,                 // Display name
  url: string,                  // Website URL to scrape
  school: string,               // Associated school/department
  category: array<string>,      // Event types from this source
  scrapingFrequency: string,    // "daily", "weekly"
  active: boolean,              // Is scraping enabled?
  lastScraped: timestamp,       // Last successful scrape
  lastSuccess: boolean,         // Did last scrape succeed?
  errorCount: number,           // Consecutive errors (for monitoring)
  errorMessage: string,         // Last error (if any)
  notes: string,                // Admin notes
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Sample Document

```javascript
{
  sourceId: "ross-business",
  name: "Ross School of Business",
  url: "https://michiganross.umich.edu/events",
  school: "Ross School of Business",
  category: ["career", "networking", "academic"],
  scrapingFrequency: "daily",
  active: true,
  lastScraped: Timestamp(2025-11-08 03:00:00),
  lastSuccess: true,
  errorCount: 0,
  errorMessage: "",
  notes: "Main event calendar for Ross",
  createdAt: Timestamp(2025-01-01 00:00:00),
  updatedAt: Timestamp(2025-11-08 03:00:00)
}
```

---

## 4. `categories` Collection (Optional Reference)

Standardized category definitions for consistent tagging.

### Document Structure

```javascript
{
  categoryId: string,
  name: string,
  displayName: string,
  description: string,
  icon: string,                // Icon name or emoji
  color: string                // Hex color for UI
}
```

### Predefined Categories

```javascript
[
  { categoryId: "career", displayName: "Career", icon: "💼", color: "#00274C" },
  { categoryId: "academic", displayName: "Academic", icon: "📚", color: "#FFCB05" },
  { categoryId: "networking", displayName: "Networking", icon: "🤝", color: "#00B2A9" },
  { categoryId: "social", displayName: "Social", icon: "🎉", color: "#9A3324" },
  { categoryId: "cultural", displayName: "Cultural", icon: "🎭", color: "#9B0051" },
  { categoryId: "entrepreneurship", displayName: "Entrepreneurship", icon: "🚀", color: "#755139" },
  { categoryId: "sustainability", displayName: "Sustainability", icon: "🌱", color: "#A5A508" },
  { categoryId: "sports", displayName: "Sports", icon: "⚽", color: "#00274C" },
  { categoryId: "health", displayName: "Health", icon: "🏥", color: "#D86018" },
  { categoryId: "tech", displayName: "Technology", icon: "💻", color: "#007BBF" }
]
```

---

## Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Events - readable by all authenticated users, writable by admins only
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    // Users - users can only read/write their own document
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
    }

    // Sources - readable by authenticated users, writable by admins only
    match /sources/{sourceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    // Categories - readable by all, writable by admins
    match /categories/{categoryId} {
      allow read: if true;  // Public
      allow write: if request.auth != null &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

---

## Initialization Script

For first-time setup, use this script to populate sources collection from event-sources.json:

```javascript
// Run this in Firebase Console or Node.js script
const sources = require('./data/event-sources.json');

sources.sources.forEach(async (source) => {
  await db.collection('sources').doc(source.id).set({
    sourceId: source.id,
    name: source.name,
    url: source.url,
    school: source.school,
    category: source.category,
    scrapingFrequency: source.scrapingFrequency,
    active: source.active,
    lastScraped: null,
    lastSuccess: null,
    errorCount: 0,
    errorMessage: "",
    notes: source.notes,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
});
```

---

## Query Examples

### Get upcoming events for user's school

```javascript
eventsCollection
  .where('isActive', '==', true)
  .where('school', '==', userSchool)
  .where('date', '>=', new Date())
  .orderBy('date', 'asc')
  .limit(20)
  .get();
```

### Get events by category

```javascript
eventsCollection
  .where('isActive', '==', true)
  .where('category', 'array-contains', 'career')
  .orderBy('date', 'asc')
  .get();
```

### Search events by keyword

```javascript
// Note: Firestore doesn't support full-text search natively
// For production, integrate Algolia or use Cloud Functions with Elasticsearch
// For MVP, implement client-side filtering after fetching events
```

---

## Notes

- Use Firebase Admin SDK for scraper scripts (server-side)
- Implement rate limiting on client-side queries
- Consider implementing pagination for large result sets
- Use Firebase Cloud Functions for scheduled scraping jobs
- Implement error logging and monitoring for production
