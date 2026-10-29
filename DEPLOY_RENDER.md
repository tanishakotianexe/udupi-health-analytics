# Render deployment

This project includes a root `render.yaml` Blueprint and `Dockerfile.render` for one free Docker web service. Connect the GitHub repository containing this project, choose the branch that includes `render.yaml`, and deploy the Blueprint. Render builds React and serves the resulting files and Express API from one URL.

The free service may sleep after inactivity. The first request after it wakes can take around a minute. Uploaded datasets are held in memory and reset on restart; login accounts are browser-local. Use demo data only.

For local Docker Compose setup, see `README.md`.
