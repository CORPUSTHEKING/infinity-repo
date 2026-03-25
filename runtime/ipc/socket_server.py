#!/usr/bin/env python3
"""Simple UNIX-domain socket server that accepts newline-delimited JSON envelopes (ndjson)
and forwards them into router.handle_envelope(router).
"""
from __future__ import annotations
import socket
import os
import sys
import json
import logging

SOCKET_PATH = "/tmp/infinity.sock"

def start_unix_server(router, socket_path: str = SOCKET_PATH):
    if os.path.exists(socket_path):
        try:
            os.remove(socket_path)
        except OSError:
            pass

    srv = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    srv.bind(socket_path)
    srv.listen(1)
    os.chmod(socket_path, 0o660)
    logging.getLogger("infinity.ipc").info("listening", extra={"socket": socket_path})

    try:
        while True:
            conn, _ = srv.accept()
            with conn:
                f = conn.makefile("r")
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        env = json.loads(line)
                    except json.JSONDecodeError:
                        # ignore malformed
                        continue
                    try:
                        router.handle_envelope(env)
                    except Exception:
                        logging.getLogger("infinity.ipc").exception("router_handle_failed")
    finally:
        try:
            srv.close()
        except Exception:
            pass

if __name__ == "__main__":
    print("This is a helper module for the runtime IPC server. Import start_unix_server(router).")
