#!/bin/bash

echo "Starting Life Risk Radar on Railway..."

# Map the CORAL_CONFIG_DIR env var to a writeable local directory in our app folder
export CORAL_CONFIG_DIR="${CORAL_CONFIG_DIR:-$(pwd)/.coral-config}"
mkdir -p "$CORAL_CONFIG_DIR"

# Dynamically update the manifest file's location paths to point to the current container directory
echo "Dynamically updating manifest.yaml locations..."
node -e "
const fs = require('fs');
const path = require('path');
const manifestPath = path.join(process.cwd(), 'sources', 'life_files', 'manifest.yaml');
if (fs.existsSync(manifestPath)) {
  let content = fs.readFileSync(manifestPath, 'utf8');
  content = content.replace(/location:\s*file:\/\/\/[^\s]+/g, 'location: file://' + path.join(process.cwd(), 'sample-data') + '/');
  fs.writeFileSync(manifestPath, content, 'utf8');
  console.log('Updated manifest.yaml paths to: file://' + path.join(process.cwd(), 'sample-data') + '/');
} else {
  console.error('manifest.yaml not found at ' + manifestPath);
}
"

# Register Coral sources at runtime using the environment secrets
echo "Registering Coral sources..."

if ! coral source add --file sources/life_files/manifest.yaml; then
  echo "Warning: Failed to register life_files source."
fi

# Optionally register Gmail if user provides credentials
if [ -n "$GMAIL_ACCESS_TOKEN" ]; then
  if ! coral source add --file sources/gmail/manifest.yaml; then
    echo "Warning: Failed to register gmail source."
  fi
else
  echo "Skipped registering gmail source (GMAIL_ACCESS_TOKEN not set)."
fi

# Start Next.js server
echo "Starting Next.js server..."
npm start
