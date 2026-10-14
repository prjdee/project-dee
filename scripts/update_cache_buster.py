#!/usr/bin/env python3
"""
update_cache_buster.py
Automatically updates the cache-buster query parameter in index.html for dynamic data scripts:
- js/reviews-data.js
- js/news-data.js
- js/catalog-data.js

Only updates index.html if one of the data files has uncommitted changes (git status --porcelain),
or if run with the --force flag.
"""
import os
import re
import sys
import subprocess
from datetime import datetime

INDEX_FILE = "index.html"
DATA_FILES = [
    "js/reviews-data.js",
    "js/news-data.js",
    "js/catalog-data.js",
    "data/news.json"
]

def have_data_files_changed():
    try:
        res = subprocess.run(
            ["git", "status", "--porcelain"] + DATA_FILES,
            capture_output=True,
            text=True,
            check=True
        )
        return bool(res.stdout.strip())
    except Exception as e:
        print(f"[CACHE-BUSTER] Note on git status check: {e}")
        return True

def update_cache_busters(force=False):
    if not os.path.exists(INDEX_FILE):
        print(f"[CACHE-BUSTER] Error: {INDEX_FILE} not found.")
        return False

    if not force and not have_data_files_changed():
        print("[CACHE-BUSTER] No data files changed. Skipping index.html update.")
        return False

    version = datetime.utcnow().strftime("%Y%m%d.%H%M")

    with open(INDEX_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    targets = [
        "js/reviews-data.js",
        "js/news-data.js",
        "js/catalog-data.js",
    ]

    updated_content = content
    for target in targets:
        pattern = rf'({re.escape(target)})(?:\?v=[^"\'\s>]+)?'
        replacement = rf'\1?v={version}'
        updated_content = re.sub(pattern, replacement, updated_content)

    if updated_content != content:
        with open(INDEX_FILE, "w", encoding="utf-8") as f:
            f.write(updated_content)
        print(f"[CACHE-BUSTER] Successfully updated data scripts in {INDEX_FILE} to ?v={version}")
        return True
    else:
        print(f"[CACHE-BUSTER] No replacements needed in {INDEX_FILE}")
        return False

if __name__ == "__main__":
    force_run = "--force" in sys.argv
    update_cache_busters(force=force_run)
