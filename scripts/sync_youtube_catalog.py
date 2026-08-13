import urllib.request
import re
import json
import os

url = "https://www.youtube.com/@PRJDEE/videos"
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG_PATH = os.path.join(BASE_DIR, "js", "catalog-data.js")

def get_video_metadata(vid):
    vurl = f"https://www.youtube.com/watch?v={vid}"
    req = urllib.request.Request(vurl, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8')
            
        title_match = re.search(r'<meta name="title" content="([^"]+)"', html) or re.search(r'<title>(.*?)</title>', html)
        date_match = re.search(r'<meta itemprop="uploadDate" content="([^"]+)"', html)
        
        full_title = title_match.group(1).replace(" - YouTube", "").strip() if title_match else "Project Dee Official Video"
        published_raw = date_match.group(1) if date_match else "2026-01-01"
        published = published_raw.split("T")[0]
        
        clean_title = full_title.split('#')[0].strip()
        if not clean_title:
            clean_title = full_title
            
        genre = "RELEASE"
        if "mix" in full_title.lower():
            genre = "MIX"
        elif "official" in full_title.lower() or "video" in full_title.lower():
            genre = "OFFICIAL"
        elif "short" in full_title.lower():
            genre = "SHORT"

        return {
            "id": vid,
            "title": clean_title,
            "full_title": full_title,
            "published": published,
            "thumb": f"https://img.youtube.com/vi/{vid}/hqdefault.jpg",
            "genre": genre
        }
    except Exception as e:
        print(f"Error fetching metadata for video {vid}: {e}")
        return None

def main():
    print("Scraping latest YouTube videos from @PRJDEE channel...")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8')
        video_ids = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html)
    except Exception as e:
        print(f"Error fetching YouTube channel page: {e}")
        return

    unique_vids = []
    for vid in video_ids:
        if vid not in unique_vids:
            unique_vids.append(vid)
            
    print(f"Found {len(unique_vids)} unique videos on channel. Processing top 20...")
    
    yt_catalog = []
    for idx, v in enumerate(unique_vids[:20]):
        meta = get_video_metadata(v)
        if meta:
            yt_catalog.append(meta)
            safe_title = meta['title'].encode('ascii', 'ignore').decode('ascii')
            print(f" #{idx+1:02d}: [{meta['id']}] {safe_title} ({meta['published']})")
            
    if not yt_catalog:
        print("No YouTube videos processed, keeping existing catalog.")
        return

    print(f"\nSuccessfully processed {len(yt_catalog)} YouTube videos!")
    
    # Update js/catalog-data.js dynamically
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        content = f.read()
        
    start_idx = content.find("const youtubeCatalog = [")
    if start_idx == -1:
        print("Could not find youtubeCatalog array in catalog-data.js!")
        return
        
    end_idx = content.find("];", start_idx) + 2
    
    new_yt_code = f"const youtubeCatalog = {json.dumps(yt_catalog, indent=4, ensure_ascii=False)};"
    updated_content = content[:start_idx] + new_yt_code + content[end_idx:]
    
    with open(CATALOG_PATH, "w", encoding="utf-8") as f:
        f.write(updated_content)
        
    print(f"\nUpdated youtubeCatalog dataset in {CATALOG_PATH}!")

if __name__ == "__main__":
    main()
