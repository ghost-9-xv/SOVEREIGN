"""Security enforcement, permission authorization, least privilege, and sanitization."""

from dataclasses import dataclass, field
from typing import Any, List, Optional, Set


class SecurityViolationError(PermissionError):
    """Raised when an operation violates mandatory security policy."""
    pass


@dataclass
class SecurityPolicy:
    allowed_permissions: Set[str] = field(default_factory=set)
    restricted_paths: List[str] = field(default_factory=list)
    allow_external_network: bool = False
    allow_code_execution: bool = False
    immutable_rules: List[str] = field(default_factory=list)


class SecurityManager:
    def __init__(self, policy: Optional[SecurityPolicy] = None):
        self.policy = policy or SecurityPolicy(allowed_permissions={"read_file", "write_file", "execute_test"})

    def check_permission(self, required_permission: str) -> bool:
        """Check if required permission is present in policy."""
        return required_permission in self.policy.allowed_permissions

    def enforce_permission(self, required_permission: str) -> None:
        """Enforce permission, raising SecurityViolationError if missing."""
        if not self.check_permission(required_permission):
            raise SecurityViolationError(f"Security Violation: Permission '{required_permission}' is not granted.")

    def sanitize_input(self, text: str) -> str:
        """Sanitize input against path traversal attacks by URL decoding and iteratively stripping traversal patterns."""
        import urllib.parse
        prev = None
        max_iterations = 50
        iterations = 0
        while text != prev and iterations < max_iterations:
            prev = text
            text = urllib.parse.unquote(text)
            text = text.replace("../", "").replace("..\\", "")
            iterations += 1
        if text == ".." or text.startswith("../") or text.startswith("..\\"):
            text = text.replace("..", "")
        return text

    def validate_action(self, action_name: str, required_perm: str) -> None:
        """Validate action against permissions."""
        self.enforce_permission(required_perm)
