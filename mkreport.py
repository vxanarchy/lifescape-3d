#!/usr/bin/env python3
"""Render a dupscan JSON report as a reviewable HTML table + text summary."""
import html
import json
import sys


def fmt(n):
    if n >= 1 << 30:
        return f"{n / (1 << 30):.2f} GB"
    if n >= 1 << 20:
        return f"{n / (1 << 20):.2f} MB"
    if n >= 1024:
        return f"{n / 1024:.1f} KB"
    return f"{n} B"


def main():
    with open(sys.argv[1]) as f:
        r = json.load(f)

    groups = r["groups"]
    print(f"Roots: {', '.join(r['roots'])}")
    print(f"Files scanned: {r['files_scanned']} "
          f"(candidates hashed: {r['candidates_hashed']})")
    print(f"Duplicate groups: {r['duplicate_groups']} "
          f"({r['duplicate_files_total']} files)")
    print(f"Wasted space: {fmt(r['wasted_bytes'])}")
    print()

    # Text summary
    for i, g in enumerate(groups, 1):
        print(f"[{i}] {fmt(g['size'])} x{g['count']}  {g['hash'][:12]}")
        print(f"    keep:  {g['keeper']}")
        for d in g["duplicates"]:
            print(f"    dup:   {d['path']}")
        print()

    # HTML
    rows = []
    for i, g in enumerate(groups, 1):
        dups = "".join(
            f"<tr><td>{fmt(d['size'])}</td>"
            f"<td>{html.escape(d['path'])}</td></tr>"
            for d in g["duplicates"])
        rows.append(
            f"<tr><td>{i}</td><td>{fmt(g['size'])}</td><td>{g['count']}</td>"
            f"<td>{html.escape(g['keeper'])}</td>"
            f"<td><table class='sub'>{dups}</table></td></tr>")

    page = f"""<!doctype html><html><head><meta charset="utf-8">
<title>Duplicate Report</title>
<style>
body{{font-family:Segoe UI,sans-serif;margin:24px;background:#f6f7f9}}
h1{{font-size:20px}}
.summary{{background:#fff;padding:16px 20px;border-radius:8px;
box-shadow:0 1px 3px rgba(0,0,0,.08);margin-bottom:16px}}
table{{border-collapse:collapse;width:100%;background:#fff;
box-shadow:0 1px 3px rgba(0,0,0,.08)}}
th,td{{text-align:left;padding:8px 10px;border-bottom:1px solid #eceef1;
font-size:13px;vertical-align:top}}
th{{background:#eef0f4;position:sticky;top:0}}
tr:hover td{{background:#f0f4ff}}
.sub{{margin:6px 0;border:none;background:#fafbfc}}
.sub td{{padding:4px 8px}}
code{{background:#eee;padding:1px 5px;border-radius:3px;font-size:12px}}
</style></head><body>
<h1>Duplicate files report</h1>
<div class="summary">
<b>Roots:</b> {', '.join(html.escape(x) for x in r['roots'])}<br>
<b>Files scanned:</b> {r['files_scanned']} &nbsp;
<b>Candidates hashed:</b> {r['candidates_hashed']}<br>
<b>Duplicate groups:</b> {r['duplicate_groups']} &nbsp;
<b>Duplicate files:</b> {r['duplicate_files_total']} &nbsp;
<b>Wasted space:</b> {fmt(r['wasted_bytes'])}
</div>
<table>
<tr><th>#</th><th>Size</th><th>x</th><th>KEEP</th><th>Duplicates</th></tr>
{''.join(rows)}
</table></body></html>"""

    out = sys.argv[2] if len(sys.argv) > 2 else "duplicates.html"
    with open(out, "w") as f:
        f.write(page)
    print(f"\nHTML report: {out}")


if __name__ == "__main__":
    main()