"""
Run the daily Green Hydrogen Price Index update.
"""

import sys
from pathlib import Path


# Add the project root and app directory to Python path.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
APP_DIRECTORY = PROJECT_ROOT / "app"

sys.path.insert(0, str(APP_DIRECTORY))


from data_service import update_history


if __name__ == "__main__":
    update_history()