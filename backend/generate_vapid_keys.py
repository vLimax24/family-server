#!/usr/bin/env python3
"""
Generate VAPID keys for web push notifications
"""
from py_vapid import Vapid01
import os
from pathlib import Path

def generate_keys():
    # Determine correct path based on environment
    if os.path.exists('/app'):
        key_path = '/app/private_key.pem'
    else:
        key_path = str(Path(__file__).parent / 'private_key.pem')
    
    # Check if key already exists
    if os.path.exists(key_path):
        response = input(f"Key file already exists at {key_path}. Overwrite? (yes/no): ")
        if response.lower() != 'yes':
            print("Aborted.")
            return
        os.remove(key_path)
    
    # Generate new VAPID key pair
    print("Generating new VAPID keys...")
    vapid = Vapid01()
    vapid.generate_keys()
    vapid.save_key(key_path)
    
    print(f"✓ Private key saved to: {key_path}")
    
    # Display public key for verification
    from cryptography.hazmat.primitives import serialization
    import base64
    
    public_bytes = vapid.public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )
    public_b64 = base64.urlsafe_b64encode(public_bytes).rstrip(b'=').decode('utf-8')
    
    print(f"✓ Public key (base64url): {public_b64}")
    print("\nVAPID keys generated successfully!")
    print(f"The server will use: {key_path}")

if __name__ == "__main__":
    generate_keys()