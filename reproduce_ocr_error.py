import requests
import os

url = "http://localhost:8000/api/upload/image"
# Create a dummy image file for testing
from PIL import Image
img = Image.new('RGB', (100, 100), color = 'white')
img.save('test_upload.png')

with open('test_upload.png', 'rb') as f:
    files = {'file': ('test_upload.png', f, 'image/png')}
    try:
        print(f"Sending POST request to {url}...")
        response = requests.post(url, files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

os.remove('test_upload.png')
