#!/bin/sh
set -e

# Replace environment variables in JavaScript files
# This allows runtime configuration of the built app
if [ -n "$VITE_API_URL" ]; then
    echo "Injecting VITE_API_URL: $VITE_API_URL"
    find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|REPLACE_VITE_API_URL|$VITE_API_URL|g" {} +
fi

# Execute the CMD
exec "$@"
