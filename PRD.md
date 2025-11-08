# Product Requirements Document (PRD)

## UMich Calendar Aggregator

### Document Information
- **Version**: 1.0
- **Last Updated**: 2025-11-08
- **Status**: Draft

---

## 1. Overview

### 1.1 Product Name
**UMich Calendar Aggregator**

### 1.2 Executive Summary
A centralized event discovery platform that aggregates all University of Michigan events into one searchable, personalized interface. The platform helps students discover relevant academic, career, social, and cultural events across all schools, departments, and student organizations.

---

## 2. Problem Statement

### 2.1 Current Situation
The University of Michigan hosts a large number of events across schools, departments, clubs, and centers. However, information about these events is scattered across numerous websites and newsletters, making it difficult for students to discover relevant opportunities.

### 2.2 Impact
This fragmentation leads to:
- Missed events and opportunities
- Reduced student engagement
- Lower event attendance for organizers
- Information overload and decision fatigue

### 2.3 Proposed Solution
A unified platform that automatically aggregates, categorizes, and personalizes event recommendations based on each user's academic background, interests, and career goals.

---

## 3. Target Users

### 3.1 Primary Users
**University of Michigan Students**
- Undergraduate students
- Graduate students
- Professional program students
- Demographics: Tech-savvy, aged 18-30, seeking networking and learning opportunities

### 3.2 Secondary Users
**Faculty and Staff**
- Seeking relevant networking or professional development opportunities
- May attend cross-departmental events

### 3.3 Future Users (Out of Current Scope)
- Event organizers (analytics dashboard)
- Alumni (post-graduation event access)

---

## 4. Goals and Objectives

### 4.1 Product Goals
1. Aggregate all U-M events into one centralized, searchable platform
2. Personalize event recommendations based on user profiles
3. Increase student event participation and engagement across campus
4. Reduce time spent searching for relevant events

### 4.2 Success Metrics
- **User Adoption**: Number of users registered within the first semester
- **Engagement**: Event click-through and registration rates
- **Satisfaction**: User satisfaction scores via feedback surveys (target: 4.0+/5.0)
- **Impact**: Reduction in missed events compared to baseline (measured via surveys)
- **Retention**: Weekly active users (WAU) and Monthly active users (MAU)

---

## 5. Feature Requirements

## Phase 1: Data Aggregation & Foundation (MVP)

### 5.1 Event Data Collection System

#### Feature 1.1: Event Source Management
**Priority**: Critical (P0)

**Description**: Build and maintain a comprehensive list of official U-M event websites.

**Event Sources Include**:
- Ross School of Business
- College of Engineering (CoE)
- College of Literature, Science, and the Arts (LSA)
- Tauber Institute
- Zell Lurie Institute (ZLI)
- Student organizations
- University-wide calendars

**Acceptance Criteria**:
- [ ] Database table for event sources with metadata (URL, school/org name, scraping frequency)
- [ ] Admin interface to add/edit/remove event sources
- [ ] Minimum 20 event sources configured at launch

#### Feature 1.2: Web Scraping System
**Priority**: Critical (P0)

**Description**: Implement automated daily scraping to collect event data from all configured sources.

**User Story**: As the system, I need to automatically collect event data daily so that the platform always shows current events.

**Technical Requirements**:
- Daily scraping jobs via CRON scheduler or cloud function
- Robust error handling and retry logic
- Scraping logs and monitoring
- Rate limiting to respect source websites

**Data Fields to Extract**:
- Event name
- Date and time
- Location (physical/virtual)
- School or organization
- Registration link
- Short description
- Category (career, academic, social, cultural, etc.)
- Image/thumbnail (if available)

**Acceptance Criteria**:
- [ ] Scraper runs automatically once daily
- [ ] Successfully extracts all required fields from at least 80% of sources
- [ ] Deduplication logic to avoid duplicate events
- [ ] Failed scrapes logged and alertable

#### Feature 1.3: Centralized Event Database
**Priority**: Critical (P0)

**Database Schema**:
```
events table:
- event_id (primary key)
- event_name
- date
- time
- location
- school_or_organization
- registration_link
- short_description
- category
- image_url
- created_at
- updated_at
- source_url
```

**Acceptance Criteria**:
- [ ] Database normalized and indexed for performance
- [ ] Handles duplicate event detection
- [ ] Supports historical event data retention

---

## Phase 2: User Platform (Web Application)

### 5.2 User Authentication

#### Feature 2.1: UMich SSO Integration
**Priority**: Critical (P0)

**Description**: Secure authentication via University of Michigan Single Sign-On.

**User Story**: As a UMich student, I want to log in with my UMich credentials so that I can access personalized event recommendations securely.

**Acceptance Criteria**:
- [ ] Integration with UMich SSO (Shibboleth/SAML)
- [ ] Secure session management
- [ ] Automatic profile creation on first login
- [ ] Logout functionality

### 5.3 User Profile & Personalization

#### Feature 2.2: Profile Setup
**Priority**: Critical (P0)

**Description**: Users configure their profile with school, interests, and career goals for personalized recommendations.

**Profile Fields**:
- School (dropdown: Ross, CoE, LSA, etc.)
- Interests (multi-select: entrepreneurship, AI, sustainability, finance, etc.)
- Career goals (multi-select: consulting, tech, finance, nonprofit, research, etc.)
- Year/Program (undergraduate/graduate, year)

**Acceptance Criteria**:
- [ ] Profile setup wizard on first login
- [ ] Ability to edit profile at any time
- [ ] Profile data saved and used for recommendations

### 5.4 Event Discovery

#### Feature 2.3: Personalized Event Feed
**Priority**: Critical (P0)

**Description**: Homepage displays events ranked by relevance to user profile and browsing history.

**User Story**: As a student, I want to see events relevant to my interests first so that I can quickly find opportunities that matter to me.

**Recommendation Algorithm**:
- Match events to user's school
- Match events to user's interests
- Match events to user's career goals
- Boost recently added events
- Consider user's past event views/clicks

**Acceptance Criteria**:
- [ ] Feed loads within 2 seconds
- [ ] Shows at least 10-20 relevant events
- [ ] Updates based on profile changes
- [ ] "Load more" or pagination for additional events

#### Feature 2.4: Search & Filters
**Priority**: High (P1)

**Description**: Users can search and filter events by various criteria.

**Filter Options**:
- Date range (today, this week, this month, custom)
- School/organization
- Category (career, academic, social, cultural)
- Location (on-campus, specific building, virtual)
- Keywords (search event title and description)

**Acceptance Criteria**:
- [ ] Filters update results in real-time
- [ ] Multiple filters can be applied simultaneously
- [ ] Search supports partial matches
- [ ] Clear all filters button

#### Feature 2.5: Event Details Page
**Priority**: High (P1)

**Description**: Dedicated page for each event with full information and action buttons.

**Information Displayed**:
- Event name and image
- Full description
- Date, time, location
- Organizer/school
- Category tags
- Registration link (external)

**Actions**:
- Register button (links to external registration)
- Add to Calendar (.ics download or Google Calendar integration)
- Share event (copy link, email)

**Acceptance Criteria**:
- [ ] Unique URL for each event
- [ ] All event details displayed clearly
- [ ] Registration link opens in new tab
- [ ] Calendar export works for Google Calendar and Apple Calendar

---

## Phase 3: Engagement & Notifications

### 5.5 Email Communications

#### Feature 3.1: Email Digest
**Priority**: High (P1)

**Description**: Weekly or daily email summarizing top recommended events.

**User Story**: As a busy student, I want to receive a weekly email with curated events so that I don't have to check the platform daily.

**Email Content**:
- Top 5-10 recommended events
- Brief description and date for each
- Click-through to event details page
- Option to manage email preferences

**Email Frequency Options**:
- Daily digest
- Weekly digest (Monday morning)
- Bi-weekly digest
- None (opt-out)

**Acceptance Criteria**:
- [ ] Users can configure email frequency in settings
- [ ] Emails sent at scheduled times
- [ ] Unsubscribe link in every email
- [ ] Mobile-responsive email design

#### Feature 3.2: Event Alerts
**Priority**: Medium (P2)

**Description**: Optional notifications for newly added events matching user interests.

**Notification Channels**:
- Email notifications
- In-app notifications (future: browser push)

**Acceptance Criteria**:
- [ ] Users can enable/disable alerts in settings
- [ ] Alerts only sent for high-match events
- [ ] Maximum 1 alert per day to avoid spam
- [ ] Notifications are actionable (link to event)

---

## 6. Technical Requirements

### 6.1 Technology Stack

**Backend**:
- Language: Python (Flask/Django) or Node.js (Express)
- API: RESTful API or GraphQL

**Database**:
- Primary: PostgreSQL (structured event data)
- Alternative: Firebase (if rapid prototyping needed)

**Frontend**:
- Framework: React or Next.js
- Styling: Tailwind CSS or Material-UI
- State Management: React Context or Redux

**Hosting & Infrastructure**:
- Cloud Provider: Google Cloud Platform or AWS
- CDN: Cloudflare or AWS CloudFront
- Email Service: SendGrid or AWS SES

**Automation**:
- Scraping Jobs: CRON scheduler or AWS Lambda/Cloud Functions
- CI/CD: GitHub Actions or GitLab CI

**Third-Party Integrations**:
- UMich SSO (Shibboleth/SAML)
- Google Calendar API
- Email service (SendGrid/AWS SES)

### 6.2 Performance Requirements
- Page load time: < 2 seconds for event feed
- Search results: < 1 second
- API response time: < 500ms for 95th percentile
- Support for 10,000+ concurrent users
- Database queries optimized with proper indexing

### 6.3 Security Requirements
- Authentication via UMich SSO only (no password storage)
- HTTPS for all traffic
- SQL injection prevention (parameterized queries)
- XSS protection (input sanitization)
- CSRF tokens for state-changing operations
- Rate limiting on API endpoints
- Compliance with FERPA (student privacy)

### 6.4 Browser/Platform Support
- Desktop browsers: Chrome, Firefox, Safari, Edge (latest 2 versions)
- Mobile browsers: iOS Safari, Chrome Mobile
- Responsive design for mobile, tablet, desktop
- Accessibility: WCAG 2.1 AA compliance

---

## 7. User Experience & Design

### 7.1 Main User Flow

**New User Journey**:
1. User visits platform
2. Clicks "Login with UMich"
3. Redirected to UMich SSO → Authenticates
4. Profile setup wizard (school, interests, career goals)
5. Lands on personalized event feed
6. Clicks event → Views details → Registers or adds to calendar

**Returning User Journey**:
1. User visits platform
2. Auto-authenticated (session)
3. Lands on personalized event feed
4. Uses search/filters to find specific events
5. Clicks event → Views details → Takes action

### 7.2 Key Pages/Views

1. **Landing Page** (public)
   - Value proposition
   - Sample event listings
   - "Login with UMich" CTA

2. **Event Feed** (authenticated)
   - Personalized event cards
   - Search bar and filters
   - Categories sidebar

3. **Event Details Page**
   - Full event information
   - Action buttons (register, add to calendar, share)

4. **User Profile/Settings**
   - Edit interests and preferences
   - Email notification settings
   - Account management

### 7.3 Design Principles
- **Simple & Clean**: Minimal clutter, focus on event discovery
- **Mobile-First**: Optimized for mobile browsing
- **Accessible**: High contrast, keyboard navigation, screen reader support
- **UMich Branding**: Use university colors (maize and blue) and fonts

---

## 8. Data Sources & Integration

### 8.1 Event Sources (Initial List)
- Ross School of Business events calendar
- College of Engineering events
- LSA events
- Tauber Institute
- Zell Lurie Institute
- Student org calendars (via UM Maize Pages or individual sites)
- University Career Center
- University Libraries events

### 8.2 External Dependencies
- UMich SSO authentication service
- Google Calendar API
- Email delivery service (SendGrid/AWS SES)
- Web scraping libraries (BeautifulSoup, Puppeteer, Scrapy)

---

## 9. Assumptions & Constraints

### 9.1 Assumptions
- University websites allow scraping (or provide APIs/RSS feeds)
- Students have UMich email accounts and SSO access
- Students check email regularly (for digest feature)
- Majority of events have online registration or information pages

### 9.2 Constraints
- Must comply with university IT policies and FERPA
- Limited to publicly available event information
- Cannot guarantee 100% accuracy of scraped data
- Dependent on external event sources maintaining consistent formats
- Development resources: [to be determined based on team]

---

## 10. Timeline & Milestones

| Phase | Milestone | Target Date | Description |
|-------|-----------|-------------|-------------|
| Phase 1 | Data Aggregation Complete | Week 4 | Scraping system collecting from 20+ sources |
| Phase 2 | MVP Launch | Week 8 | Core platform with auth, feed, and event details |
| Phase 2 | Search & Filters | Week 10 | Advanced discovery features |
| Phase 3 | Email Digest Launch | Week 12 | Weekly email notifications |
| Phase 3 | Event Alerts | Week 14 | Real-time event alerts |
| - | Public Beta | Week 16 | Open to all UMich students |

*Note: Actual dates to be determined based on development start date*

---

## 11. Out of Scope (Current Version)

### 11.1 Explicitly Not Included
- Event creation by users (read-only platform)
- Social features (comments, reviews, ratings)
- Ticketing/payment processing
- Native mobile apps (iOS/Android)
- Analytics dashboard for event organizers
- Event check-in or attendance tracking
- Integration with Canvas or Wolverine Access

### 11.2 Future Opportunities (Post-MVP)
1. **Slack/Discord Integration**: Event channels for clubs
2. **Mobile Apps**: Native iOS/Android apps with push notifications
3. **Organizer Dashboard**: Analytics and insights for event hosts
4. **Official API Access**: Partner with UMich IT for direct event data feeds
5. **AI-Powered Recommendations**: Machine learning for better personalization
6. **Social Features**: Ability to see which friends are attending events
7. **Alumni Access**: Extend platform to UMich alumni
8. **Event Ratings & Reviews**: User feedback on past events

---

## 12. Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|------------|---------------------|
| Website structure changes break scrapers | High | Medium | Build flexible scrapers, implement monitoring alerts, maintain backup manual data entry |
| Low user adoption | High | Medium | Launch marketing campaign, partner with student orgs, gather early feedback |
| SSO integration issues | High | Low | Work with UMich IT early, have fallback email authentication |
| Inaccurate event data | Medium | Medium | Implement user reporting, periodic manual audits, data quality checks |
| Server costs exceed budget | Medium | Low | Start with serverless architecture, monitor usage, optimize queries |

---

## 13. Open Questions

- [ ] Does UMich IT provide an official events API?
- [ ] What is the budget for cloud hosting and email services?
- [ ] Are there legal/policy requirements for scraping university websites?
- [ ] What is the development team size and availability?
- [ ] Should we pilot with one school first or launch university-wide?
- [ ] What analytics tools should we use (Google Analytics, Mixpanel, etc.)?

---

## 14. Appendix

### 14.1 Glossary
- **SSO**: Single Sign-On - Authentication method using UMich credentials
- **Scraping**: Automated extraction of data from websites
- **MVP**: Minimum Viable Product - Initial version with core features only
- **FERPA**: Family Educational Rights and Privacy Act - Federal student privacy law
- **WAU/MAU**: Weekly/Monthly Active Users - Engagement metrics

### 14.2 References
- [University of Michigan IT Services](https://its.umich.edu/)
- [UMich Event Calendar Examples] (to be added)
- [Similar platforms at other universities] (to be researched)

---

## Document Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | [TBD] | | |
| Tech Lead | [TBD] | | |
| Designer | [TBD] | | |

---

**End of Document**
