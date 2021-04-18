#!/bin/bash
# Setup xvfb (virtual x server)
export DISPLAY=:1
Xvfb :1 -screen 0 1920x1080x24 &
node server.js
exec bash