#!/usr/bin/env python3
"""Guard rails for editing SRT text without changing timing structure."""

from __future__ import annotations

import argparse
import re
import shutil
import sys
from pathlib import Path


DEFAULT_SCAN_PATTERNS = [
    "a卷",
    "a准",
    "Asian",
    "Chat GBT",
    "Chatboard",
    "dipstick",
    "problem",
    "scale",
    "SCU",
    "皇叔",
    "cloud OPS",
    "Scude",
    "scudemd",
    "Manners",
    "Cordex",
    "Openclaw",
    "跃跃",
    "猜明白",
    "圈的时",
    "写实",
]


def parse_srt(path: Path) -> list[tuple[str, str, str]]:
    text = path.read_text(encoding="utf-8-sig")
    blocks = [block for block in re.split(r"\n\s*\n", text.strip()) if block.strip()]
    rows: list[tuple[str, str, str]] = []
    for i, block in enumerate(blocks, start=1):
        lines = block.splitlines()
        if len(lines) < 2:
            raise ValueError(f"{path}: bad SRT block #{i}: missing timestamp")
        number = lines[0].strip()
        timestamp = lines[1].strip()
        body = "\n".join(lines[2:])
        rows.append((number, timestamp, body))
    return rows


def cmd_backup(args: argparse.Namespace) -> int:
    src = Path(args.srt).expanduser()
    if not src.exists():
        print(f"ERROR: file not found: {src}", file=sys.stderr)
        return 2
    dst = Path(args.output).expanduser() if args.output else src.with_suffix(src.suffix + ".bak")
    if dst.exists() and not args.force:
        print(f"backup exists: {dst}")
        return 0
    shutil.copy2(src, dst)
    print(f"backup created: {dst}")
    return 0


def cmd_validate(args: argparse.Namespace) -> int:
    original = Path(args.original).expanduser()
    edited = Path(args.edited).expanduser()
    old_rows = parse_srt(original)
    new_rows = parse_srt(edited)

    errors: list[str] = []
    if len(old_rows) != len(new_rows):
        errors.append(f"cue count differs: {len(old_rows)} != {len(new_rows)}")

    for index, (old, new) in enumerate(zip(old_rows, new_rows), start=1):
        if old[0] != new[0]:
            errors.append(f"cue #{index} number differs: {old[0]!r} != {new[0]!r}")
        if old[1] != new[1]:
            errors.append(f"cue #{index} timestamp differs: {old[1]!r} != {new[1]!r}")

    if errors:
        print("SRT structure validation: FAIL")
        for error in errors[:50]:
            print(f"- {error}")
        if len(errors) > 50:
            print(f"- ... {len(errors) - 50} more")
        return 1

    changed_text = sum(1 for old, new in zip(old_rows, new_rows) if old[2] != new[2])
    print("SRT structure validation: PASS")
    print(f"cues: {len(new_rows)}")
    print(f"changed text cues: {changed_text}")
    return 0


def cmd_scan(args: argparse.Namespace) -> int:
    path = Path(args.srt).expanduser()
    patterns = args.pattern or DEFAULT_SCAN_PATTERNS
    text = path.read_text(encoding="utf-8-sig")
    hits: list[tuple[int, str, str]] = []
    for line_no, line in enumerate(text.splitlines(), start=1):
        for pattern in patterns:
            if pattern in line:
                hits.append((line_no, pattern, line))

    if not hits:
        print("scan: no suspicious terms found")
        return 0

    print("scan: suspicious terms found")
    for line_no, pattern, line in hits:
        print(f"{line_no}: [{pattern}] {line}")
    return 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate SRT timing structure after text edits.")
    sub = parser.add_subparsers(dest="command", required=True)

    backup = sub.add_parser("backup", help="Create a .bak copy without overwriting by default.")
    backup.add_argument("srt")
    backup.add_argument("--output")
    backup.add_argument("--force", action="store_true")
    backup.set_defaults(func=cmd_backup)

    validate = sub.add_parser("validate", help="Compare cue numbers and timestamps.")
    validate.add_argument("original")
    validate.add_argument("edited")
    validate.set_defaults(func=cmd_validate)

    scan = sub.add_parser("scan", help="Scan for common speech-recognition leftovers.")
    scan.add_argument("srt")
    scan.add_argument("pattern", nargs="*")
    scan.set_defaults(func=cmd_scan)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
