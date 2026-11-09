#!/bin/bash
# Arma dodoli-windows.zip para llevar a la laptop del doctor (sin node_modules, .env ni respaldos).
set -e
cd "$(dirname "$0")"
(cd frontend && npm run build)
rm -rf /tmp/dodoli-pkg && mkdir -p /tmp/dodoli-pkg/Dodoli/frontend
rsync -a --exclude node_modules/ --exclude .env --exclude respaldos/ backend windows /tmp/dodoli-pkg/Dodoli/
cp -r frontend/dist /tmp/dodoli-pkg/Dodoli/frontend/
rm -f dodoli-windows.zip && (cd /tmp/dodoli-pkg && zip -qr "$OLDPWD/dodoli-windows.zip" Dodoli)
echo "✓ $(pwd)/dodoli-windows.zip"
