# Docker deployment

Install Docker Desktop and start Docker Engine. From this folder run:

```sh
docker compose up --build -d
```

Open `http://localhost:8081`. Check the API at `http://localhost:4001/api/health`.

Stop the services with:

```sh
docker compose down
```

## Sharing with your teacher

`localhost` is only reachable on the computer running Docker. To provide an internet-accessible link, deploy this Compose project on a public VM/server with Docker installed, then share that server's public URL/IP. A public domain and HTTPS are recommended. Do not upload patient-identifiable or other sensitive data to a public demo.

The app's signup/login is browser-local for this project demo; accounts are not centrally managed across devices. Uploaded datasets are held in the API process memory and reset when the API container restarts.

