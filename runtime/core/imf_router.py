#!/usr/bin/env python3
"""IMF router with schema validation and parallel adapter runner.

- validates envelopes using schema_validator
- routes 'query' envelopes to registered adapters (parallel)
- adapters should return an iterable of candidate dicts (or emit events directly)
- streams adapter results by emitting event.candidates for partial batches
"""
from __future__ import annotations
import logging
import uuid
from typing import Dict, Any, Callable, List, Iterable, Optional
from concurrent.futures import ThreadPoolExecutor, Future
from core import schema_validator

_log = logging.getLogger("infinity.imf_router")

REQUIRED_ENVELOPE_KEYS = {"imf_version", "type", "id", "origin", "timestamp", "payload"}
AdapterFn = Callable[[str, Dict[str, Any]], Optional[Iterable[Dict[str, Any]]]]

class IMFRouter:
    def __init__(self, bus, preview_renderer, registry, context_mgr,
                 *, logger: logging.Logger | None = None, max_workers: int = 8,
                 adapter_timeout_s: float = 0.25) -> None:
        self.bus = bus
        self.preview = preview_renderer
        self.registry = registry
        self.context_mgr = context_mgr
        self._logger = logger or _log
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.adapter_timeout = adapter_timeout_s
        self.adapters: List[AdapterFn] = []

        # subscribe to plugin candidate events so router can forward to preview surface
        self.bus.subscribe("event.candidates", self._on_candidates)

    def register_adapter(self, fn: AdapterFn) -> None:
        """Register a callable(adapter) that accepts (query, context) and returns iterable candidates."""
        self.adapters.append(fn)
        self._logger.info("adapter_registered", extra={"adapter": getattr(fn, "__name__", repr(fn))})

    def validate_envelope(self, env: Dict[str, Any]) -> bool:
        # light top-level check, then JSON-schema validation
        missing = [k for k in REQUIRED_ENVELOPE_KEYS if k not in env]
        if missing:
            self._logger.error("envelope_missing_keys", extra={"missing": missing, "id": env.get("id")})
            return False
        err = schema_validator.validate_envelope(env)
        if err:
            self._logger.error("envelope_schema_invalid", extra={"error": err, "id": env.get("id")})
            # emit structured error event so clients can react
            self.bus.emit("event.error", {"id": env.get("id"), "error": err, "context_id": env.get("context_id")})
            return False
        return True

    def handle_envelope(self, env: Dict[str, Any]) -> None:
        """Entry point: accept an envelope dict and route or process it."""
        if not isinstance(env, dict):
            self._logger.error("invalid_envelope_type", extra={"type": type(env)})
            return
        if not self.validate_envelope(env):
            return

        mtype = env.get("type")
        ctx = env.get("context_id") or self.context_mgr.create()

        if mtype == "query":
            q = env["payload"].get("query")
            self._logger.info("routed_query", extra={"query": q, "context_id": ctx})
            # run adapters in parallel, streaming partial candidates
            self._run_adapters_stream(q, ctx, origin=env.get("origin"))
        elif mtype == "preview_request":
            token = env["payload"].get("preview_token")
            if token:
                self.bus.emit("event.preview_request", {"preview_token": token, "context_id": ctx})
        else:
            self.bus.emit(f"event.{mtype}", env)
            self._logger.debug("routed_generic", extra={"type": mtype})

    def _run_adapters_stream(self, query: str, context: Dict[str, Any] | str, *, origin: str | None = None) -> None:
        """Execute all registered adapters in parallel and stream partial results via bus.emit('event.candidates')."""
        if not self.adapters:
            self._logger.debug("no_adapters_registered")
            return

        futures: List[tuple[AdapterFn, Future]] = []
        for adapter in self.adapters:
            try:
                fut = self.executor.submit(adapter, query, {"context_id": context})
                futures.append((adapter, fut))
            except Exception:
                self._logger.exception("adapter_submit_failed", extra={"adapter": getattr(adapter, "__name__", str(adapter))})

        # gather per-future with per-future timeout, emit batches as they arrive
        for adapter, fut in futures:
            try:
                candidates_iter = fut.result(timeout=self.adapter_timeout)
                if candidates_iter:
                    batch = []
                    for c in candidates_iter:
                        if isinstance(c, dict):
                            batch.append(c)
                    if batch:
                        self.bus.emit("event.candidates", {
                            "candidates": batch,
                            "context_id": context,
                            "origin": f"adapter.{getattr(adapter,'__name__','unknown')}"
                        })
            except Exception as e:
                # timeouts and adapter errors are expected; log and continue
                self._logger.debug("adapter_timeout_or_error", extra={
                    "adapter": getattr(adapter, "__name__", str(adapter)),
                    "error": str(e)
                })

    def _on_candidates(self, candidate_envelope: Dict[str, Any]) -> None:
        """Handle candidate envelopes from plugins and forward to preview surface."""
        try:
            preview_payload = {
                "preview_token": f"preview:{str(uuid.uuid4())}",
                "items": [
                    {
                        "title": c.get("title") or c.get("key"),
                        "body": c.get("short") or c.get("description") or "",
                        "examples": c.get("meta", {}).get("examples", [])
                    }
                    for c in candidate_envelope.get("candidates", [])
                ],
                "meta": {"origin": candidate_envelope.get("origin")},
            }
            # emit event.preview and render to preview surface
            self.bus.emit("event.preview", {"preview_payload": preview_payload, "context_id": candidate_envelope.get("context_id")})
            self.preview.render(preview_payload)
        except Exception:
            self._logger.exception("failed_handle_candidates")
