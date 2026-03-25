#!/usr/bin/env python3
from __future__ import annotations
import json
import logging
import os
import shutil
import shlex
import subprocess
import tempfile
from typing import Dict, Any, List, Optional

_log = logging.getLogger("infinity.preview")


def _print_plain_items(items: List[Dict[str, Any]]) -> None:
    print()
    print("=== Infinity Preview ===")
    for it in items:
        title = it.get("title") or it.get("name") or "(untitled)"
        body = it.get("body") or it.get("short") or ""
        print(f"\n> {title}")
        if body:
            for line in str(body).splitlines():
                print(f"  {line}")
    print()


def _fzf_available() -> bool:
    return shutil.which("fzf") is not None


def _build_index_lines(items: List[Dict[str, Any]]) -> List[str]:
    lines: List[str] = []
    for i, it in enumerate(items):
        title = it.get("title") or it.get("name") or "(untitled)"
        short = it.get("short") or it.get("body") or ""
        title = " ".join(str(title).splitlines())
        short = " ".join(str(short).splitlines())
        lines.append(f"{i}\t{title} — {short}")
    return lines


def interactive_select_with_fzf(items: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not items:
        return None
    if not _fzf_available():
        return None

    with tempfile.NamedTemporaryFile("w+", delete=False, encoding="utf-8") as jf:
        tmp_json_path = jf.name
        for it in items:
            jf.write(json.dumps(it, ensure_ascii=False) + "\n")

    lines = _build_index_lines(items)
    fzf_input = "\n".join(lines)

    preview_cmd = (
        "TMP=" + shlex.quote(tmp_json_path) + " sh -c "
        + shlex.quote(
            'idx=$(printf "%s" "{}" | cut -f1); '
            'sed -n "${idx}p" "$TMP" | python3 -m json.tool'
        )
    )

    try:
        proc = subprocess.run(
            ["fzf", "--ansi", "--no-multi", "--preview", preview_cmd],
            input=fzf_input,
            text=True,
            capture_output=True,
        )
        if proc.returncode != 0:
            return None

        sel_line = proc.stdout.strip().splitlines()[0]
        idx = int(sel_line.split("\t", 1)[0])
        return items[idx] if 0 <= idx < len(items) else None

    except Exception:
        _log.exception("fzf failed")
        return None
    finally:
        try:
            os.unlink(tmp_json_path)
        except Exception:
            pass


def render(preview_payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    try:
        items = preview_payload.get("items", [])

        print_plain = os.environ.get("INFINITY_FZF_PRINT_ONLY", "") not in ("1", "true", "yes")
        if print_plain:
            _print_plain_items(items)

        use_fzf = os.environ.get("INFINITY_USE_FZF", "").lower() in ("1", "true", "yes")

        if use_fzf and _fzf_available():
            selected = interactive_select_with_fzf(items)
            if selected:
                sel = selected.get("key") or selected.get("title") or json.dumps(selected)
                print(sel)
                return selected

        return None
    except Exception:
        _log.exception("render failed")
        return None
