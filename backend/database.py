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
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_PUBLISHABLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

_supabase_client: Client | None = None
_supabase_service_client: Client | None = None


def get_supabase_client() -> Client:
    """
    Initializes and returns the standard Supabase client instance.
    Raises ValueError if SUPABASE_URL or SUPABASE_KEY is missing.
    """
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set in .env")

    _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase_client


def get_supabase_service_client() -> Client:
    """
    Initializes and returns the Supabase administrative client instance using the service-role key.
    Falls back to standard client if service-role key is not configured.
    """
    global _supabase_service_client

    if _supabase_service_client is not None:
        return _supabase_service_client

    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
        _supabase_service_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        return _supabase_service_client

    return get_supabase_client()


def is_supabase_configured() -> bool:
    """
    Safely checks if Supabase credentials are path-configured and non-empty.
    """
    return bool(SUPABASE_URL and SUPABASE_KEY)

