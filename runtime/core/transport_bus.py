#!/usr/bin/env python3
"""Simple in-process Transport/Event Bus."""
from __future__ import annotations
import logging
from typing import Callable, Dict, List, Any

Logger = logging.Logger
_log = logging.getLogger("infinity.transport_bus")
EventHandler = Callable[[Dict[str, Any]], None]

class TransportBus:
    """In-memory pub/sub transport bus."""
    def __init__(self, logger: Logger | None = None) -> None:
        self._logger = logger or _log
        self._subscribers: Dict[str, List[EventHandler]] = {}

    def subscribe(self, event_type: str, handler: EventHandler) -> None:
        self._subscribers.setdefault(event_type, []).append(handler)
        self._logger.debug("subscribed", extra={"event_type": event_type, "handler": repr(handler)})

    def emit(self, event_type: str, envelope: Dict[str, Any]) -> None:
        handlers = list(self._subscribers.get(event_type, []))
        self._logger.info("emit", extra={"event_type": event_type, "handlers": len(handlers), "id": envelope.get("id")})
        for h in handlers:
            try:
                h(envelope)
            except Exception:
                self._logger.exception("handler failure", extra={"event_type": event_type, "handler": repr(h)})
