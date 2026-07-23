import sys
import os

# Adjust path to import backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key present: {bool(api_key)}")
if api_key:
    # Print length and first/last characters for validation without exposing it completely
    print(f"API Key info: length={len(api_key)}, starts with='{api_key[:6]}', ends with='{api_key[-4:]}'")

try:
    from google import genai
    print("google-genai package imported successfully.")
except ImportError as e:
    print(f"Failed to import google-genai: {e}")
    sys.exit(1)

if not api_key:
    print("Error: GEMINI_API_KEY is not defined in the environment or .env file.")
    sys.exit(1)

try:
    print("Initializing genai Client and calling gemini-2.5-flash...")
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents='Write a 3-word confirmation that you can read this message.'
    )
    print("Success! Gemini response:")
    print(response.text)
except Exception as e:
    print(f"Failed to invoke Gemini API: {type(e).__name__}: {e}")
    sys.exit(1)
