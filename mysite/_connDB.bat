@echo off
cd /d %~dp0
cd ../
call init.bat
if exist "%cd%\python\python.exe" (
"%cd%/Python/python.exe" "%cd%/ConnDb.py" conndb
) else (
"%cd%/Python37/python.exe" "%cd%/ConnDb.py" conndb
)
