import os
import json
import urllib.request
import re
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_PATH = os.path.join(BASE_DIR, "js", "reviews-data.js")

FALLBACK_CLIENT_ID = "Pb72ranhoyt6gw7hM7TkzUItXlMWSNSo"
USER_ID = "1575093459"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}

BLACKLIST_AUTHORS = [
    "matteo girardi",
    "mathew turns",
    "project dee",
    "project_d2025",
    "prjdee"
]

def is_blacklisted(author, username, full_name):
    combined = f"{author} {username} {full_name}".lower()
    return any(b in combined for b in BLACKLIST_AUTHORS)

def get_dynamic_client_id():
    try:
        req = urllib.request.Request("https://soundcloud.com", headers=HEADERS)
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
        matches = re.findall(r'<script[^>]+src="(https://a-v2\.sndcdn\.com/assets/[^"]+\.js)"', html)
        for s_url in reversed(matches):
            try:
                s_req = urllib.request.Request(s_url, headers=HEADERS)
                with urllib.request.urlopen(s_req, context=ctx, timeout=5) as s_resp:
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

def fetch_json(url):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def sync_comments():
    client_id = get_dynamic_client_id()
    print(f"Fetching tracks for User ID: {USER_ID} from SoundCloud using client_id {client_id[:6]}...")
    tracks_url = f"https://api-v2.soundcloud.com/users/{USER_ID}/tracks?client_id={client_id}&limit=30"
    data = fetch_json(tracks_url)
    if not data or "collection" not in data:
        print("Failed to fetch tracks collection.")
        return

    tracks = data["collection"]
    print(f"Found {len(tracks)} tracks.")

    track_reviews_map = {}
    review_id = 1

    for t in tracks:
        comment_count = t.get("comment_count", 0)
        track_id = t.get("id")
        track_title = t.get("title", "")
        track_url = t.get("permalink_url", "")
        track_thumb = t.get("artwork_url", "")
        if track_thumb:
            track_thumb = track_thumb.replace("-large", "-t500x500")

        if comment_count > 0 and track_id:
            comm_url = f"https://api-v2.soundcloud.com/tracks/{track_id}/comments?threaded=0&filter_replies=0&client_id={client_id}&limit=40&offset=0"
            cdata = fetch_json(comm_url)
            if cdata and "collection" in cdata:
                track_reviews = []
                for c in cdata["collection"]:
                    body = (c.get("body") or "").strip()
                    user = c.get("user") or {}
                    username = (user.get("username") or "").strip()
                    full_name = (user.get("full_name") or "").strip()
                    avatar = user.get("avatar_url") or "https://a-v2.sndcdn.com/assets/images/default/avatar.png"
                    created_at = c.get("created_at") or "2026-09-01"
                    date_str = created_at.split("T")[0] if "T" in created_at else created_at

                    display_name = full_name if full_name and len(full_name) > 2 else username

                    # Blacklist check
                    if is_blacklisted(display_name, username, full_name):
                        continue

                    # Filter out spam / short text
                    if len(body) >= 4 and not any(kw in body.lower() for kw in ["http", "bit.ly", "repostexchange", "download", "free followers"]):
                        track_reviews.append({
                            "id": review_id,
                            "author": display_name,
                            "username": username,
                            "avatar": avatar,
                            "comment": body,
                            "trackTitle": track_title,
                            "trackUrl": track_url,
                            "trackThumb": track_thumb,
                            "date": date_str
                        })
                        review_id += 1
                if track_reviews:
                    track_reviews_map[track_title] = track_reviews

    final_reviews = []
    track_titles = list(track_reviews_map.keys())
    max_per_track = 4

    for i in range(max_per_track):
        for title in track_titles:
            reviews_list = track_reviews_map[title]
            if i < len(reviews_list):
                final_reviews.append(reviews_list[i])

    for idx, r in enumerate(final_reviews):
        r["id"] = idx + 1

    print(f"Total diverse reviews compiled: {len(final_reviews)} across {len(track_titles)} tracks.")

    file_content = "// Automatically curated fan & DJ reviews from SoundCloud\nconst communityReviews = " + json.dumps(final_reviews, indent=4, ensure_ascii=False) + ";\n"
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(file_content)

    print(f"Successfully saved {len(final_reviews)} curated reviews to {OUTPUT_PATH}")

if __name__ == "__main__":
    sync_comments()
