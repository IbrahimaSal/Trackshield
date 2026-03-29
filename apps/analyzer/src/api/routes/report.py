from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()


@router.post("")
async def generate_report() -> JSONResponse:
    return JSONResponse({"status": "not implemented"}, status_code=501)
