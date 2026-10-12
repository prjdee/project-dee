import urllib.request
import urllib.parse
import re
import json
import xml.etree.ElementTree as ET
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEWS_DATA_PATH = os.path.join(BASE_DIR, "js", "news-data.js")
NEWS_JSON_PATH = os.path.join(BASE_DIR, "data", "news.json")

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

# The top 4 active, globally & European renowned EDM / Electronic Music RSS feeds
FEEDS = [
    {
        "name": "DJ Mag",
        "url": "https://djmag.com/rss.xml",
        "default_cat": "CULTURE"
    },
    {
        "name": "We Rave You",
        "url": "https://weraveyou.com/feed/",
        "default_cat": "RELEASE"
    },
    {
        "name": "Attack Magazine",
        "url": "https://www.attackmagazine.com/feed/",
        "default_cat": "TECH"
    },
    {
        "name": "Dancing Astronaut",
        "url": "https://dancingastronaut.com/feed/",
        "default_cat": "TRENDS"
    }
]

CATEGORY_FALLBACK_IMAGES = {
    "RELEASE": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop",
    "TRENDS": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop",
    "CULTURE": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop",
    "TECH": "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800&auto=format&fit=crop"
}

def clean_html(text):
    if not text:
        return ""
    # Strip HTML tags
    clean = re.sub(r'<[^>]+>', '', text)
    # Decode common HTML entities
    clean = clean.replace('&nbsp;', ' ').replace('&#8217;', "'").replace('&#8220;', '"').replace('&#8221;', '"')
    clean = clean.replace('&amp;', '&').replace('&#038;', '&').replace('&quot;', '"').replace('&#8211;', '-')
    return re.sub(r'\s+', ' ', clean).strip()

def translate_text(text, target_lang='it'):
    """Translates text using Google Translate public endpoint with safe fallback."""
    if not text or target_lang == 'en':
        return text
    try:
        query = urllib.parse.quote(text[:300]) # Cap query size for URL safety
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={target_lang}&dt=t&q={query}"
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            translated = ''.join([part[0] for part in data[0] if part[0]])
            return translated if translated else text
    except Exception:
        return text

def detect_category(title, desc, default_cat):
    combined = (title + " " + desc).lower()
    if any(k in combined for k in ['synth', 'vst', 'daw', 'plugin', 'gear', 'ableton', 'fl studio', 'hardware', 'modular', 'production', 'stem', 'mastering', 'beatport indie tech']):
        return "TECH"
    if any(k in combined for k in ['remix', 'album', 'single', 'ep', 'out now', 'track', 'drop', 'new release', 'stream', 'deluxe', 'debut']):
        return "RELEASE"
    if any(k in combined for k in ['festival', 'tomorrowland', 'ade', 'lineup', 'amsterdam', 'ultra', 'trend', 'ticket', 'stage']):
        return "TRENDS"
    if any(k in combined for k in ['club', 'history', 'nightlife', 'anniversary', 'interview', 'tribute', 'scene', 'culture', 'rave']):
        return "CULTURE"
    return default_cat

def extract_image(item, desc, category):
    # 1. Check enclosure tag
    enclosure = item.find('enclosure')
    if enclosure is not None and enclosure.get('url'):
        return enclosure.get('url')
        
    # 2. Check media:content or media:thumbnail
    for elem in item:
        if 'content' in elem.tag or 'thumbnail' in elem.tag:
            url = elem.get('url')
            if url:
                return url

    # 3. Check <img> tag inside description or content
    match = re.search(r'<img[^>]+src=["\']([^"\']+\.(?:jpg|jpeg|png|webp)[^"\']*)["\']', desc, re.IGNORECASE)
    if match:
        return match.group(1).replace('&amp;', '&')

    # 4. Fallback high-res Unsplash image for this genre category
    return CATEGORY_FALLBACK_IMAGES.get(category, CATEGORY_FALLBACK_IMAGES["RELEASE"])

def fetch_all_articles():
    all_articles = []
    art_id = 1

    for feed_info in FEEDS:
        feed_name = feed_info["name"]
        feed_url = feed_info["url"]
        default_cat = feed_info["default_cat"]

        print(f"Fetching from {feed_name} ({feed_url})...")
        try:
            req = urllib.request.Request(feed_url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=10) as resp:
                xml_data = resp.read()
                root = ET.fromstring(xml_data)

                items = root.findall('.//item')
                # Take top 3-4 items from each top publisher to ensure high freshness and variety
                for item in items[:3]:
                    title_en = clean_html(item.findtext('title') or "")
                    link = (item.findtext('link') or "").strip()
                    pub_date = (item.findtext('pubDate') or "")[:16]
                    raw_desc = item.findtext('description') or ""
                    clean_desc_en = clean_html(raw_desc)[:200]
                    if len(clean_desc_en) == 200:
                        clean_desc_en += "..."

                    if not title_en or not link:
                        continue

                    category = detect_category(title_en, clean_desc_en, default_cat)
                    img_url = extract_image(item, raw_desc, category)

                    # Multi-language translations with English fallback
                    print(f"  -> Translating: '{title_en[:40]}...'")
                    title_it = translate_text(title_en, 'it')
                    summary_it = translate_text(clean_desc_en, 'it')

                    title_es = translate_text(title_en, 'es')
                    summary_es = translate_text(clean_desc_en, 'es')

                    title_fr = translate_text(title_en, 'fr')
                    summary_fr = translate_text(clean_desc_en, 'fr')

                    title_de = translate_text(title_en, 'de')
                    summary_de = translate_text(clean_desc_en, 'de')

                    all_articles.append({
                        "id": art_id,
                        "category": category,
                        "date": pub_date if pub_date else "Latest",
                        "image": img_url,
                        "link": link,
                        "title_it": title_it,
                        "summary_it": summary_it,
                        "content_it": summary_it,
                        "title_en": title_en,
                        "summary_en": clean_desc_en,
                        "content_en": clean_desc_en,
                        "title_es": title_es,
                        "summary_es": summary_es,
                        "content_es": summary_es,
                        "title_fr": title_fr,
                        "summary_fr": summary_fr,
                        "content_fr": summary_fr,
                        "title_de": title_de,
                        "summary_de": summary_de,
                        "content_de": summary_de
                    })
                    art_id += 1

        except Exception as e:
            print(f"Error fetching {feed_name}: {e}")

    return all_articles

def update_news():
    articles = fetch_all_articles()
    if not articles:
        print("No articles fetched, keeping existing news.")
        return False

    print(f"\nTotal articles compiled: {len(articles)}")

    # 1. Write to js/news-data.js
    js_content = f"const newsData = {json.dumps(articles, indent=2, ensure_ascii=False)};\n"
    with open(NEWS_DATA_PATH, "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f"Saved: {NEWS_DATA_PATH}")

    # 2. Write to data/news.json
    os.makedirs(os.path.dirname(NEWS_JSON_PATH), exist_ok=True)
    with open(NEWS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)
    print(f"Saved: {NEWS_JSON_PATH}")

    return True

if __name__ == "__main__":
    update_news()
