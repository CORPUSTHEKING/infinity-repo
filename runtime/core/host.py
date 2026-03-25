import asyncio
import os
import sys
import logging
from core.transport_bus import TransportBus
from core.imf_router import IMFRouter
from core.schema_validator import SchemaValidator
from core.plugin_loader import PluginLoader

class InfinityHost:
    def __init__(self):
        # 1. Initialize the Core Communication Fabric
        self.bus = TransportBus()
        
        # 2. Setup Schema Validation (pointing to your imf/schemas/)
        schema_path = os.path.join(os.path.dirname(__file__), "..", "imf", "schemas")
        self.validator = SchemaValidator(schema_path)
        
        # 3. Initialize the Router with the Bus and Validator
        self.router = IMFRouter(self.bus, self.validator)
        
        # 4. Setup the Loader to scan your specific modular directories
        self.loader = PluginLoader(self.bus, self.router)
        
        # Runtime state
        self.base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    async def bootstrap(self):
        print(f"[*] Starting Infinity Host at {self.base_dir}")
        
        # Loading sequence: Adapters -> Plugins -> Interfaces
        # This order ensures capabilities exist before plugins try to use them.
        for folder in ["adapters", "plugins", "interfaces"]:
            target_path = os.path.join(self.base_dir, folder)
            if os.path.exists(target_path):
                print(f"[!] Loading {folder}...")
                await self.loader.load_from_dir(target_path)
        
        # Broadcast that the system is fully converged
        await self.bus.publish("system.state", {"status": "ready", "version": "1.0.0-skeleton"})
        print("[+] Infinity Switching Station is LIVE.")

    async def run_forever(self):
        await self.bootstrap()
        try:
            # Keep the loop alive while the bus processes messages
            while True:
                await asyncio.sleep(3600)
        except asyncio.CancelledError:
            print("[!] Shutdown signal received.")
        finally:
            await self.shutdown()

    async def shutdown(self):
        print("[*] Performing clean exit...")
        # Add cleanup logic for bus/router here if needed
        pass

if __name__ == "__main__":
    # Ensure the runtime directory is in the path for modular imports
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    
    host = InfinityHost()
    try:
        asyncio.run(host.run_forever())
    except KeyboardInterrupt:
        pass
