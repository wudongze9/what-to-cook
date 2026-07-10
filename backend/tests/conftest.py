import os
import sys
import tempfile
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

TEST_DB = Path(tempfile.gettempdir()) / "whattocook-tests.db"
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["APP_ENV"] = "test"
os.environ["JWT_SECRET"] = "test-secret-that-is-long-enough-for-repeatable-tests"
os.environ["DATABASE_PATH"] = str(TEST_DB)
os.environ["CORS_ORIGINS"] = "http://testserver"

