## 2026-10-29 - Schema Validation Requirement Set Caching
**Learning:** Frequent tool executions re-read list values from input schema dictionaries on every validation call, creating unnecessary dictionary lookups and list conversions.
**Action:** Cache schema requirement sets on contract initialization or first validation to enable O(1) set operations.
