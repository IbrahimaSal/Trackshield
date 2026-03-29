from abc import ABC, abstractmethod
from src.domain.models import TrackerMatch


class TrackerClassifierABC(ABC):
    @abstractmethod
    def classify(self, domain: str) -> TrackerMatch | None:
        ...
