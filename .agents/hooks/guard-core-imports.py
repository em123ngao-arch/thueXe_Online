#!/usr/bin/env python3
"""PreToolUse guard: keep framework imports out of the `domain` layer.

`domain` is pure Java business models and policies. ArchUnit enforces this
(ArchitectureRulesTest rules 1-2); this hook catches violations immediately.
"""

import json
import re
import sys

CORE_PATH = re.compile(r"(^|[/\\])(com[/\\]driveshare[/\\]modules[/\\][^/\\]+[/\\]domain|core[/\\]src)[/\\]")

FORBIDDEN = re.compile(
    r"""(?x)
    org\.springframework
  | jakarta\.persistence | javax\.persistence | org\.hibernate
  | jakarta\.servlet      | javax\.servlet
  | jakarta\.validation   | javax\.validation
  | io\.jsonwebtoken
  | com\.fasterxml\.jackson
    """
)


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    tool_input = payload.get("tool_input") or {}
    path = tool_input.get("file_path") or ""

    if not CORE_PATH.search(path):
        return 0

    # Write carries `content`; Edit carries `new_string`. Check both, plus the
    # file_path itself so a Write whose content is empty is still evaluated.
    blob = "\n".join(
        str(tool_input.get(key, "")) for key in ("content", "new_string", "old_string")
    )

    hits = sorted({m.group(0) for m in FORBIDDEN.finditer(blob)})
    if not hits:
        return 0

    json.dump(
        {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": (
                    "Blocked: "
                    + ", ".join(hits)
                    + " cannot appear in the `domain` layer. `domain` must be pure Java 21 with no "
                    "Spring, JPA, validation, servlet or Jackson. Introduce an Inbound/Outbound Port in "
                    "`application.port` and implement the infrastructure logic under `adapter`."
                ),
            }
        },
        sys.stdout,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
