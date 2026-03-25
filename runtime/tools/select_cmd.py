#!/usr/bin/env python3
from __future__ import annotations
import sys
import os
import uuid
import time

THIS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if THIS_DIR not in sys.path:
    sys.path.insert(0, THIS_DIR)

from core.transport_bus import TransportBus
from core.capability_registry import CapabilityRegistry
from core.context_manager import ContextManager
from core.imf_router import IMFRouter
import core.preview as preview_module
from core.plugin_loader import PluginLoader


def one_shot(query: str):
    bus = TransportBus()
    registry = CapabilityRegistry()
    ctxmgr = ContextManager()

    router = IMFRouter(
        bus=bus,
        preview_renderer=preview_module,
        registry=registry,
        context_mgr=ctxmgr,
        adapter_timeout_s=0.5,
    )

    plugin_dir = os.path.join(os.path.dirname(THIS_DIR), "plugins")
    PluginLoader(plugin_dir).load_all(
        bus=bus,
        router=router,
        registry=registry,
        context_mgr=ctxmgr,
    )

    os.environ.setdefault("INFINITY_USE_FZF", "1")
    os.environ.setdefault("INFINITY_FZF_PRINT_ONLY", "1")

    env = {
        "imf_version": "1.0.0",
        "type": "query",
        "id": str(uuid.uuid4()),
        "origin": "select_cmd",
        "context_id": ctxmgr.create(),
        "timestamp": int(time.time()),
        "payload": {"query": query},
    }

    router.handle_envelope(env)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: select_cmd.py 'query'", file=sys.stderr)
        sys.exit(1)

    one_shot(" ".join(sys.argv[1:]))
