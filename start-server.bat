@echo off
echo Starting Haba Manager...
echo.
echo Make sure Python is installed on your system.
echo If you don't have Python, download it from: https://www.python.org/downloads/
echo.
echo Starting web server on http://localhost:8888
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8888
pause