import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.models import GenerateRequest, UserLevel, Difficulty
from app.ai_service import generate_flashcards

async def main():
    srctxt = """
    Python is a high-level, general-purpose programming language. Its design philosophy emphasizes code readability with the use of significant indentation.
    Python is dynamically typed and garbage-collected. It supports multiple programming paradigms, including structured (particularly procedural), object-oriented and functional programming.
    It is often described as a "batteries included" language due to its comprehensive standard library.
    Guido van Rossum began working on Python in the late 1980s as a successor to the ABC programming language and first released it in 1991 as Python 0.9.0.
    Python 2.0 was released in 2000 and introduced new features such as list comprehensions, cycle-detecting garbage collection, reference counting, and Unicode support.
    Python 3.0, released in 2008, was a major revision that is not completely backward-compatible with earlier versions.
    Python consistently ranks as one of the most popular programming languages.
    Pip is the standard package manager for Python. It allows you to install and manage additional libraries and dependencies that are not part of the standard library.
    PyPI (the Python Package Index) is the official repository for third-party Python software.
    Virtual environments are highly recommended in Python to isolate project-specific dependencies. Environments can be created using modules like venv or virtualenv.
    """
    # Request 10 cards
    req = GenerateRequest(
        text=srctxt, 
        level=UserLevel.ENGINEER, 
        difficulty=Difficulty.MEDIUM, 
        subject="Python History & Features", 
        num_cards=10
    )
    
    print(f"Requesting {req.num_cards} flashcards from AI Service...")
    cards = await generate_flashcards(req)
    
    print(f"\n--- GENERATED {len(cards)} CARDS ---")
    for i, card in enumerate(cards):
        print(f"\n[{i+1}] {card.front}")
        print(f"    Answer: {card.back}")
        print(f"    Options: {card.options}")
        
    # Validations
    has_question_marks = all(c.front.strip().endswith('?') for c in cards)
    has_forbidden = any(any(f in str(c.options).lower() for f in ["all of the above", "none of the above"]) for c in cards)
    
    print("\n--- VALIDATION RESULTS ---")
    print(f"Requested: {req.num_cards}, Received: {len(cards)}")
    print(f"All end in '?': {has_question_marks}")
    print(f"Contains 'All of the above'/'None of the above': {has_forbidden}")

if __name__ == "__main__":
    asyncio.run(main())
