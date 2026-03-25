import asyncio
import sys
import uuid
from core.base import Interface

class TerminalCLI(Interface):
    """
    The primary User Interface plugin.
    Captures stdin and routes intent to the Bus.
    """
    async def on_load(self):
        pass

    async def on_start(self):
        # We wait for the 'system.state' to be 'ready' before starting the prompt
        await self.bus.subscribe("system.state", self.check_system_ready)

    async def check_system_ready(self, msg):
        if msg.get("status") == "ready":
            # Start the interactive loop in the background
            asyncio.create_task(self.interactive_loop())

    async def interactive_loop(self):
        print("\n--- Infinity CLI Active (Type 'exit' to quit) ---")
        while True:
            # Run blocking input() in a thread to keep the event loop alive
            user_input = await asyncio.to_thread(input, "infinity> ")
            
            if user_input.lower() in ["exit", "quit"]:
                print("[!] Stopping Infinity...")
                sys.exit(0)

            if not user_input.strip():
                continue

            # Create a unique context for this command
            context_id = str(uuid.uuid4())[:8]
            
            # Subscribe to the response before sending the query
            await self.bus.subscribe(f"response.{context_id}", self.display_result)

            # Drop the command on the bus as a query
            await self.bus.publish("query.sys.shell", {
                "context_id": context_id,
                "payload": {"command": user_input}
            })

    async def display_result(self, result):
        if result.get("stdout"):
            print(f"\n{result['stdout']}")
        if result.get("stderr"):
            print(f"\nERROR: {result['stderr']}", file=sys.stderr)
        
    async def on_stop(self):
        pass
