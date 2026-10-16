
from pathlib import Path
import csv

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = PROJECT_DIR / "datasets" / "ESC-50"
AUDIO_DIR = DATASET_DIR / "audio"
META_FILE = DATASET_DIR / "meta" / "esc50.csv"

def main():
    if not META_FILE.exists() or not AUDIO_DIR.exists():
        print("ERROR: ESC-50 dataset folders nahi mile.")
        print(f"Expected metadata: {META_FILE}")
        print(f"Expected audio folder: {AUDIO_DIR}")
        return

    with META_FILE.open("r", encoding="utf-8", newline="") as file:
        rows = list(csv.DictReader(file))

    valid_rows = [
        row for row in rows
        if (AUDIO_DIR / row["filename"]).is_file()
    ]

    print("=== EchoSense_AI Training Preparation ===")
    print(f"Metadata rows: {len(rows)}")
    print(f"Valid audio files: {len(valid_rows)}")
    print(f"Classes: {len(set(row['category'] for row in valid_rows))}")

    print("\nClass names:")
    for category in sorted(set(row["category"] for row in valid_rows)):
        print("-", category)

    if len(valid_rows) != len(rows):
        print("\nWARNING: Kuch audio files missing hain.")
    else:
        print("\nDataset ready for the next training step.")

if __name__ == "__main__":
    main()
