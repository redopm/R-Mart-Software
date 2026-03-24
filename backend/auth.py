import os
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
import models

# --- Firebase Admin SDK Initialization ---
# This runs once when the module is first imported by FastAPI.
_firebase_initialized = False

def _init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return
    
    # Look for the service account key file in the current directory
    key_file = None
    for f in os.listdir("."):
        if f.endswith(".json") and "firebase" in f.lower():
            key_file = f
            break
    
    if not key_file:
        print("WARNING: No Firebase service account JSON found in backend directory!")
        print("         Firebase token verification will fail.")
        print("         Please place your Firebase Admin SDK JSON file in the backend/ folder.")
        _firebase_initialized = True  # Don't retry
        return
    
    try:
        cred = credentials.Certificate(key_file)
        firebase_admin.initialize_app(cred)
        print(f"Firebase Admin SDK initialized with: {key_file}")
    except ValueError:
        # Already initialized (e.g., during hot-reload)
        pass
    except Exception as e:
        print(f"ERROR initializing Firebase Admin SDK: {e}")
    
    _firebase_initialized = True

# Initialize on module load
_init_firebase()

# --- Auth Dependency ---
security = HTTPBearer(auto_error=True)

def get_current_user(
    auth_credentials: HTTPAuthorizationCredentials = Depends(security), 
    db: Session = Depends(get_db)
):
    """
    Verifies the Firebase ID token from the Authorization header.
    If the user doesn't exist in our local DB yet, we auto-create them
    so that Sales can be properly linked to a user_id.
    """
    token = auth_credentials.credentials
    
    try:
        # Verify the Firebase JWT — this checks signature, expiry, and issuer
        decoded_token = firebase_auth.verify_id_token(token)
    except firebase_auth.ExpiredIdTokenError:
        print("AUTH ERROR: Token has expired")
        raise HTTPException(
            status_code=401,
            detail="Token has expired. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except firebase_auth.RevokedIdTokenError:
        print("AUTH ERROR: Token has been revoked")
        raise HTTPException(
            status_code=401,
            detail="Token has been revoked. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except firebase_admin.exceptions.InvalidArgumentError as e:
        print(f"AUTH ERROR: Invalid argument: {e}")
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token format: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        print(f"AUTH ERROR: Unexpected error type={type(e).__name__}, message={e}")
        print(f"AUTH ERROR: Token (first 50 chars): {token[:50]}...")
        raise HTTPException(
            status_code=401,
            detail=f"Authentication failed: {type(e).__name__}: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Token is valid — extract user info
    uid = decoded_token['uid']
    email = decoded_token.get('email', f"{uid}@chhotashop.local")
    
    # Sync Firebase User with our Local Database
    user = db.query(models.User).filter(models.User.username == email).first()
    if not user:
        user = models.User(
            username=email, 
            hashed_password="firebase_managed",  # Not used, Firebase handles auth
            role=models.UserRole.ADMIN  # Default role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"New user auto-synced from Firebase: {email}")
        
    return user
