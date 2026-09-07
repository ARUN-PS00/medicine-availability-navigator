import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Locate project root and load .env file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
ENV_PATH = os.path.join(PROJECT_ROOT, ".env")

if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH)
else:
    load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    """
    Initializes and returns the Supabase client instance.
    Raises ValueError if SUPABASE_URL or SUPABASE_KEY is missing.
    """
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set in .env")

    _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase_client


def is_supabase_configured() -> bool:
    """
    Safely checks if Supabase credentials are path-configured and non-empty.
    """
    return bool(SUPABASE_URL and SUPABASE_KEY)
