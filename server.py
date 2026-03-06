#!/usr/bin/env python3

import http.server
import socketserver
import os
from pathlib import Path

# Change to the directory containing this script
os.chdir(Path(__file__).parent)

# Configure the server
PORT = 8080
HANDLER = http.server.SimpleHTTPRequestHandler

# Create the server
with socketserver.TCPServer(("", PORT), HANDLER) as httpd:
    print(f"Server running at http://localhost:{PORT}/")
    print(f"Serving files from: {os.getcwd()}")
    print("Press Ctrl+C to stop the server")
    httpd.serve_forever()
