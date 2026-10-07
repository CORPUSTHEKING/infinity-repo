#!/usr/bin/env python3
import argparse
import re
import sys
from pathlib import Path

# Treat runs of 3+ spaces or tabs as column separators.
# This is safer than splitting on 2+ spaces because it preserves code fragments better.
COL_SPLIT_RE = re.compile(r"\t| {3,}")
SEP_ROW_RE = re.compile(r"^\s*\|?[-:\s|]+\|?\s*$")

HEADER_HINTS = {
    "Reason",
    "Meaning",
    "What happens",
    "What it does here",
    "Description",
    "Effect",
    "Explanation",
}

SECTION_HINTS = {
    "Symbol and syntax table",
    "Line-by-line execution flow",
    "Important behavior details",
    "Execution flow",
}

def escape_md(cell: str) -> str:
    return cell.replace("\\", r"\\").replace("|", r"\|").strip()

def parse_pipe_row(line: str):
    s = line.strip()
    if not (s.startswith("|") and s.endswith("|")):
        return None
    inner = s[1:-1]
    parts = [p.strip() for p in inner.split("|")]
    if len(parts) < 2:
        return None
    if all(not p or set(p) <= set("-: ") for p in parts):
        return None
    return parts

def parse_plain_row(line: str):
    if not line.strip():
        return None
    if SEP_ROW_RE.match(line):
        return None

    # First try tab / wide-space splitting.
    parts = [p.strip() for p in COL_SPLIT_RE.split(line.rstrip()) if p.strip()]
    if len(parts) >= 2:
        return parts

    return None

def normalize_row(line: str):
    parts = parse_pipe_row(line)
    if parts is None:
        parts = parse_plain_row(line)
    if parts is None:
        return None

    # Keep table width stable at 3 cols when possible.
    if len(parts) > 3:
        parts = [parts[0], parts[1], " ".join(parts[2:]).strip()]
    while len(parts) < 3:
        parts.append("")
    return parts

def is_section_title(line: str) -> bool:
    s = line.strip()
    if not s:
        return False
    if s in SECTION_HINTS:
        return True
    if re.match(r"^#+\s+\S", s):
        return True
    # A bare filename/title line like "Daudit.md"
    if re.match(r"^[\w.\-]+\.md$", s):
        return True
    return False

def is_header_row(parts):
    joined = " | ".join(parts)
    return any(h in joined for h in HEADER_HINTS)

def render_table(rows):
    if not rows:
        return []

    # Use first row as header when it looks like one; otherwise generate a generic header.
    if is_header_row(rows[0]):
        header = rows[0]
        data = rows[1:]
    else:
        # Try to infer width from the first row
        n = len(rows[0])
        header = [f"Column {i}" for i in range(1, n + 1)]
        data = rows

    out = []
    out.append("| " + " | ".join(escape_md(c) for c in header) + " |")
    out.append("|" + "|".join("-" * (len(c.strip()) if c.strip() else 3) for c in header) + "|")
    for row in data:
        row = row[:len(header)] + [""] * max(0, len(header) - len(row))
        out.append("| " + " | ".join(escape_md(c) for c in row) + " |")
    return out

def convert_text(text: str) -> str:
    lines = text.splitlines()
    out = []
    block = []

    def flush_block():
        nonlocal block, out
        if not block:
            return

        # First, preserve section headings as headings.
        if len(block) == 1 and is_section_title(block[0]):
            title = block[0].strip()
            if not title.startswith("#"):
                out.append(f"## {title}")
            else:
                out.append(title)
            block = []
            return

        # Collect rows that look like table rows.
        rows = []
        for line in block:
            row = normalize_row(line)
            if row is not None:
                rows.append(row)

        # If this block has enough table-like rows, render a table.
        if len(rows) >= 2:
            out.extend(render_table(rows))
        else:
            # Otherwise preserve the text as-is.
            out.extend(block)

        block = []

    for line in lines:
        if not line.strip():
            flush_block()
            out.append("")
        else:
            block.append(line)

    flush_block()
    return "\n".join(out).rstrip() + "\n"

def output_path_for(input_path: Path) -> Path:
    return input_path.with_name(f"{input_path.stem}.tables.md")

def process_file(path: Path, output_path: Path | None):
    text = path.read_text(encoding="utf-8")
    converted = convert_text(text)

    if output_path is None:
        output_path = output_path_for(path)

    output_path.write_text(converted, encoding="utf-8")
    print(str(output_path))

def main():
    parser = argparse.ArgumentParser(
        description="Convert aligned text blocks into Markdown tables."
    )
    parser.add_argument("path", nargs="?", help="Input file or directory. Reads stdin if omitted.")
    parser.add_argument("-o", "--output", help="Write to this file when input is a single file.")
    args = parser.parse_args()

    if not args.path:
        sys.stdout.write(convert_text(sys.stdin.read()))
        return

    p = Path(args.path)

    if p.is_file():
        out = Path(args.output) if args.output else None
        process_file(p, out)
        return

    if p.is_dir():
        for md in sorted(p.glob("*.md")):
            process_file(md, None)
        return

    raise SystemExit("Path Error")

if __name__ == "__main__":
    main()
