#!/usr/bin/env python3
"""Aggregate a dupscan report by top-level directory for review."""
import json
import os
import sys
from collections import defaultdict


def fmt(n):
    if n >= 1 << 30:
        return f"{n / (1 << 30):.2f} GB"
    if n >= 1 << 20:
        return f"{n / (1 << 20):.2f} MB"
    if n >= 1024:
        return f"{n / 1024:.1f} KB"
    return f"{n} B"


def topdir(path, roots):
    """Return the top-level directory name under the first matching root."""
    for r in roots:
        r = os.path.abspath(r)
        p = os.path.abspath(path)
        if p.startswith(r + os.sep) or p == r:
            rel = os.path.relpath(p, r)
            return rel.split(os.sep)[0]
    return os.path.basename(os.path.dirname(path))


def main():
    with open(sys.argv[1]) as f:
        r = json.load(f)
    roots = r["roots"]

    agg = defaultdict(lambda: {"bytes": 0, "groups": 0, "files": 0,
                               "paths": set()})
    for g in r["groups"]:
        td = topdir(g["keeper"], roots)
        a = agg[td]
        a["bytes"] += g["size"] * (g["count"] - 1)
        a["groups"] += 1
        a["files"] += g["count"] - 1
        a["paths"].add(g["keeper"])

    rows = sorted(agg.items(), key=lambda kv: -kv[1]["bytes"])
    total = sum(a["bytes"] for _, a in rows)

    print(f"Roots: {', '.join(roots)}")
    print(f"Total wasted: {fmt(total)} across {sum(a['groups'] for _,a in rows)} "
          f"groups / {sum(a['files'] for _,a in rows)} files\n")
    print(f"{'Directory':<55} {'Wasted':>10} {'Groups':>8} {'Files':>8}")
    print("-" * 85)
    for td, a in rows:
        print(f"{td[:54]:<55} {fmt(a['bytes']):>10} {a['groups']:>8} "
              f"{a['files']:>8}")

    # HTML
    import html
    rows_html = "".join(
        f"<tr><td>{html.escape(td)}</td><td>{fmt(a['bytes'])}</td>"
        f"<td>{a['groups']}</td><td>{a['files']}</td>"
        f"<td>{len(a['paths'])}</td></tr>"
        for td, a in rows)
    page = f"""<!doctype html><html><head><meta charset="utf-8">
<title>Duplicate Summary</title>
<style>
body{{font-family:Segoe UI,sans-serif;margin:24px;background:#f6f7f9}}
h1{{font-size:20px}}
.summary{{background:#fff;padding:16px 20px;border-radius:8px;
box-shadow:0 1px 3px rgba(0,0,0,.08);margin-bottom:16px}}
table{{border-collapse:collapse;width:100%;background:#fff;
box-shadow:0 1px 3px rgba(0,0,0,.08)}}
th,td{{text-align:left;padding:8px 10px;border-bottom:1px solid #eceef1;
font-size:13px}}
th{{background:#eef0f4;position:sticky;top:0}}
tr:hover td{{background:#f0f4ff}}
tr:nth-child(even) td{{background:#fafbfc}}
</style></head><body>
<h1>Duplicate files summary</h1>
<div class="summary">
<b>Total wasted:</b> {fmt(total)} &nbsp;
<b>Groups:</b> {sum(a['groups'] for _,a in rows)} &nbsp;
<b>Duplicate files:</b> {sum(a['files'] for _,a in rows)}
</div>
<table>
<tr><th>Directory</th><th>Wasted</th><th>Groups</th>
<th>Duplicate files</th><th>Unique keepers</th></tr>
{rows_html}
</table></body></html>"""
    out = sys.argv[2] if len(sys.argv) > 2 else "duplicates_summary.html"
    with open(out, "w") as f:
        f.write(page)
    print(f"\nHTML summary: {out}")


if __name__ == "__main__":
    main()