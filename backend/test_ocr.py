import easyocr
import os

try:
    print("Initializing Reader...")
    reader = easyocr.Reader(['en', 'hi'], gpu=False)
    print("Reader initialized successfully!")
except Exception as e:
    print(f"Failed to initialize Reader: {e}")
