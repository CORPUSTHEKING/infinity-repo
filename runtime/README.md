Infinity runtime skeleton (minimal)

Run from repo root:
  python INFINITY/runtime/cli.py

What it does:
- boots an in-process transport bus
- loads plugins from INFINITY/runtime/plugins (example_search provided)
- validates basic IMF envelope fields (light validation)
- routes 'query' envelopes to 'event.query'
- example plugin responds with static candidates
- router forwards candidates to the preview renderer

Next steps:
- replace example_search with real adapters (manpage, filesystem, history)
- add JSON Schema validation using jsonschema (optional)
- implement IPC transport (UNIX socket) if you need external CLI -> core separation
