import os
import json
import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_PATH = os.path.join(BASE_DIR, "js", "reviews-data.js")

CLIENT_ID = "sUn5toeW5d8MC2jOLpE2yAibTG7RRYsA"
USER_ID = "1575093459"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

def fetch_json(url):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def sync_comments():
    print(f"Fetching tracks for User ID: {USER_ID} from SoundCloud...")
    tracks_url = f"https://api-v2.soundcloud.com/users/{USER_ID}/tracks?client_id={CLIENT_ID}&limit=30"
    data = fetch_json(tracks_url)
    if not data or "collection" not in data:
        print("Failed to fetch tracks collection.")
        return

    tracks = data["collection"]
    print(f"Found {len(tracks)} tracks.")

    reviews = []
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
            comm_url = f"https://api-v2.soundcloud.com/tracks/{track_id}/comments?threaded=0&filter_replies=0&client_id={CLIENT_ID}&limit=25&offset=0"
            cdata = fetch_json(comm_url)
            if cdata and "collection" in cdata:
                for c in cdata["collection"]:
                    body = (c.get("body") or "").strip()
                    user = c.get("user") or {}
                    username = (user.get("username") or "").strip()
                    full_name = (user.get("full_name") or "").strip()
                    avatar = user.get("avatar_url") or "https://a-v2.sndcdn.com/assets/images/default/avatar.png"
                    created_at = c.get("created_at") or "2026-08-01"
                    date_str = created_at.split("T")[0] if "T" in created_at else created_at

                    # Filter out spam / short text
                    if len(body) >= 4 and not any(kw in body.lower() for kw in ["http", "bit.ly", "repostexchange", "download", "free followers"]):
                        display_name = full_name if full_name and len(full_name) > 2 else username
                        reviews.append({
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

    print(f"Total valid fan reviews extracted: {len(reviews)}")
    selected_reviews = reviews[:18]

    file_content = "// Automatically curated fan & DJ reviews from SoundCloud\nconst communityReviews = " + json.dumps(selected_reviews, indent=4, ensure_ascii=False) + ";\n"
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(file_content)

    print(f"Successfully saved {len(selected_reviews)} curated reviews to {OUTPUT_PATH}")

if __name__ == "__main__":
    sync_comments()
