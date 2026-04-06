import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-1.5-flash")
try:
    response = model.generate_content("Hello")
    print(response.text)
except Exception as e:
    print(f"Error for gemini-1.5-flash: {e}")

model_pro = genai.GenerativeModel("gemini-1.5-pro")
try:
    response = model_pro.generate_content("Hello")
    print(f"Pro response: {response.text}")
except Exception as e:
    print(f"Error for gemini-1.5-pro: {e}")
