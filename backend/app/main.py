"""
FlashMind — FastAPI Application
Main entry point with CORS, routers, and export endpoints.
"""
import json
import csv
import io
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from app.routers import upload, generate, quiz, chat
from app import session_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("FlashMind backend starting...")
    yield
    print("FlashMind backend shutting down.")


app = FastAPI(
    title="FlashMind API",
    description="AI-Powered Flashcard & Quiz Generator",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(upload.router, prefix="/api")
app.include_router(generate.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


# Serve static files for frontend — ONLY on production/deployment
static_dir = os.path.join(os.getcwd(), "static")
if os.path.exists(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")

    @app.get("/")
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str = ""):
        # If the path is for /api, don't serve static files (routers take precedence, but this is a fallback)
        if full_path.startswith("api/"):
             raise HTTPException(404)
        
        # Check if the file exists in static (e.g., favicon.ico, robots.txt)
        file_path = os.path.join(static_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Default to index.html for SPA routing
        index_path = os.path.join(static_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        
        raise HTTPException(404, "Frontend build not found.")


# ---------- Health & utility endpoints ----------

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "FlashMind API", "version": "1.0.0"}


@app.get("/api/export/{session_id}")
async def export_session(session_id: str, format: str = "json"):
    """Export flashcards as JSON, CSV, or Anki-compatible TSV."""
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found.")

    cards = session.flashcards

    if format == "json":
        data = [c.model_dump() for c in cards]
        return StreamingResponse(
            io.BytesIO(json.dumps(data, indent=2).encode()),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=flashmind_{session_id}.json"},
        )

    elif format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Front", "Back", "Type", "Difficulty", "Tags"])
        for c in cards:
            writer.writerow([c.front, c.back, c.type.value, c.difficulty.value, "; ".join(c.tags)])
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=flashmind_{session_id}.csv"},
        )

    elif format == "anki":
        # Anki TSV format: front\tback
        lines = [f"{c.front}\t{c.back}" for c in cards]
        content = "\n".join(lines)
        return StreamingResponse(
            io.BytesIO(content.encode()),
            media_type="text/tab-separated-values",
            headers={"Content-Disposition": f"attachment; filename=flashmind_{session_id}.txt"},
        )

    raise HTTPException(400, "Format must be json, csv, or anki.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
