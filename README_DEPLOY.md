# Deployment Notes

The `setup.py` file has been renamed to `setup.py.bak` because it's an interactive setup wizard that doesn't work in automated deployment environments like DigitalOcean App Platform.

For deployment, use the `backend/requirements.txt` file which contains all necessary dependencies.

To run the setup wizard locally, rename `setup.py.bak` back to `setup.py`.