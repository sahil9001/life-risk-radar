# Deploying Life Risk Radar to Railway

This guide outlines how to deploy **Life Risk Radar** to Railway with a fully functional, live **Coral CLI** setup (unlike Render or standard cloud deployments where the CLI cannot run).

---

## How it Works

1. **Docker Container Builder**: Railway builds the application using the custom [Dockerfile](file:///Users/ssilare/dev/coral-hackathon/Dockerfile) rather than standard Nixpacks.
2. **GLIBC 2.39+ Support**: We use Ubuntu 24.04 as our base image to satisfy GLIBC 2.39 dependencies required by the Linux x86_64 Coral binary.
3. **Coral Version 0.2.1**: Downloads and configures the exact version of the Coral CLI compatible with the project's `backend: jsonl` manifest declarations.
4. **Seeding at Build Time**: Runs `npm run seed:local` inside the container build process to populate `sample-data/*.jsonl` tables.
5. **Dynamic Path Resolution**: Since Coral JSONL sources require absolute paths, [start.sh](file:///Users/ssilare/dev/coral-hackathon/start.sh) runs a Node.js utility at container startup to dynamically rewrite the `location` references in `manifest.yaml` to point to the correct path in the container (`/app/sample-data/`).
6. **Runtime Registration**: Registers the schema tables in the container's environment so they are immediately queryable.

---

## Deployment Steps

### 1. Push to GitHub
Commit and push the new files to your GitHub repository:
- `Dockerfile`
- `railway.json`
- `start.sh`

### 2. Deploy on Railway
1. Go to [railway.app](https://railway.app) and create a **New Project**.
2. Select **Deploy from GitHub repo** and choose your repository.
3. Railway will automatically read `railway.json`, select the Docker builder, and build the container.

### 3. Add Environment Variables
In your Railway Service under the **Variables** tab, add the following variables:

| Variable Name | Description | Required? |
| :--- | :--- | :--- |
| `PORT` | Set to `3000` (matches Next.js port and the Dockerfile EXPOSE statement) | Yes |
| `CORAL_CONFIG_DIR` | Set to `/app/.coral-config` | Yes |
| `ANTHROPIC_API_KEY` | Your Anthropic API Key (required to translate custom typed questions into Coral SQL) | Optional (Required for custom questions) |
| `GMAIL_ACCESS_TOKEN` | OAuth token for Gmail (if you want to test live Gmail queries via Coral CLI) | Optional |

### 4. Configure Networking
Under the **Settings** tab in your Railway service:
- Go to **Networking** -> click **Generate Domain**
- Verify that it points to port `3000` (which is the default Next.js port).

---

## Troubleshooting & Debugging

| Symptom | Cause | Resolution |
| :--- | :--- | :--- |
| **`Schema 'life_files' not found`** | The Coral sources were not registered at startup or config paths mismatch. | Check the Railway logs. Ensure `start.sh` ran successfully and registered the `life_files` manifest. |
| **`Next.js app not starting` / Port errors** | Next.js is trying to use a different port than EXPOSE or Railway's routing. | Ensure `PORT` is set to `3000` in the Railway variables. |
| **Free-form questions return static templates** | Missing Anthropic key in environment. | Ensure `ANTHROPIC_API_KEY` is added to Railway environment variables. |
