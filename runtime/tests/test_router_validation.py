#!/usr/bin/env python3
import sys, os, time, uuid
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.transport_bus import TransportBus
from core.capability_registry import CapabilityRegistry
from core.context_manager import ContextManager
from core.imf_router import IMFRouter
import core.preview as preview_module

def test_validation_and_adapter_stream():
    bus = TransportBus()
    registry = CapabilityRegistry()
    ctxmgr = ContextManager()
    router = IMFRouter(bus=bus, preview_renderer=preview_module, registry=registry, context_mgr=ctxmgr,
                      max_workers=4, adapter_timeout_s=0.5)
    # register filesystem plugin programmatically
    from plugins import filesystem_search
    filesystem_search.register(bus=bus, router=router, registry=registry, context_mgr=ctxmgr)
    env = {
        "imf_version": "1.0.0",
        "type": "query",
        "id": str(uuid.uuid4()),
        "origin": "test",
        "context_id": ctxmgr.create(),
        "timestamp": int(time.time()),
        "payload": {"query": "sh", "mode": "interactive"}
    }
    # should not raise
    router.handle_envelope(env)
