import os
import sys
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def run_sync():
    print("=== STARTING DAILY CATALOG AUTO-SYNC ===")
    
    # 1. Sync SoundCloud
    print("\n--- 1. Syncing SoundCloud Catalog ---")
    sc_script = os.path.join(BASE_DIR, "scripts", "sync_catalog.py")
    subprocess.run([sys.executable, sc_script], check=True)
    
    # 2. Sync YouTube
    print("\n--- 2. Syncing YouTube Catalog ---")
    yt_script = os.path.join(BASE_DIR, "scripts", "sync_youtube_catalog.py")
    subprocess.run([sys.executable, yt_script], check=True)
    
    # 3. Verify Catalog Integrity
    print("\n--- 3. Verifying Catalog Integrity ---")
    verify_script = os.path.join(BASE_DIR, "scripts", "verify_catalog_integrity.py")
    subprocess.run([sys.executable, verify_script], check=True)
    
    print("\n=== AUTO-SYNC COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_sync()
