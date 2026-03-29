from abc import ABC, abstractmethod
from src.domain.models import PiiMatch


class PiiDetectorABC(ABC):
    @abstractmethod
    def detect(self, url: str, body: str | None = None) -> list[PiiMatch]:
        ...
