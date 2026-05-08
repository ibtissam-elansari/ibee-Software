# ibee-ai/src/utils/paths.py
"""
Centralised path resolver for the ibee-ai module.
Works whether called from notebooks/, src/, or project root.
"""
from pathlib import Path


def _find_root(marker: str = "data") -> Path:
    """Walk up from this file until we find the ibee-ai root (contains 'data/')."""
    p = Path(__file__).resolve()
    for parent in p.parents:
        if (parent / marker).is_dir() and (parent / "notebooks").is_dir():
            return parent
    raise RuntimeError("Cannot locate ibee-ai root. Make sure 'data/' and 'notebooks/' exist.")


ROOT = _find_root()

# ── Data ──────────────────────────────────────────────────────────────────────
DATA_RAW       = ROOT / "data" / "raw"
DATA_PROCESSED = ROOT / "data" / "processed"

# ── Key files ─────────────────────────────────────────────────────────────────
SIMULATED_CSV        = DATA_PROCESSED / "simulated_dataset.csv"
FEATURES_CSV         = DATA_PROCESSED / "features_dataset.csv"
FEATURES_PARQUET     = DATA_PROCESSED / "features_dataset.parquet"

# ── Reports ───────────────────────────────────────────────────────────────────
REPORTS_FIGURES = ROOT / "reports" / "figures"
REPORTS_FIGURES.mkdir(parents=True, exist_ok=True)