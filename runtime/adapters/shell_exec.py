import subprocess
import asyncio
from core.base import Adapter

class ShellExec(Adapter):
    """
    The System Bridge.
    Provides safe shell execution capabilities to the Infinity Bus.
    """
    async def on_load(self):
        # Register the capability with the router so others know we can do this
        print(f"[*] {self.identity}: Registering capability 'sys.shell'")
        await self.router.register_capability(self.identity, ["sys.shell"])

    async def on_start(self):
        # Subscribe to any 'query' type messages requesting 'sys.shell'
        print(f"[+] {self.identity}: Listening for shell requests...")
        await self.bus.subscribe("query.sys.shell", self.handle_shell_request)

    async def handle_shell_request(self, envelope):
        cmd = envelope.get("payload", {}).get("command")
        context_id = envelope.get("context_id")
        
        if not cmd:
            return

        try:
            # Run the command asynchronously to avoid blocking the bus
            process = await asyncio.create_subprocess_shell(
                cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            
            result = {
                "stdout": stdout.decode().strip(),
                "stderr": stderr.decode().strip(),
                "exit_code": process.returncode
            }
            
            # Send the result back to the bus
            await self.bus.publish(f"response.{context_id}", result)
            
        except Exception as e:
            await self.bus.publish(f"event.error.{context_id}", {"error": str(e)})

    async def on_stop(self):
        print(f"[*] {self.identity}: Shutting down shell adapter.")
