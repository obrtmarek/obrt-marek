#!/usr/bin/env python3

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path

# Get the directory containing this script
current_dir = Path(__file__).parent

# Create FastAPI app
app = FastAPI()

# Mount static files from the current directory
app.mount("/", StaticFiles(directory=current_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
