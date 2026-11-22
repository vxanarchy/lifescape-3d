#!/usr/bin/env python3
"""Identify duplicate files by content hash. READ-ONLY: no deletes, no moves.

Two-pass design so we don't hash everything:
  Pass 1: walk, bucket files by size and by (name, size).
  Pass 2: hash only files that share a size with at least one other file
          (catches renamed duplicates) or share (name, size) (catches copies).

Usage: dupscan.py <root1> [root2 ...] [--out report.json] [--min-size N]
"""
import hashlib
import io
import json
import os
import sys
import zipfile
from collections import defaultdict

CHUNK = 1 << 20  # 1 MiB


def sha256_stream(fh):
    h = hashlib.sha256()
    while True:
        block = fh.read(CHUNK)
        if not block:
            break
        h.update(block)
    return h.hexdigest()


def sha256_file(path):
    try:
        with open(path, "rb") as f:
            return sha256_stream(f)
    except OSError:
        return None


def hash_zip_member(archive, member):
    """Return (sha256_hex, size) for one member of a zip archive."""
    try:
        with zipfile.ZipFile(archive) as zf:
            with zf.open(member) as fh:
                return sha256_stream(fh), zf.getinfo(member).file_size
    except (zipfile.BadZipFile, OSError, KeyError):
        return None, 0


def collect(roots, min_size):
    """Pass 1: enumerate files, bucket by size and by (name, size)."""
    by_size = defaultdict(list)         # size -> [(path, name)]
    by_name_size = defaultdict(list)    # (name, size) -> [path]
    total = 0
    errors = 0

    def handle(path, name, size):
        nonlocal total
        if size < min_size:
            return
        total += 1
        by_size[size].append((path, name))
        by_name_size[(name, size)].append(path)

    for root in roots:
        root = os.path.abspath(root)
        if not os.path.isdir(root):
            print(f"WARN: not a directory, skipping: {root}", file=sys.stderr)
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if not d.startswith(".")]
            for name in filenames:
                path = os.path.join(dirpath, name)
                try:
                    st = os.lstat(path)
                except OSError:
                    errors += 1
                    continue
                if not os.path.isfile(path):
                    continue
                if name.lower().endswith(".zip"):
                    # also index members of zip archives
                    try:
                        with zipfile.ZipFile(path) as zf:
                            for info in zf.infolist():
                                if info.is_dir() or info.file_size < 0:
                                    continue
                                handle(f"{path}::{info.filename}",
                                       info.filename, info.file_size)
                    except (zipfile.BadZipFile, OSError, KeyError):
                        pass
                handle(path, name, st.st_size)
                if total % 20000 == 0:
                    print(f"...enumerated {total} files", file=sys.stderr)

    # candidate = shares size with another file, or shares (name,size)
    candidates = set()
    for size, files in by_size.items():
        if len(files) > 1:
            for path, _ in files:
                candidates.add(path)
    for key, paths in by_name_size.items():
        if len(paths) > 1:
            for p in paths:
                candidates.add(p)

    return candidates, total, errors


def main():
    args = sys.argv[1:]
    out = None
    min_size = 0
    roots = []
    i = 0
    while i < len(args):
        a = args[i]
        if a == "--out":
            out = args[i + 1]; i += 2; continue
        if a == "--min-size":
            min_size = int(args[i + 1]); i += 2; continue
        roots.append(a); i += 1

    if not roots:
        print(__doc__); sys.exit(2)

    candidates, total, errors = collect(roots, min_size)
    print(f"Enumerated {total} files; {len(candidates)} need hashing",
          file=sys.stderr)

    # Pass 2: hash candidates, group by hash
    by_hash = defaultdict(list)
    done = 0
    for path in candidates:
        if "::" in path:
            archive, member = path.split("::", 1)
            digest, sz = hash_zip_member(archive, member)
        else:
            digest = sha256_file(path)
            sz = os.path.getsize(path) if digest else 0
        if digest is None:
            errors += 1
        else:
            by_hash[digest].append((path, sz))
        done += 1
        if done % 5000 == 0:
            print(f"...hashed {done}/{len(candidates)}", file=sys.stderr)

    dup_groups = []
    wasted = 0
    for digest, files in by_hash.items():
        if len(files) > 1:
            files.sort(key=lambda x: x[0])
            keeper = files[0][0]
            extras = files[1:]
            group_bytes = sum(sz for _, sz in extras)
            wasted += group_bytes
            dup_groups.append({
                "hash": digest,
                "size": files[0][1],
                "count": len(files),
                "keeper": keeper,
                "duplicates": [{"path": p, "size": s} for p, s in extras],
            })

    dup_groups.sort(key=lambda g: -g["size"])

    report = {
        "roots": [os.path.abspath(r) for r in roots],
        "min_size": min_size,
        "files_scanned": total,
        "candidates_hashed": len(candidates),
        "read_errors": errors,
        "duplicate_groups": len(dup_groups),
        "duplicate_files_total": sum(g["count"] for g in dup_groups),
        "wasted_bytes": wasted,
        "groups": dup_groups,
    }

    text = json.dumps(report, indent=2)
    if out:
        with open(out, "w") as f:
            f.write(text)
        print(f"Wrote {out}")
    else:
        print(text)


if __name__ == "__main__":
    main()