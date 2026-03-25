import abc
import logging

class InfinityComponent(abc.ABC):
    """
    The Universal Socket.
    All pluggable modules must inherit from this to ensure lifecycle compatibility.
    """
    def __init__(self, bus, router):
        self.bus = bus
        self.router = router
        self.identity = self.__class__.__name__.lower()
        self.logger = logging.getLogger(f"infinity.{self.identity}")

    @abc.abstractmethod
    async def on_load(self):
        """Discovered: Register capabilities here."""
        pass

    @abc.abstractmethod
    async def on_start(self):
        """Live: Start listeners or background tasks."""
        pass

    @abc.abstractmethod
    async def on_stop(self):
        """Shutdown: Clean up resources."""
        pass

class Adapter(InfinityComponent):
    """Bridges: Bus <-> System/Shell/API."""
    pass

class Interface(InfinityComponent):
    """Interactions: Bus <-> User (CLI/TUI)."""
    pass
