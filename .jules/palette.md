## 2026-10-29 - Structured Evaluation Summaries for Agent Runtimes
**Learning:** Agent runtimes require clear, human-readable summary outputs from evaluation reports to quickly parse task completion and compliance status without inspecting nested dataclass attributes.
**Action:** Provide explicit `format_summary()` methods on result objects returned across agent capabilities.
