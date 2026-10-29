## 2026-10-29 - Recursive Path Traversal Filter Bypass
**Vulnerability:** Single-pass string replacements of `../` and `..\` in input sanitizers can be bypassed using nested or interleaved sequences like `..././` or `....//`.
**Learning:** Naive replacement of forbidden substrings creates new forbidden substrings if executed only once.
**Prevention:** Use fixed-point iterative loops or standardized canonical path checks when sanitizing user input against path traversal.
