import urllib.request
import re
import json
import xml.etree.ElementTree as ET
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEWS_DATA_PATH = os.path.join(BASE_DIR, "js", "news-data.js")

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

RSS_FEEDS = [
    'https://dancingastronaut.com/feed/',
    'https://edm.com/.rss/full/'
]

def clean_html(text):
    if not text:
        return ""
    clean = re.sub(r'<[^>]+>', '', text)
    clean = clean.replace('&nbsp;', ' ').replace('&#8217;', "'").replace('&#8220;', '"').replace('&#8221;', '"')
    return clean.strip()

def fetch_rss_articles():
    articles = []
    art_id = 1
    
    for feed_url in RSS_FEEDS:
        try:
            req = urllib.request.Request(feed_url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                xml_data = resp.read()
                root = ET.fromstring(xml_data)
                
                channel = root.find('channel')
                if channel is None:
                    continue
                    
                items = channel.findall('item')
                for item in items[:4]:
                    title = item.findtext('title') or ""
                    link = item.findtext('link') or ""
                    pub_date = item.findtext('pubDate') or ""
                    desc = item.findtext('description') or ""
                    
                    clean_desc = clean_html(desc)[:220]
                    if len(clean_desc) == 220:
                        clean_desc += "..."
                        
                    # Format date
                    date_formatted = pub_date[:16] if pub_date else "Latest"
                    
                    # Category default
                    category = "RELEASE"
                    if "tech" in title.lower() or "gear" in title.lower():
                        category = "TECH"
                    elif "trend" in title.lower() or "festival" in title.lower():
                        category = "TRENDS"
                    elif "culture" in title.lower():
                        category = "CULTURE"
                        
                    img_url = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop"
                    
                    articles.append({
                        "id": art_id,
                        "category": category,
                        "date": date_formatted,
                        "image": img_url,
                        "link": link,
                        "title_it": title,
                        "summary_it": clean_desc,
                        "content_it": clean_desc,
                        "title_en": title,
                        "summary_en": clean_desc,
                        "content_en": clean_desc,
                        "title_es": title,
                        "summary_es": clean_desc,
                        "content_es": clean_desc,
                        "title_fr": title,
                        "summary_fr": clean_desc,
                        "content_fr": clean_desc,
                        "title_de": title,
                        "summary_de": clean_desc,
                        "content_de": clean_desc
                    })
                    art_id += 1
        except Exception as e:
            print(f"Note fetching feed {feed_url}: {e}")
            
    return articles

def update_news_file():
    articles = fetch_rss_articles()
    if not articles:
        print("No new RSS articles fetched, keeping existing newsData.")
        return
        
    print(f"Successfully fetched {len(articles)} fresh RSS articles.")
    js_content = f"const newsData = {json.dumps(articles, indent=2)};\n"
    
    with open(NEWS_DATA_PATH, "w", encoding="utf-8") as f:
        f.write(js_content)
        
    print(f"Updated {NEWS_DATA_PATH} with {len(articles)} fresh articles.")

if __name__ == "__main__":
    update_news_file()
