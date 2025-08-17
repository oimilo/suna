#!/usr/bin/env python
"""
Worker starter script for DigitalOcean deployment
"""
import sys
import os

# Add backend to Python path
sys.path.insert(0, '/workspace/backend')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Now import and run the worker
import run_agent_background

if __name__ == "__main__":
    # Import dramatiq CLI and run
    from dramatiq.cli import main
    sys.argv = ['dramatiq', 'run_agent_background', '--processes', '2', '--threads', '4']
    main()