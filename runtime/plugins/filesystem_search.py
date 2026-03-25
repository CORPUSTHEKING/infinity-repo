#!/usr/bin/env python3
"""Filesystem search plugin.

Registers itself as an adapter with router.register_adapter(adapter_fn).
"""
from __future__ import annotations
import os
from typing import Dict, Any, Iterable

def register(bus, router, registry, context_mgr, logger=None):
    registry.register_plugin("filesystem_search", ["search.filesystem"], meta={"version": "0.1"})
    router.register_adapter(_fs_adapter)

def _is_executable(path: str) -> bool:
    return os.path.isfile(path) and os.access(path, os.X_OK)

def _fs_adapter(query: str, ctx: Dict[str, Any]) -> Iterable[Dict[str, Any]]:
    q = (query or "").lower().strip()
    if not q:
        return []
    results = []
    PATH = os.environ.get("PATH", "")
    seen = set()
    for p in PATH.split(os.pathsep):
        try:
            for fn in os.listdir(p):
                if q in fn.lower():
                    full = os.path.join(p, fn)
                    if _is_executable(full) and fn not in seen:
                        seen.add(fn)
                        results.append({
                            "key": f"exe:{fn}",
                            "type": "command",
                            "title": fn,
                            "short": f"executable: {full}"
                        })
                        if len(results) >= 50:
                            return results
        except Exception:
            continue
    # fallback: search ./scripts
    if os.path.isdir("scripts"):
        for root, _, files in os.walk("scripts"):
            for fn in files:
                if q in fn.lower() and fn not in seen:
                    seen.add(fn)
                    full = os.path.join(root, fn)
                    results.append({
                        "key": f"file:{full}",
                        "type": "file",
                        "title": fn,
                        "short": f"script: {full}"
                    })
                    if len(results) >= 50:
                        return results
    return results
