import os
import importlib.util
import logging

class PluginLoader:
    def __init__(self, plugin_dir, logger=None):
        self.plugin_dir = plugin_dir
        self.logger = logger or logging.getLogger("plugin_loader")
        self._loaded = []

    def load_all(self, bus=None, router=None, registry=None, context_mgr=None):
        for file in os.listdir(self.plugin_dir):
            if not file.endswith(".py"):
                continue

            plugin_id = file[:-3]
            full = os.path.join(self.plugin_dir, file)

            try:
                spec = importlib.util.spec_from_file_location(plugin_id, full)
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)

                if hasattr(mod, "register"):
                    # ORIGINAL SIMPLE CALL (no signature tricks)
                    mod.register(bus, router, registry, context_mgr)

                self._loaded.append(plugin_id)
                self.logger.info("plugin_loaded")

            except Exception:
                self.logger.exception("plugin_load_failed")

    def list_loaded(self):
        return self._loaded
