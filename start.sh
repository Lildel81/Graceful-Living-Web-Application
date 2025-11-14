#!/usr/bin/env sh
set -e

# starts gunicorn
cd /app/ml_model
gunicorn -c gunicorn_config.py ml_api:app &

# start node in main app
cd /app
node index.js
