import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

from google import genai
client = genai.Client(api_key=api_key)

models_to_test = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-2.0-flash']

for model_name in models_to_test:
    print(f"Testing model: {model_name}...")
    try:
        response = client.models.generate_content(
            model=model_name,
            contents='Write a 3-word confirmation.'
        )
        print(f"-> Success with {model_name}: {response.text.strip()}")
        sys.exit(0)
    except Exception as e:
        print(f"-> Failed with {model_name}: {e}")

print("All models failed.")
sys.exit(1)
