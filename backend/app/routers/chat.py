from fastapi import APIRouter, HTTPException
from app.models import ChatRequest, ChatResponse
from app import ai_service, session_store

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/", response_model=ChatResponse)
async def chat_with_fmai(req: ChatRequest):
    """
    Clear doubts with FMAI assistant using local LLM.
    """
    try:
        response_text, updated_history = await ai_service.chat_with_ai(req)
        
        # If a session exists, we could potentially log this, but for now we just return the result
        return ChatResponse(response=response_text, history=updated_history)
        
    except Exception as e:
        print(f"[Chat Router] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
