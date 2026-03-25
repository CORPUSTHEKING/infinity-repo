#!/usr/bin/env python3
"""Simple context manager for interactive sessions."""
from __future__ import annotations
import logging
import uuid
import time
from typing import Dict, Any

_log = logging.getLogger("infinity.context_manager")

class ContextManager:
    def __init__(self, logger: logging.Logger | None = None) -> None:
        self._logger = logger or _log
        self._contexts: Dict[str, Dict[str, Any]] = {}

    def create(self, base: Dict[str, Any] | None = None) -> str:
        ctx_id = str(uuid.uuid4())
        now = int(time.time())
        ctx = {"id": ctx_id, "created_at": now, "last_updated": now, "data": base or {}}
        self._contexts[ctx_id] = ctx
        self._logger.debug("context_created", extra={"context_id": ctx_id})
        return ctx_id

    def get(self, context_id: str) -> Dict[str, Any] | None:
        return self._contexts.get(context_id)

    def touch(self, context_id: str) -> None:
        ctx = self._contexts.get(context_id)
        if ctx:
            ctx["last_updated"] = int(time.time())
            self._logger.debug("context_touched", extra={"context_id": context_id})
