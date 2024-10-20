# api/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from routers import auth, stripe_integration, function_management, evaluation_endpoints, aether_api_endpoints
from config import HOST, PORT

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(stripe_integration.router)
app.include_router(function_management.router)
app.include_router(evaluation_endpoints.router)
app.include_router(aether_api_endpoints.router)

if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT)
