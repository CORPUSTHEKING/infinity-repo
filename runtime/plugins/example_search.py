#!/usr/bin/env python3
"""Example minimal search plugin."""
from __future__ import annotations
import logging
from typing import Dict, Any

def register(bus, router, registry, context_mgr, logger: logging.Logger | None = None):
    log = logger or logging.getLogger("plugin.example_search")
    registry.register_plugin(plugin_id="example_search", capabilities=["search.basic"], meta={"version":"0.1"})

    def on_query(payload: Dict[str, Any]) -> None:
        q = payload.get("query", "")
        ctx = payload.get("context_id")
        log.info("received_query", extra={"query": q, "context": ctx})
        candidates = [
            {"key":"command:sed","type":"command","title":"sed","short":"Stream editor (example)","score":0.9, "meta": {"examples": ["sed 's/[[:space:]]//g' file"]}},
            {"key":"command:awk","type":"command","title":"awk","short":"Pattern scanning and processing language (example)","score":0.6, "meta": {"examples": ["awk '{print $1}' file"]}}
        ]
        bus.emit("event.candidates", {"candidates": candidates, "context_id": ctx, "origin": "plugin.example_search"})

    bus.subscribe("event.query", on_query)
