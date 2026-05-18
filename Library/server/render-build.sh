#!/usr/bin/env bash
# Optional: Render Build Command = bash render-build.sh
set -e
npm install
if [ -f "../src/data/catalog.json" ]; then
  echo "catalog.json OK ($(node -e "console.log(JSON.parse(require('fs').readFileSync('../src/data/catalog.json')).books.length)") books)"
else
  echo "ERROR: ../src/data/catalog.json missing. Commit it or run import-books locally."
  exit 1
fi
