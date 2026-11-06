@echo off
cd /d %~dp0
sc stop bio-apache0
sc start bio-apache0