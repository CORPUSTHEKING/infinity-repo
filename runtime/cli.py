#!/usr/bin/env python3
"""Minimal CLI that boots the Infinity skeleton runtime and accepts simple queries."""
from __future__ import annotations
import logging
import time
import uuid
import os
import sys
from typing import Optional

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
if THIS_DIR not in sys.path:
    sys.path.insert(0, THIS_DIR)

from core.transport_bus import TransportBus
from core.plugin_loader import PluginLoader
from core.capability_registry import CapabilityRegistry
from core.context_manager import ContextManager
from core.imf_router import IMFRouter
import core.preview as preview_module

LOG = logging.getLogger("infinity.cli")

def setup_logging():
    fmt = '{"ts":"%(asctime)s","level":"%(levelname)s","name":"%(name)s","msg":"%(message)s"}'
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(fmt))
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.INFO)

def make_envelope(query: str, origin: str = "runtime.cli", context_id: Optional[str] = None):
    return {
        "imf_version": "1.0.0",
        "type": "query",
        "id": str(uuid.uuid4()),
        "origin": origin,
        "context_id": context_id,
        "timestamp": int(time.time()),
        "payload": {"query": query, "mode": "interactive"},
    }

def main() -> None:
    setup_logging()
    LOG.info("starting_infinity_skeleton")
    # Build components
    bus = TransportBus()
    registry = CapabilityRegistry()
    ctxmgr = ContextManager()
    router = IMFRouter(bus=bus, preview_renderer=preview_module, registry=registry, context_mgr=ctxmgr)

    plugin_dir = os.path.join(THIS_DIR, "plugins")
    loader = PluginLoader(plugin_dir, logger=logging.getLogger("plugin_loader"))
    loader.load_all(bus=bus, router=router, registry=registry, context_mgr=ctxmgr)

    LOG.info("plugins_loaded", extra={"loaded": loader.list_loaded()})
    context_id = ctxmgr.create()

    print("Infinity (skeleton) ready. Type a query; ':quit' to exit.")
    try:
        while True:
            try:
                q = input("∞ ").strip()
            except (EOFError, KeyboardInterrupt):
                print()
                break
            if not q:
                continue
            if q in (":quit", ":exit", "exit", "quit"):
                break
            env = make_envelope(q, context_id=context_id)
            router.handle_envelope(env)
    finally:
        LOG.info("shutting_down")

if __name__ == "__main__":
    main()
