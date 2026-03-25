#!/usr/bin/env python3
"""Capability registry: track plugin capabilities and metadata."""
from __future__ import annotations
import logging
from typing import Dict, List, Any

_log = logging.getLogger("infinity.capability_registry")

class CapabilityRegistry:
    def __init__(self, logger: logging.Logger | None = None) -> None:
        self._logger = logger or _log
        self._plugins: Dict[str, Dict[str, Any]] = {}
        self._capability_index: Dict[str, List[str]] = {}

    def register_plugin(self, plugin_id: str, capabilities: List[str], meta: Dict[str, Any] | None = None) -> None:
        meta = meta or {}
        if plugin_id in self._plugins:
            existing = self._plugins[plugin_id]
            existing_caps = set(existing.get("capabilities", []))
            new_caps = set(capabilities)
            existing["capabilities"] = list(sorted(existing_caps.union(new_caps)))
            existing["meta"].update(meta)
            self._logger.info("plugin_updated", extra={"plugin_id": plugin_id, "capabilities": existing["capabilities"]})
            return
        self._plugins[plugin_id] = {"capabilities": list(capabilities), "meta": dict(meta)}
        for c in capabilities:
            self._capability_index.setdefault(c, []).append(plugin_id)
        self._logger.info("plugin_registered", extra={"plugin_id": plugin_id, "capabilities": capabilities})

    def get_providers(self, capability: str) -> List[str]:
        return list(self._capability_index.get(capability, []))

    def list_plugins(self) -> Dict[str, Dict[str, Any]]:
        return dict(self._plugins)
