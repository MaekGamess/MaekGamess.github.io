@echo off
title HYPERNOVA dev server
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8137"
  node .serve.js 8137
  goto :eof
)
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8137"
  py -3 -m http.server 8137
  goto :eof
)
echo Node or Python not found. Install one, or run any static server in this folder.
pause
