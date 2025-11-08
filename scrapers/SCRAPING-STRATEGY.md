# Web Scraping Strategy for UMich Calendar Aggregator

## Overview

This document outlines the strategy for scraping event data from various University of Michigan websites.

---

## Technology Stack

### Recommended Tools

1. **Node.js** - Runtime environment
2. **Puppeteer** - Headless browser for JavaScript-rendered pages
3. **Cheerio** - Fast HTML parsing (for static pages)
4. **Axios** - HTTP requests
5. **Firebase Admin SDK** - Write scraped data to Firestore
6. **Node-cron** - Schedule scraping jobs

### Installation

```bash
npm init -y
npm install puppeteer cheerio axios firebase-admin node-cron
```

---

## Scraping Approaches

### Approach 1: Static HTML Scraping (Cheerio)

Best for: Simple, server-rendered pages

```javascript
const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeStaticPage(url) {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Parse event data
    const events = [];
    $('.event-item').each((i, elem) => {
        events.push({
            name: $(elem).find('.event-title').text(),
            date: $(elem).find('.event-date').text(),
            // ...more fields
        });
    });

    return events;
}
```

### Approach 2: Dynamic JavaScript Scraping (Puppeteer)

Best for: React/Vue/Angular apps, pages that load content via JavaScript

```javascript
const puppeteer = require('puppeteer');

async function scrapeDynamicPage(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for content to load
    await page.waitForSelector('.event-item');

    const events = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.event-item')).map(item => ({
            name: item.querySelector('.event-title')?.textContent,
            date: item.querySelector('.event-date')?.textContent,
            // ...more fields
        }));
    });

    await browser.close();
    return events;
}
```

### Approach 3: RSS/XML Feeds

Best for: Sites that provide RSS feeds

```javascript
const Parser = require('rss-parser');
const parser = new Parser();

async function scrapeRSSFeed(url) {
    const feed = await parser.parseURL(url);
    return feed.items.map(item => ({
        name: item.title,
        description: item.contentSnippet,
        date: item.pubDate,
        sourceUrl: item.link
    }));
}
```

---

## Scraper Architecture

### File Structure

```
scrapers/
├── SCRAPING-STRATEGY.md          # This file
├── package.json                   # Node.js dependencies
├── config.js                      # Configuration and Firebase setup
├── utils/
│   ├── firebase-admin.js         # Firebase Admin SDK setup
│   ├── deduplication.js          # Event deduplication logic
│   └── date-parser.js            # Parse various date formats
├── scrapers/
│   ├── ross-scraper.js           # Ross School scraper
│   ├── engineering-scraper.js    # CoE scraper
│   ├── maizepages-scraper.js     # MaizePages scraper
│   └── generic-scraper.js        # Template for new scrapers
└── index.js                       # Main orchestrator
```

---

## Scraper Template

Each scraper should follow this structure:

```javascript
// scrapers/example-scraper.js

const puppeteer = require('puppeteer');
const { saveEventToFirestore, isDuplicateEvent } = require('../utils/firebase-admin');
const { parseDate } = require('../utils/date-parser');

const SOURCE_CONFIG = {
    sourceId: 'example-source',
    name: 'Example Source',
    url: 'https://example.umich.edu/events',
    school: 'Example School'
};

async function scrapeExampleEvents() {
    console.log(`[${SOURCE_CONFIG.sourceId}] Starting scrape...`);

    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(SOURCE_CONFIG.url, { waitUntil: 'networkidle2' });

        // Wait for events to load
        await page.waitForSelector('.event-item', { timeout: 10000 });

        const events = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.event-item')).map(item => ({
                name: item.querySelector('.title')?.textContent?.trim(),
                description: item.querySelector('.description')?.textContent?.trim(),
                date: item.querySelector('.date')?.textContent?.trim(),
                time: item.querySelector('.time')?.textContent?.trim(),
                location: item.querySelector('.location')?.textContent?.trim(),
                registrationLink: item.querySelector('a')?.href,
                imageUrl: item.querySelector('img')?.src
            }));
        });

        await browser.close();

        // Process and save events
        let savedCount = 0;
        for (const event of events) {
            const processedEvent = await processEvent(event);
            if (processedEvent && !(await isDuplicateEvent(processedEvent))) {
                await saveEventToFirestore(processedEvent);
                savedCount++;
            }
        }

        console.log(`[${SOURCE_CONFIG.sourceId}] Scraped ${events.length} events, saved ${savedCount} new events`);
        return { success: true, total: events.length, saved: savedCount };

    } catch (error) {
        console.error(`[${SOURCE_CONFIG.sourceId}] Error:`, error);
        return { success: false, error: error.message };
    }
}

function processEvent(rawEvent) {
    // Validate required fields
    if (!rawEvent.name) {
        console.log('Skipping event with no name');
        return null;
    }

    // Parse date
    const parsedDate = parseDate(rawEvent.date);
    if (!parsedDate) {
        console.log(`Skipping event with invalid date: ${rawEvent.date}`);
        return null;
    }

    // Standardize event object
    return {
        name: rawEvent.name,
        description: rawEvent.description || '',
        shortDescription: rawEvent.description?.substring(0, 200) || '',
        date: parsedDate,
        time: rawEvent.time || '',
        location: rawEvent.location || '',
        locationType: rawEvent.location?.toLowerCase().includes('virtual') ? 'virtual' : 'physical',
        school: SOURCE_CONFIG.school,
        organization: SOURCE_CONFIG.name,
        category: detectCategories(rawEvent),
        registrationLink: rawEvent.registrationLink || '',
        imageUrl: rawEvent.imageUrl || '',
        sourceUrl: SOURCE_CONFIG.url,
        sourceId: SOURCE_CONFIG.sourceId,
        isActive: parsedDate > new Date(),
        tags: extractTags(rawEvent)
    };
}

function detectCategories(event) {
    const categories = [];
    const text = `${event.name} ${event.description}`.toLowerCase();

    if (text.match(/career|job|recruiting|internship|hiring/)) categories.push('career');
    if (text.match(/workshop|seminar|lecture|research/)) categories.push('academic');
    if (text.match(/networking|mixer|meetup/)) categories.push('networking');
    if (text.match(/startup|entrepreneur|pitch|venture/)) categories.push('entrepreneurship');
    if (text.match(/social|party|happy hour|celebration/)) categories.push('social');
    if (text.match(/cultural|diversity|heritage|international/)) categories.push('cultural');

    return categories.length > 0 ? categories : ['general'];
}

function extractTags(event) {
    // Extract relevant keywords as tags
    const text = `${event.name} ${event.description}`.toLowerCase();
    const tags = [];

    const keywords = ['AI', 'consulting', 'finance', 'tech', 'healthcare', 'sustainability'];
    keywords.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
            tags.push(keyword);
        }
    });

    return tags;
}

module.exports = {
    scrapeExampleEvents,
    SOURCE_CONFIG
};
```

---

## Deduplication Strategy

Events are considered duplicates if they match on:
1. Same event name (case-insensitive, normalized)
2. Same date
3. Same school/source

```javascript
// utils/deduplication.js

function normalizeString(str) {
    return str
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

async function isDuplicateEvent(newEvent) {
    const normalizedName = normalizeString(newEvent.name);

    const existingEvent = await db.collection('events')
        .where('school', '==', newEvent.school)
        .where('date', '==', newEvent.date)
        .get();

    for (const doc of existingEvent.docs) {
        const existing = doc.data();
        if (normalizeString(existing.name) === normalizedName) {
            return true;
        }
    }

    return false;
}
```

---

## Error Handling

### Retry Logic

```javascript
async function scrapeWithRetry(scrapeFn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await scrapeFn();
        } catch (error) {
            console.log(`Attempt ${i + 1} failed:`, error.message);
            if (i === maxRetries - 1) throw error;
            await sleep(2000 * (i + 1)); // Exponential backoff
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Logging

```javascript
const fs = require('fs');

function logScrapingResult(sourceId, result) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        sourceId,
        ...result
    };

    fs.appendFileSync(
        'scraping-logs.json',
        JSON.stringify(logEntry) + '\n'
    );
}
```

---

## Scheduling

### Using node-cron

```javascript
const cron = require('node-cron');

// Run all scrapers daily at 3 AM
cron.schedule('0 3 * * *', async () => {
    console.log('Starting daily scraping job...');
    await runAllScrapers();
});

// Run high-priority scrapers every 6 hours
cron.schedule('0 */6 * * *', async () => {
    console.log('Running priority scrapers...');
    await runPriorityScrapers();
});
```

---

## Best Practices

### 1. Rate Limiting

```javascript
async function scrapeWithRateLimit(urls, delayMs = 2000) {
    const results = [];
    for (const url of urls) {
        results.push(await scrapePage(url));
        await sleep(delayMs); // Wait between requests
    }
    return results;
}
```

### 2. User-Agent

Always use a descriptive User-Agent:

```javascript
const USER_AGENT = 'UMichEventsBot/1.0 (UMich Event Aggregator; contact@umich-events.com)';

await page.setUserAgent(USER_AGENT);
```

### 3. Respect robots.txt

Check `robots.txt` before scraping:

```javascript
const robotsParser = require('robots-parser');

async function canScrape(url) {
    const robotsTxt = await axios.get(`${new URL(url).origin}/robots.txt`);
    const robots = robotsParser(robotsTxt.data);
    return robots.isAllowed(url, USER_AGENT);
}
```

### 4. Handle Timeouts

```javascript
const page = await browser.newPage();
page.setDefaultTimeout(30000); // 30 seconds
page.setDefaultNavigationTimeout(30000);
```

---

## Testing

### Test Individual Scrapers

```javascript
// test-scraper.js
const { scrapeRossEvents } = require('./scrapers/ross-scraper');

(async () => {
    const result = await scrapeRossEvents();
    console.log('Scraping result:', result);
})();
```

---

## Deployment

### Option 1: Local/Server Cron

Run on a server or local machine with cron jobs.

### Option 2: Firebase Cloud Functions (Scheduled)

```javascript
// functions/index.js
const functions = require('firebase-functions');

exports.dailyScrape = functions.pubsub
    .schedule('0 3 * * *')
    .timeZone('America/Detroit')
    .onRun(async (context) => {
        await runAllScrapers();
        return null;
    });
```

### Option 3: AWS Lambda with EventBridge

Deploy scrapers as Lambda functions triggered by EventBridge schedules.

---

## Monitoring

### Update Source Status

```javascript
async function updateSourceStatus(sourceId, status) {
    await db.collection('sources').doc(sourceId).update({
        lastScraped: new Date(),
        lastSuccess: status.success,
        errorCount: status.success ? 0 : firebase.firestore.FieldValue.increment(1),
        errorMessage: status.error || '',
        updatedAt: new Date()
    });
}
```

---

## Legal & Ethical Considerations

1. **Respect Terms of Service** - Review each website's ToS
2. **Rate Limiting** - Don't overload servers (1-2 requests per second max)
3. **Public Data Only** - Only scrape publicly available event information
4. **User-Agent** - Identify your bot clearly
5. **Contact Info** - Provide way for webmasters to contact you
6. **Robots.txt** - Honor robots.txt directives
7. **FERPA Compliance** - Don't scrape or store personal student information

---

## Next Steps

1. Set up Firebase Admin SDK with service account
2. Create scrapers for high-priority sources (events.umich.edu, maizepages.umich.edu)
3. Test scrapers individually
4. Set up orchestrator to run all scrapers
5. Implement monitoring and alerting
6. Schedule automated daily runs

---

## Support

For questions or issues with scrapers, consult:
- [Puppeteer Documentation](https://pptr.dev/)
- [Cheerio Documentation](https://cheerio.js.org/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
