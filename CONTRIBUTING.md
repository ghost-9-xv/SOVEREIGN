# Contributing to SOVEREIGN

Thank you for your interest in contributing to SOVEREIGN!

## Fundamental Principles

1. **Evidence before confidence**: All pull requests must include tests and evidence demonstrating correctness.
2. **Deterministic security**: Security enforcement must be deterministic.
3. **Minimalism**: Do not introduce unnecessary dependencies or speculative abstractions.

## Development Setup

1. Clone the repository.
2. Install in editable mode with dev dependencies:
   ```bash
   pip install -e ".[dev]"
   ```
3. Run tests before submitting:
   ```bash
   pytest
   ```

## Pull Request Checklist

- [ ] Code follows project style guidelines and language idioms.
- [ ] New features or fixes include tests covering success, failure, and edge cases.
- [ ] Acceptance criteria and documentation are updated where applicable.
- [ ] Security rules are preserved and verified.
