import requests
import os
from PIL import Image, ImageDraw, ImageFont

url = "http://localhost:8000/api/upload/image"

# Create an image with actual text
img = Image.new('RGB', (400, 100), color = 'white')
d = ImageDraw.Draw(img)
# Use default font or a known one. On Windows, 'arial.ttf' is usually available.
try:
    font = ImageFont.truetype("arial.ttf", 24)
except:
    font = None # Fallback to default

d.text((10,10), "Hello FlashMind", fill=(0,0,0), font=font)
img.save('test_text.png')

with open('test_text.png', 'rb') as f:
    files = {'file': ('test_text.png', f, 'image/png')}
    try:
        print(f"Sending POST request to {url} with text image...")
        response = requests.post(url, files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

os.remove('test_text.png')
