from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=[])


def _handle_rate_limit_exceeded(request: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, RateLimitExceeded):
        raise exc
    response = _rate_limit_exceeded_handler(request, exc)
    return JSONResponse(
        status_code=response.status_code,
        content={
            "type": "about:blank#rate_limited",
            "title": "Too Many Requests",
            "status": response.status_code,
            "detail": "Rate limit exceeded. Slow down and try again later.",
        },
        headers=dict(response.headers),
    )


def register_rate_limit(app: FastAPI) -> None:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _handle_rate_limit_exceeded)
    app.add_middleware(SlowAPIMiddleware)
