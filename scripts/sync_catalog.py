import os
import json
import re
import urllib.request
import urllib.error

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COVERS_DIR = os.path.join(BASE_DIR, "assets", "covers")
CATALOG_PATH = os.path.join(BASE_DIR, "js", "catalog-data.js")

os.makedirs(COVERS_DIR, exist_ok=True)

FALLBACK_CLIENT_ID = "Pb72ranhoyt6gw7hM7TkzUItXlMWSNSo"

def get_dynamic_client_id():
    try:
        req = urllib.request.Request("https://soundcloud.com", headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
        matches = re.findall(r'<script[^>]+src="(https://a-v2\.sndcdn\.com/assets/[^"]+\.js)"', html)
        for s_url in reversed(matches):
            try:
                s_req = urllib.request.Request(s_url, headers=headers)
                with urllib.request.urlopen(s_req, timeout=5) as s_resp:
                    js_code = s_resp.read().decode("utf-8", errors="ignore")
                cid = re.search(r'client_id[:=]"([a-zA-Z0-9]{32})"', js_code)
                if cid:
                    print(f"Discovered dynamic SoundCloud Client ID: {cid.group(1)}")
                    return cid.group(1)
            except Exception:
                continue
    except Exception as e:
        print(f"Notice: Dynamic client_id resolution fallback: {e}")
    return FALLBACK_CLIENT_ID

def fetch_soundcloud_tracks():
    client_id = get_dynamic_client_id()
    user_id = "1575093459"
    tracks_url = f"https://api-v2.soundcloud.com/users/{user_id}/tracks?client_id={client_id}&limit=30"
    
    try:
        req = urllib.request.Request(tracks_url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            t_data = json.loads(resp.read().decode('utf-8'))
            collection = t_data.get('collection', [])
            print(f"Fetched {len(collection)} tracks from SoundCloud API")
            return collection
    except Exception as e:
        print(f"Error fetching SoundCloud API: {e}")
        return []

def get_track_og_image(sc_url):
    try:
        req = urllib.request.Request(sc_url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode('utf-8')
        match = re.search(r'<meta property="og:image" content="([^"]+)"', html)
        if match:
            return match.group(1).replace('-large', '-t500x500').replace('-original', '-t500x500')
    except Exception as e:
        print(f"Error fetching og:image for {sc_url}: {e}")
    return None

def download_cover_image(img_url, filename):
    local_path = os.path.join(COVERS_DIR, filename)
    try:
        req = urllib.request.Request(img_url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            img_bytes = resp.read()
            with open(local_path, 'wb') as f:
                f.write(img_bytes)
            print(f"Downloaded cover image {filename}")
    except Exception as e:
        print(f"Error downloading image {filename}: {e}")

def main():
    print("Starting automated catalog sync...")
    collection = fetch_soundcloud_tracks()
    if not collection:
        print("No tracks fetched. Exiting.")
        return

    # YouTube known links map
    yt_mapping = {
        "The Grid": "https://www.youtube.com/watch?v=FVJ_vvxKILo",
        "Come To Dubai (Original Mix)": "https://www.youtube.com/watch?v=zmMbdhg6nn0",
        "Honey and the Tide": "https://www.youtube.com/watch?v=5qegZ_NBvqI",
        "Angel of Light": "https://www.youtube.com/watch?v=jWlCvzgN_xE",
        "C60": "https://www.youtube.com/watch?v=NiGySiGy6ik",
        "The Pressure": "https://www.youtube.com/watch?v=SVN03CZMGJg",
        "The Space Between (Pure Extended Mix)": "https://www.youtube.com/watch?v=t5J5_J1qHq0",
    }

    sc_catalog = []

    for idx, track in enumerate(collection[:20]):
        title = track.get('title')
        sc_url = track.get('permalink_url')
        permalink = track.get('permalink') or f"track-{idx+1}"
        published = track.get('created_at', '').split('T')[0]
        genre = track.get('genre') or 'Official Track'
        
        if 'techno' in genre.lower():
            genre = 'Melodic Techno' if 'melodic' in genre.lower() else 'Peak Techno'
        elif 'house' in genre.lower():
            genre = 'Progressive House' if 'progressive' in genre.lower() else 'Deep House'
        elif not genre or genre == 'Official Track':
            genre = 'EDM / Dance'

        filename = f"sc-{permalink}.jpg"
        artwork_url = track.get('artwork_url')
        img_url = None
        if artwork_url:
            img_url = artwork_url.replace('-large', '-t500x500').replace('-original', '-t500x500')
        else:
            img_url = get_track_og_image(sc_url)
            
        if img_url:
            download_cover_image(img_url, filename)
        
        # Explicit Title-to-Artwork Mapping to ensure zero mismatches
        title_artwork_map = {
            "Threshold": "https://raw.githubusercontent.com/prjdee/project-dee/main/assets/covers/sc-threshold.jpg",
            "Before The Floor Shakes": "https://raw.githubusercontent.com/prjdee/project-dee/main/assets/covers/sc-cover-01.jpg",
            "Catch the Sun": "https://raw.githubusercontent.com/prjdee/project-dee/main/assets/covers/sc-cover-02.jpg",
            "The Grid": "https://raw.githubusercontent.com/prjdee/project-dee/main/assets/covers/sc-cover-03.jpg",
            "Come To Dubai (Original Mix)": "https://raw.githubusercontent.com/prjdee/project-dee/main/assets/covers/sc-cover-04.jpg",
            "Honey and the Tide": "https://raw.githubusercontent.com/prjdee/project-dee/main/assets/covers/sc-cover-05.jpg",
            "Angel of Light": "https://raw.githubusercontent.com/prjdee/project-dee/main/assets/covers/sc-cover-06.jpg",
            "Silver Light": "https://raw.githubusercontent.com/prjdee/project-dee/main/assets/covers/sc-cover-07.jpg",
            "C60": "https://raw.githubusercontent.com/prjdee/project-dee/main/assets/covers/sc-cover-08.jpg",
            "The Weight of Light": "https://raw.githubusercontent.com/prjdee/project-dee/main/assets/covers/sc-cover-09.jpg",
        }

        thumb_url = title_artwork_map.get(title, f"https://raw.githubusercontent.com/prjdee/project-dee/main/assets/covers/{filename}")
        yt_url = yt_mapping.get(title, None)

        # Assign exact stream ID for waveform engine
        yt_stream_id = None
        if "Dubai" in title or "Catch" in title:
            yt_stream_id = "zmMbdhg6nn0"
        elif "Grid" in title:
            yt_stream_id = "FVJ_vvxKILo"
        elif "Angel" in title:
            yt_stream_id = "jWlCvzgN_xE"
        elif "C60" in title or "Silver" in title:
            yt_stream_id = "NiGySiGy6ik"

        sc_catalog.append({
            "id": yt_stream_id,
            "title": title,
            "sc_url": sc_url,
            "yt_url": yt_url,
            "published": published,
            "thumb": thumb_url,
            "genre": genre
        })

    youtube_data = [
        {
            "id": "5qegZ_NBvqI",
            "title": "Honey and the Tide",
            "full_title": "Honey and the Tide #deephouse #melodictechno #ethnoedm #organichouse  #anjunadeep #afterlife",
            "published": "2026-07-31",
            "thumb": "https://img.youtube.com/vi/5qegZ_NBvqI/hqdefault.jpg",
            "genre": "OFFICIAL"
        },
        {
            "id": "zmMbdhg6nn0",
            "title": "Come to Dubai  (Habibi)",
            "full_title": "Come to Dubai  (Habibi) #dubailife #dubaimarinabeach #mydubai #dancemusic #dubainightlife #dubai",
            "published": "2026-07-18",
            "thumb": "https://img.youtube.com/vi/zmMbdhg6nn0/hqdefault.jpg",
            "genre": "RELEASE"
        },
        {
            "id": "FVJ_vvxKILo",
            "title": "THE GRID (Mix)",
            "full_title": "THE GRID (Mix) #edm  #technomusic  #technodance  #dance2026  #summer2026  ‪@prjdee‬",
            "published": "2026-06-30",
            "thumb": "https://img.youtube.com/vi/FVJ_vvxKILo/hqdefault.jpg",
            "genre": "MIX"
        },
        {
            "id": "jWlCvzgN_xE",
            "title": "🌅 Angel of Light",
            "full_title": "🌅 Angel of Light #progressivehouse #edm #newmusic #nordicvibes #prjdee",
            "published": "2026-06-01",
            "thumb": "https://img.youtube.com/vi/jWlCvzgN_xE/hqdefault.jpg",
            "genre": "RELEASE"
        },
        {
            "id": "NiGySiGy6ik",
            "title": "C60 -",
            "full_title": "C60 - #popitaliano #urbanpop @prjdee",
            "published": "2026-05-03",
            "thumb": "https://img.youtube.com/vi/NiGySiGy6ik/hqdefault.jpg",
            "genre": "RELEASE"
        },
        {
            "id": "SVN03CZMGJg",
            "title": "The Pressure",
            "full_title": "The Pressure #shorts",
            "published": "2026-04-25",
            "thumb": "https://img.youtube.com/vi/SVN03CZMGJg/hqdefault.jpg",
            "genre": "RELEASE"
        },
        {
            "id": "t5J5_J1qHq0",
            "title": "The Space Between (Pure Extended Mix)",
            "full_title": "The Space Between (Pure Extended Mix) #edm #prjdee",
            "published": "2026-02-16",
            "thumb": "https://img.youtube.com/vi/t5J5_J1qHq0/hqdefault.jpg",
            "genre": "RELEASE"
        }
    ]

    new_content = f"""// Automatically generated SoundCloud & YouTube catalog datasets
const soundCloudCatalog = {json.dumps(sc_catalog, indent=4, ensure_ascii=False)};

const youtubeCatalog = {json.dumps(youtube_data, indent=4, ensure_ascii=False)};

const catalogVideos = soundCloudCatalog;
"""

    with open(CATALOG_PATH, "w", encoding="utf-8") as f:
        f.write(new_content)

    print("Catalog sync finished successfully!")

    # Automatically sync SoundCloud community follower comments as well
    try:
        from sync_soundcloud_comments import sync_comments
        print("Starting synchronized follower comments update...")
        sync_comments()
    except Exception as e:
        print(f"Notice: sync_soundcloud_comments execution: {e}")

    # Stage reviews-data.js in git so the workflow commits both catalog and reviews
    try:
        import subprocess
        subprocess.run(["git", "add", "js/reviews-data.js"], check=False)
        print("Staged js/reviews-data.js for daily git commit.")
    except Exception as e:
        print(f"Notice: git staging: {e}")

if __name__ == "__main__":
    main()
