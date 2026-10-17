const https = require('https');
const fs = require('fs');
const path = require('path');

const FALLBACK_CLIENT_ID = 'Pb72ranhoyt6gw7hM7TkzUItXlMWSNSo';
const userId = '1575093459';

const BASE_DIR = path.dirname(__dirname);
const OUTPUT_PATH = path.join(BASE_DIR, 'js', 'reviews-data.js');

const BLACKLIST_AUTHORS = [
    'matteo girardi',
    'mathew turns',
    'project dee',
    'project_d2025',
    'prjdee',
    'digital bloom',
    'digital-bloom',
    'digital-bloom-435854876'
];

const BANNED_CONTENT = [
    'http',
    'bit.ly',
    'repostexchange',
    'download',
    'free followers',
    'slop',
    'ai slop',
    'digital bloom',
    'digital-bloom',
    'puzza',
    'fake music',
    'pure ai',
    'ai generated',
    'ai junk',
    'ai garbage',
    'just ai',
    'scam',
    'bot account'
];

function isBannedContent(body) {
    const lower = (body || '').toLowerCase();
    return BANNED_CONTENT.some(kw => lower.includes(kw));
}

function fetchUrl(url) {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        }).on('error', () => resolve(null));
    });
}

async function getDynamicClientId() {
    try {
        console.log('Resolving dynamic SoundCloud Client ID from soundcloud.com...');
        const html = await fetchUrl('https://soundcloud.com');
        if (html) {
            const regex = /<script[^>]+src="([^"]+)"/g;
            let match;
            const scriptUrls = [];
            while ((match = regex.exec(html)) !== null) {
                if (match[1].includes('sndcdn.com/assets/')) {
                    scriptUrls.push(match[1]);
                }
            }
            for (let i = scriptUrls.length - 1; i >= 0; i--) {
                const js = await fetchUrl(scriptUrls[i]);
                if (js) {
                    const idMatch = js.match(/client_id[:=]"([a-zA-Z0-9]{32})"/);
                    if (idMatch) {
                        console.log('Found dynamic client_id: ' + idMatch[1]);
                        return idMatch[1];
                    }
                }
            }
        }
    } catch (e) {
        console.log('Error resolving dynamic client ID:', e.message);
    }
    console.log('Using fallback client_id: ' + FALLBACK_CLIENT_ID);
    return FALLBACK_CLIENT_ID;
}

function fetchJson(url) {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch(e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

function isBlacklisted(author, username, fullName) {
    const combined = `${author} ${username} ${fullName}`.toLowerCase();
    return BLACKLIST_AUTHORS.some(b => combined.includes(b));
}

async function syncComments() {
    const clientId = await getDynamicClientId();
    console.log('Fetching SoundCloud tracks for User ID: ' + userId);
    const tracksUrl = `https://api-v2.soundcloud.com/users/${userId}/tracks?client_id=${clientId}&limit=30`;
    const trackData = await fetchJson(tracksUrl);
    if (!trackData || !trackData.collection) {
        console.log('Error fetching tracks from SoundCloud API');
        return;
    }

    const tracks = trackData.collection;
    console.log('Found ' + tracks.length + ' tracks on profile.');

    const trackReviewsMap = {};
    let reviewId = 1;

    for (const t of tracks) {
        if (t.comment_count > 0) {
            console.log(`Extracting comments for track: ${t.title} (${t.comment_count} total)...`);
            const commUrl = `https://api-v2.soundcloud.com/tracks/${t.id}/comments?threaded=0&filter_replies=0&client_id=${clientId}&limit=40&offset=0`;
            const commData = await fetchJson(commUrl);
            
            if (commData && commData.collection) {
                const trackReviews = [];
                for (const c of commData.collection) {
                    const text = (c.body || '').trim();
                    const username = c.user ? (c.user.username || '').trim() : '';
                    const fullName = c.user ? (c.user.full_name || '').trim() : '';
                    const avatar = c.user && c.user.avatar_url ? c.user.avatar_url : 'https://a-v2.sndcdn.com/assets/images/default/avatar.png';

                    const displayName = fullName && fullName.length > 2 ? fullName : username;

                    // Blacklist check (no matteo girardi / dummy accounts / trolls)
                    if (isBlacklisted(displayName, username, fullName)) {
                        console.log(`Skipping blacklisted author: ${displayName} (${username})`);
                        continue;
                    }

                    // Quality check: filter out spam, banned phrases, low-effort banalities
                    if (text.length >= 4 && !isBannedContent(text)) {
                        trackReviews.push({
                            id: reviewId++,
                            author: displayName,
                            username: username,
                            avatar: avatar,
                            comment: text,
                            trackTitle: t.title,
                            trackUrl: t.permalink_url,
                            trackThumb: t.artwork_url ? t.artwork_url.replace('-large', '-t500x500') : (t.user ? t.user.avatar_url : ''),
                            date: c.created_at ? c.created_at.split('T')[0] : '2026-09-01'
                        });
                    } else if (isBannedContent(text)) {
                        console.log(`Filtered out banned/banal comment from ${displayName}: ${text.substring(0, 40)}`);
                    }
                }
                if (trackReviews.length > 0) {
                    trackReviewsMap[t.title] = trackReviews;
                }
            }
        }
    }

    // Interleave reviews across tracks so every track is represented fairly
    const finalReviews = [];
    const trackTitles = Object.keys(trackReviewsMap);
    const maxPerTrack = 4; // Up to 4 top reviews per track

    for (let i = 0; i < maxPerTrack; i++) {
        for (const title of trackTitles) {
            const list = trackReviewsMap[title];
            if (list && list[i]) {
                finalReviews.push(list[i]);
            }
        }
    }

    // Re-index IDs
    finalReviews.forEach((r, idx) => {
        r.id = idx + 1;
    });

    console.log(`Total diverse reviews compiled: ${finalReviews.length} across ${trackTitles.length} tracks.`);
    console.log('Tracks included:', trackTitles);

    const fileContent = '// Automatically curated fan & DJ reviews from SoundCloud\nconst communityReviews = ' + JSON.stringify(finalReviews, null, 4) + ';\n';
    fs.writeFileSync(OUTPUT_PATH, fileContent, 'utf-8');
    console.log('Saved reviews dataset to ' + OUTPUT_PATH);
}

syncComments();
