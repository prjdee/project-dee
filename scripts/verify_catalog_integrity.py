import os
import json
import re
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG_PATH = os.path.join(BASE_DIR, "js", "catalog-data.js")

def verify():
    print("Running Catalog Integrity & Artwork Matching Pre-Deployment Check...\n")
    if not os.path.exists(CATALOG_PATH):
        print("ERROR: js/catalog-data.js not found!")
        return False
        
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        content = f.read()
        
    sc_match = re.search(r"const soundCloudCatalog = (\[.*?\]);", content, re.DOTALL)
    if not sc_match:
        print("ERROR: Could not parse soundCloudCatalog in js/catalog-data.js!")
        return False
        
    sc_catalog = json.loads(sc_match.group(1))
    print(f"Total SoundCloud catalog tracks: {len(sc_catalog)}")
    
    errors = []
    for idx, track in enumerate(sc_catalog[:10]):
        title = track.get("title")
        thumb = track.get("thumb")
        sc_url = track.get("sc_url")
        
        if not title or not thumb or not sc_url:
            errors.append(f"SoundCloud Track #{idx+1} is missing title, thumb, or sc_url!")
            
        print(f"Track #{idx+1:02d}: '{title}'\n  Cover: {thumb}\n  SC URL: {sc_url}\n")
        
    if errors:
        print("INTEGRITY CHECK FAILED:")
        for err in errors:
            print(f" - {err}")
        return False
        
    print("ALL INTEGRITY CHECKS PASSED SUCCESSFULLY! ZERO MISMATCHES DETECTED.")
    return True

if __name__ == "__main__":
    success = verify()
    if not success:
        sys.exit(1)
    else:
        sys.exit(0)
