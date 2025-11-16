"""
Gunicorn Configuration for Production ML API Deployment on Render
"""

import os
import multiprocessing

# Server socket
# Render sets PORT environment variable, default to 5000 for local testing
ml_port = os.environ.get('ML_PORT', '5000')
bind = f"0.0.0.0:{ml_port}"

# Worker processes
# Use 2-4 workers for ML API (balance between performance and memory)
workers = 2
worker_class = "sync"  # Synchronous workers work well for ML predictions
threads = 2  # 2 threads per worker

# Timeouts
timeout = 120  # 2 minutes - ML predictions can take time
keepalive = 5  # Keep-alive connections for 5 seconds
graceful_timeout = 30  # Graceful shutdown timeout

# Logging
accesslog = "-"  # Log access to stdout
errorlog = "-"   # Log errors to stderr
loglevel = "info"  # Log level (debug, info, warning, error, critical)

# Process naming
proc_name = "prediction_ml_api"

# Preload application
# IMPORTANT: This loads the ML model once before forking workers
# Saves memory and startup time by sharing the model across workers
preload_app = True

# Worker restart configuration
# Restart workers after handling this many requests
# Prevents memory leaks from accumulating
max_requests = 1000
max_requests_jitter = 50  # Add randomness to avoid all workers restarting at once

# Server mechanics
daemon = False  # Don't daemonize (Render needs foreground process)
pidfile = None  # Don't create PID file
umask = 0  # File mode creation mask
user = None  # Run as current user
group = None  # Run as current group
tmp_upload_dir = None  # Use default temp directory

# SSL (not needed on Render - they handle SSL termination)
keyfile = None
certfile = None

# Debugging
reload = False  # Don't auto-reload on code changes in production
reload_engine = 'auto'

# Logging format
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

def on_starting(server):
    """
    Called just before the master process is initialized
    """
    print("="*60)
    print("GRACEFULLIVING ML API - Starting")
    print("="*60)
    print(f"Workers: {workers}")
    print(f"Threads per worker: {threads}")
    print(f"Binding to: {bind}")
    print(f"Timeout: {timeout}s")
    print(f"Preload app: {preload_app}")
    print("="*60)

def on_reload(server):
    """
    Called to recycle workers during a reload
    """
    print("Reloading workers...")

def when_ready(server):
    """
    Called just after the server is started
    """
    print("Server is ready. Accepting connections.")

def pre_fork(server, worker):
    """
    Called just before a worker is forked
    """
    pass

def post_fork(server, worker):
    """
    Called just after a worker has been forked
    """
    print(f"Worker spawned (pid: {worker.pid})")

def pre_exec(server):
    """
    Called just before a new master process is forked
    """
    print("Forking new master process")

def worker_int(worker):
    """
    Called when a worker receives the INT or QUIT signal
    """
    print(f"Worker {worker.pid} received INT/QUIT signal")

def worker_abort(worker):
    """
    Called when a worker receives the SIGABRT signal
    """
    print(f"Worker {worker.pid} received SIGABRT signal")

