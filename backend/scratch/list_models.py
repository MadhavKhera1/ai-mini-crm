import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

try:
    from google import genai
    client = genai.Client(api_key=api_key)
    print("Listing available models:")
    for model in client.models.list():
        print(f"- {model.name} (supported: {model.supported_actions})")
except Exception as e:
    print(f"Failed to list models: {e}")
