"""
Message Encryption Service for end-to-end encrypted chat
Uses RSA + AES hybrid encryption
"""
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
import base64
import os


class MessageEncryptionService:
    """Handles end-to-end encryption for chat messages"""
    
    @staticmethod
    def generate_user_keys():
        """
        Generate RSA key pair for a user
        Returns: (public_key_pem, private_key_pem)
        """
        # Generate 2048-bit RSA key pair
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        public_key = private_key.public_key()
        
        # Serialize to PEM format
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()  # No password protection here
        ).decode('utf-8')
        
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')
        
        return public_pem, private_pem
    
    @staticmethod
    def encrypt_message(content, recipient_public_keys):
        """
        Encrypt message with AES, then encrypt AES key with each recipient's RSA public key
        
        Args:
            content: str - The message content to encrypt
            recipient_public_keys: dict - {user_id: public_key_pem}
        
        Returns:
            dict: {'encrypted_content': base64_str, 'encrypted_keys': {user_id: encrypted_aes_key}}
        """
        # Generate random AES key (256-bit) and IV (128-bit)
        aes_key = os.urandom(32)
        iv = os.urandom(16)
        
        # Pad content to AES block size (16 bytes)
        content_bytes = content.encode('utf-8')
        block_size = 16
        padding_length = block_size - (len(content_bytes) % block_size)
        padded_content = content_bytes + bytes([padding_length] * padding_length)
        
        # Encrypt content with AES-CBC
        cipher = Cipher(
            algorithms.AES(aes_key),
            modes.CBC(iv),
            backend=default_backend()
        )
        encryptor = cipher.encryptor()
        encrypted_content = encryptor.update(padded_content) + encryptor.finalize()
        
        # Combine IV and encrypted content
        encrypted_data = iv + encrypted_content
        encrypted_content_b64 = base64.b64encode(encrypted_data).decode('utf-8')
        
        # Encrypt AES key for each recipient
        encrypted_keys = {}
        for user_id, public_key_pem in recipient_public_keys.items():
            # Load public key
            public_key = serialization.load_pem_public_key(
                public_key_pem.encode('utf-8'),
                backend=default_backend()
            )
            
            # Encrypt AES key with RSA-OAEP
            encrypted_aes_key = public_key.encrypt(
                aes_key,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            
            encrypted_keys[str(user_id)] = base64.b64encode(encrypted_aes_key).decode('utf-8')
        
        return {
            'encrypted_content': encrypted_content_b64,
            'encrypted_keys': encrypted_keys
        }
    
    @staticmethod
    def decrypt_message(encrypted_content_b64, encrypted_aes_key_b64, private_key_pem):
        """
        Decrypt message using user's private key
        
        Args:
            encrypted_content_b64: str - Base64 encoded encrypted content
            encrypted_aes_key_b64: str - Base64 encoded encrypted AES key
            private_key_pem: str - User's private key in PEM format
        
        Returns:
            str: Decrypted message content
        """
        # Load private key
        private_key = serialization.load_pem_private_key(
            private_key_pem.encode('utf-8'),
            password=None,
            backend=default_backend()
        )
        
        # Decrypt AES key with RSA
        encrypted_aes_key = base64.b64decode(encrypted_aes_key_b64)
        aes_key = private_key.decrypt(
            encrypted_aes_key,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        # Decode encrypted content
        encrypted_data = base64.b64decode(encrypted_content_b64)
        iv = encrypted_data[:16]
        encrypted_content = encrypted_data[16:]
        
        # Decrypt content with AES-CBC
        cipher = Cipher(
            algorithms.AES(aes_key),
            modes.CBC(iv),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()
        padded_content = decryptor.update(encrypted_content) + decryptor.finalize()
        
        # Remove PKCS7 padding
        padding_length = padded_content[-1]
        content = padded_content[:-padding_length]
        
        return content.decode('utf-8')
