/**
 * Example Scraper Template
 *
 * This is a template for creating new scrapers for UMich event sources.
 * Copy this file and modify it for each new event source.
 *
 * Usage:
 * 1. Update SOURCE_CONFIG with your source details
 * 2. Modify scrapeEvents() to match the target website's structure
 * 3. Update processEvent() if needed for custom data processing
 * 4. Test with: node example-scraper.js
 */

const puppeteer = require('puppeteer');

// Source configuration
const SOURCE_CONFIG = {
    sourceId: 'example-source',
    name: 'Example Event Source',
    url: 'https://example.umich.edu/events',
    school: 'Example School',
    category: ['academic', 'networking'],
    scrapingMethod: 'puppeteer' // or 'cheerio' for static pages
};

/**
 * Main scraper function
 * Returns array of event objects
 */
async function scrapeEvents() {
    console.log(`[${SOURCE_CONFIG.sourceId}] Starting scrape...`);
    console.log(`[${SOURCE_CONFIG.sourceId}] URL: ${SOURCE_CONFIG.url}`);

    let browser;
    try {
        // Launch browser
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });

        const page = await browser.newPage();

        // Set user agent
        await page.setUserAgent(
            'UMichEventsBot/1.0 (UMich Event Aggregator; https://github.com/umich-events)'
        );

        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });

        // Navigate to page
        console.log(`[${SOURCE_CONFIG.sourceId}] Loading page...`);
        await page.goto(SOURCE_CONFIG.url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Wait for event elements to load
        // IMPORTANT: Update this selector to match your target website
        await page.waitForSelector('.event-item', { timeout: 10000 });

        // Extract event data
        console.log(`[${SOURCE_CONFIG.sourceId}] Extracting events...`);
        const rawEvents = await page.evaluate(() => {
            // IMPORTANT: Update these selectors to match your target website
            const eventElements = document.querySelectorAll('.event-item');

            return Array.from(eventElements).map(item => {
                return {
                    name: item.querySelector('.event-title')?.textContent?.trim() || '',
                    description: item.querySelector('.event-description')?.textContent?.trim() || '',
                    date: item.querySelector('.event-date')?.textContent?.trim() || '',
                    time: item.querySelector('.event-time')?.textContent?.trim() || '',
                    location: item.querySelector('.event-location')?.textContent?.trim() || '',
                    registrationLink: item.querySelector('.event-link')?.href || '',
                    imageUrl: item.querySelector('.event-image')?.src || ''
                };
            });
        });

        await browser.close();

        console.log(`[${SOURCE_CONFIG.sourceId}] Found ${rawEvents.length} raw events`);

        // Process events
        const processedEvents = rawEvents
            .map(event => processEvent(event))
            .filter(event => event !== null); // Remove invalid events

        console.log(`[${SOURCE_CONFIG.sourceId}] Processed ${processedEvents.length} valid events`);

        return {
            success: true,
            sourceId: SOURCE_CONFIG.sourceId,
            total: rawEvents.length,
            valid: processedEvents.length,
            events: processedEvents
        };

    } catch (error) {
        console.error(`[${SOURCE_CONFIG.sourceId}] Error:`, error.message);

        if (browser) {
            await browser.close();
        }

        return {
            success: false,
            sourceId: SOURCE_CONFIG.sourceId,
            error: error.message,
            events: []
        };
    }
}

/**
 * Process and validate individual event
 */
function processEvent(rawEvent) {
    // Validate required fields
    if (!rawEvent.name || rawEvent.name.length === 0) {
        console.log('Skipping event: missing name');
        return null;
    }

    // Parse date (basic example - you may need more sophisticated parsing)
    const parsedDate = parseDate(rawEvent.date);
    if (!parsedDate) {
        console.log(`Skipping event: invalid date - ${rawEvent.date}`);
        return null;
    }

    // Build standardized event object
    const event = {
        // Required fields
        name: cleanText(rawEvent.name),
        date: parsedDate,
        school: SOURCE_CONFIG.school,
        sourceId: SOURCE_CONFIG.sourceId,

        // Optional fields
        description: cleanText(rawEvent.description),
        shortDescription: cleanText(rawEvent.description).substring(0, 200),
        time: cleanText(rawEvent.time) || 'Time TBD',
        location: cleanText(rawEvent.location) || 'Location TBD',
        locationType: detectLocationType(rawEvent.location),
        organization: SOURCE_CONFIG.name,
        category: detectCategories(rawEvent),
        registrationLink: rawEvent.registrationLink || '',
        imageUrl: rawEvent.imageUrl || '',
        sourceUrl: SOURCE_CONFIG.url,
        isActive: parsedDate > new Date(),
        tags: extractTags(rawEvent),

        // Metadata
        createdAt: new Date(),
        updatedAt: new Date()
    };

    return event;
}

/**
 * Parse date string to Date object
 * You may need to customize this for different date formats
 */
function parseDate(dateString) {
    if (!dateString) return null;

    try {
        // Try standard JavaScript date parsing first
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date;
        }

        // Add custom date parsing logic here if needed
        // Example: "Monday, Jan 15, 2025" or "01/15/2025"

        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Detect location type (physical, virtual, hybrid)
 */
function detectLocationType(location) {
    if (!location) return 'physical';

    const locationLower = location.toLowerCase();

    if (locationLower.includes('zoom') ||
        locationLower.includes('virtual') ||
        locationLower.includes('online') ||
        locationLower.includes('webinar') ||
        locationLower.includes('teams')) {
        return 'virtual';
    }

    if (locationLower.includes('hybrid')) {
        return 'hybrid';
    }

    return 'physical';
}

/**
 * Detect event categories based on keywords
 */
function detectCategories(event) {
    const categories = [];
    const text = `${event.name} ${event.description}`.toLowerCase();

    // Career-related keywords
    if (text.match(/career|job|recruiting|internship|hiring|employer|resume|interview/)) {
        categories.push('career');
    }

    // Academic keywords
    if (text.match(/workshop|seminar|lecture|research|conference|symposium|presentation/)) {
        categories.push('academic');
    }

    // Networking keywords
    if (text.match(/networking|mixer|meetup|meet and greet|coffee chat/)) {
        categories.push('networking');
    }

    // Entrepreneurship keywords
    if (text.match(/startup|entrepreneur|pitch|venture|founder|innovation|business plan/)) {
        categories.push('entrepreneurship');
    }

    // Social keywords
    if (text.match(/social|party|celebration|happy hour|gala|reception/)) {
        categories.push('social');
    }

    // Cultural keywords
    if (text.match(/cultural|diversity|heritage|international|multicultural/)) {
        categories.push('cultural');
    }

    // Sports keywords
    if (text.match(/sports|athletic|game|tournament|competition|intramural/)) {
        categories.push('sports');
    }

    // Default category if none detected
    return categories.length > 0 ? categories : ['general'];
}

/**
 * Extract relevant tags from event
 */
function extractTags(event) {
    const tags = [];
    const text = `${event.name} ${event.description}`.toLowerCase();

    // Common keywords to tag
    const keywords = [
        'AI', 'artificial intelligence', 'machine learning',
        'consulting', 'strategy',
        'finance', 'investment', 'banking',
        'tech', 'technology', 'software',
        'healthcare', 'medical',
        'sustainability', 'environment', 'climate',
        'diversity', 'equity', 'inclusion',
        'leadership', 'management'
    ];

    keywords.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
            tags.push(keyword);
        }
    });

    return [...new Set(tags)]; // Remove duplicates
}

/**
 * Clean and normalize text
 */
function cleanText(text) {
    if (!text) return '';

    return text
        .trim()
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n+/g, '\n'); // Replace multiple newlines with single newline
}

/**
 * Run scraper (for testing)
 */
if (require.main === module) {
    (async () => {
        console.log('=== Running Example Scraper ===\n');

        const result = await scrapeEvents();

        console.log('\n=== Scraping Results ===');
        console.log('Success:', result.success);
        console.log('Total events found:', result.total);
        console.log('Valid events:', result.valid);

        if (result.events && result.events.length > 0) {
            console.log('\n=== Sample Event ===');
            console.log(JSON.stringify(result.events[0], null, 2));
        }

        if (result.error) {
            console.error('\nError:', result.error);
        }
    })();
}

module.exports = {
    scrapeEvents,
    SOURCE_CONFIG
};
