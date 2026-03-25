import subprocess

def register(bus, router, registry, ctx):

    registry.register_plugin(
        "man_search",
        ["search.man"]
    )

    def man_adapter(query):

        try:
            result = subprocess.run(
                ["apropos", query],
                capture_output=True,
                text=True
            )

            lines = result.stdout.splitlines()

            candidates = []

            for line in lines[:10]:

                if " - " not in line:
                    continue

                name, desc = line.split(" - ", 1)

                cmd = name.split(" ")[0]

                candidates.append({
                    "title": cmd,
                    "short": desc.strip()
                })

            return candidates

        except Exception:
            return []

    router.register_adapter(man_adapter)
