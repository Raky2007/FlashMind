import ollama
import sys

MODEL_NAME = "qwen2.5:0.5b"

def test_qwen_flashmind():
    print(f"🔌 Testing connection to local Ollama server...")
    try:
        models = ollama.list()
        model_names = [m.get('model', m.get('name')) for m in models.get('models', [])]
        print("✅ Ollama is reachable.")
        
        if not any(MODEL_NAME in name for name in model_names):
            print(f"⚠️ Model '{MODEL_NAME}' not found.")
            print(f"⏳ Attempting to pull {MODEL_NAME} (this might take a minute)...")
            ollama.pull(MODEL_NAME)
            print("✅ Model pulled successfully.")
        else:
            print(f"✅ Model '{MODEL_NAME}' is available.")
            
        print("\n🧠 Testing FlashMind flashcard generation with Qwen2.5-0.5B...")
        system_prompt = (
            "You are FlashMind, an expert tutor creating flashcards. Target audience level: school. "
            "RULES: Generate exactly 1 flashcard from the provided text. ONLY generate 'mcq'. "
            "You must provide exactly 4 options. Return ONLY valid JSON array."
        )
        user_text = "Photosynthesis is the process by which green plants and certain other organisms use the energy of light to convert carbon dioxide and water into the simple sugar glucose."
        
        print("\nSending prompt to model...")
        response = ollama.chat(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text},
            ],
            options={"temperature": 0.7}
        )
        
        content = response.get("message", {}).get("content", "")
        print("\n✨ Response from Qwen2.5-0.5B:")
        print("-" * 40)
        print(content)
        print("-" * 40)
        print("✅ Test completed successfully. The model is ready for FlashMind!")
        
    except Exception as e:
        print(f"❌ Error connecting to Ollama or running the model:\n{e}")
        print("\nPlease ensure Ollama is installed and running on your system (http://localhost:11434).")
        sys.exit(1)

if __name__ == "__main__":
    test_qwen_flashmind()
