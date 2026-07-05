import time
import threading
import uuid

# In-memory dictionary: Dict[session_id, {"df": pd.DataFrame, "results": list, "summary": dict, "mapping_report": dict, "created_at": float}]
_sessions = {}
_lock = threading.Lock()

def get_session(session_id: str):
    with _lock:
        return _sessions.get(session_id)

def set_session(session_id: str, data: dict):
    with _lock:
        if session_id not in _sessions:
            _sessions[session_id] = {}
        _sessions[session_id].update(data)
        _sessions[session_id]["created_at"] = time.time()

def create_session(df) -> str:
    session_id = str(uuid.uuid4())
    with _lock:
        _sessions[session_id] = {
            "df": df,
            "results": None,
            "summary": None,
            "mapping_report": None,
            "created_at": time.time()
        }
    return session_id

def clean_expired_sessions(ttl_seconds=3600):
    """Background loop to delete sessions older than TTL."""
    while True:
        time.sleep(60)
        now = time.time()
        expired_ids = []
        with _lock:
            for s_id, session_data in list(_sessions.items()):
                if now - session_data.get("created_at", 0) > ttl_seconds:
                    expired_ids.append(s_id)
            for s_id in expired_ids:
                print(f"[SESSION CLEANER] Expired and purged session {s_id}")
                del _sessions[s_id]

# Start cleaner thread
_cleaner = threading.Thread(target=clean_expired_sessions, daemon=True)
_cleaner.start()
