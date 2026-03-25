"""
FlashMind — Upload Router
Handles PDF, image (OCR), voice (STT), and text input.
"""
import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models import UploadResponse

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/text", response_model=UploadResponse)
async def upload_text(text: str = ""):
    """Direct text paste input."""
    if not text.strip():
        raise HTTPException(400, "Empty text input.")
    return UploadResponse(text=text.strip(), filename="direct_paste")


@router.post("/pdf", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """Extract text from PDF using PyMuPDF."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Please upload a PDF file.")

    try:
        import fitz  # PyMuPDF

        content = await file.read()
        with tempfile.NamedTemporaryFile(mode="wb", suffix=".pdf", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        doc = fitz.open(tmp_path)
        text_parts = []
        for page in doc:
            text_parts.append(page.get_text())
        doc.close()
        os.unlink(tmp_path)

        full_text = "\n".join(text_parts).strip()
        if not full_text:
            raise HTTPException(422, "Could not extract text from PDF.")

        return UploadResponse(text=full_text, filename=file.filename)

    except ImportError:
        raise HTTPException(500, "PyMuPDF not installed. Run: pip install PyMuPDF")
    except Exception as e:
        raise HTTPException(500, f"PDF processing error: {str(e)}")


@router.post("/image", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    """Extract text from image using EasyOCR."""
    allowed = {".png", ".jpg", ".jpeg", ".bmp", ".webp", ".tiff"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed:
        raise HTTPException(400, f"Unsupported image format. Allowed: {allowed}")

    try:
        import easyocr
        import torch

        content = await file.read()
        with tempfile.NamedTemporaryFile(mode="wb", suffix=ext, delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        print(f"DEBUG: Processing OCR for {file.filename}")
        # Initialize reader (In production, this should be done once globally)
        reader = easyocr.Reader(["en", "hi"], gpu=torch.cuda.is_available())
        results = reader.readtext(tmp_path, detail=0)
        os.unlink(tmp_path)

        full_text = "\n".join(results).strip()
        if not full_text:
            raise HTTPException(422, "Could not extract text from image.")

        return UploadResponse(text=full_text, filename=file.filename, language="en+hi")

    except HTTPException:
        raise
    except ImportError as e:
        print(f"ERROR: OCR ImportError: {str(e)}")
        raise HTTPException(500, f"Missing dependency for OCR: {str(e)}")
    except Exception as e:
        print(f"ERROR: OCR processing failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"OCR error: {str(e)}")


@router.post("/voice", response_model=UploadResponse)
async def upload_voice(file: UploadFile = File(...)):
    """Transcribe voice to text using faster-whisper."""
    allowed = {".wav", ".mp3", ".m4a", ".ogg", ".webm", ".flac"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed:
        raise HTTPException(400, f"Unsupported audio format. Allowed: {allowed}")

    try:
        from faster_whisper import WhisperModel

        content = await file.read()
        with tempfile.NamedTemporaryFile(mode="wb", suffix=ext, delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        model = WhisperModel("base", device="cpu", compute_type="int8")
        segments, _info = model.transcribe(tmp_path, language="en")
        text_parts = [seg.text for seg in segments]
        os.unlink(tmp_path)

        full_text = " ".join(text_parts).strip()
        if not full_text:
            raise HTTPException(422, "Could not transcribe audio.")

        return UploadResponse(text=full_text, filename=file.filename)

    except ImportError:
        raise HTTPException(500, "faster-whisper not installed. Run: pip install faster-whisper")
    except Exception as e:
        raise HTTPException(500, f"Transcription error: {str(e)}")
