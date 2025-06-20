from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

# routers
from routers import merchandise

app = FastAPI(title="IMS Merchandise API")

# include routers
app.include_router(merchandise.router, prefix='/merchandise', tags=['merchandise'])

# CORS setup to allow frontend and backend on ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # ims frontend
        "http://192.168.100.10:3000",  # ims frontend (local network)
        "http://127.0.0.1:4000",  # auth service
        "http://localhost:4000",  
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# run app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", port=8004, host="127.0.0.1", reload=True)
