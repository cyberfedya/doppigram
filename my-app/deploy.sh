#!/bin/bash
# Deploy script: builds frontend and deploys to Netlify
# Run on SERVER (where cloudflared is running) or locally
# Usage: ./deploy.sh

set -e

DEPLOY_DIR="/home/rootvest/doppigram-deploy"

# 1. Build
echo "Building..."
npm run build

# 2. Get tunnel URL and write _redirects
TUNNEL_URL=$(ssh -o StrictHostKeyChecking=no rootvest@100.113.170.36 \
    "journalctl -u cloudflared -n 50 --no-pager 2>/dev/null | grep -oP 'https://[a-z0-9\-]+\.trycloudflare\.com' | tail -1")

if [ -n "$TUNNEL_URL" ]; then
    echo "Using tunnel: $TUNNEL_URL"
    cat > dist/_redirects << EOF
/api/*   ${TUNNEL_URL}/api/:splat   200!
/hubs/*  ${TUNNEL_URL}/hubs/:splat  200!
/*       /index.html                200
EOF
else
    echo "Warning: No tunnel URL found, deploying without API proxy"
    cat > dist/_redirects << EOF
/*  /index.html  200
EOF
fi

# 3. Deploy
netlify deploy --dir=dist --prod --no-build
echo "Done! https://doppigram.netlify.app"
