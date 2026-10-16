
from pathlib import Path
import csv

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = PROJECT_DIR / "datasets" / "ESC-50"
AUDIO_DIR = DATASET_DIR / "audio"
META_FILE = DATASET_DIR / "meta" / "esc50.csv"


def main():
    if not AUDIO_DIR.is_dir():
        print(f"ERROR: Audio folder not found: {AUDIO_DIR}")
        return

    if not META_FILE.is_file():
        print(f"ERROR: Metadata CSV not found: {META_FILE}")
        return

    with META_FILE.open("r", encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))

    existing = [
        row for row in rows
        if (AUDIO_DIR / row["filename"]).is_file()
    ]

    missing = len(rows) - len(existing)
    class_counts = {}

    for row in existing:
        label = row["category"]
        class_counts[label] = class_counts.get(label, 0) + 1

    print("\n=== EchoSense_AI Dataset Check ===")
    print(f"Metadata records: {len(rows)}")
    print(f"Audio files found: {len(existing)}")
    print(f"Audio files missing: {missing}")
    print(f"Unique classes: {len(class_counts)}")

    print("\nAvailable sound categories:")
    for label, count in sorted(class_counts.items()):
        print(f"  {label:25} {count}")

    print("\nTarget classes of interest:")
    targets = {"siren", "car_horn", "engine", "dog"}
    for target in sorted(targets):
        matches = [
            name for name in class_counts
            if target in name.lower()
        ]
        print(f"  {target:15} {matches or 'Not found'}")

    if not existing:
        print("\nERROR: No matching audio files were found.")
        return

    print("\nDataset inspection complete.")


if __name__ == "__main__":
    main()
