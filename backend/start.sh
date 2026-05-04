#!/bin/sh
# backend/start.sh
# Railway executes this instead of CMD in Dockerfile
# Prints debug info to logs before starting uvicorn

echo "=== IBEE STARTUP ==="
echo "ENV: ${ENV:-not set}"

# Show DB URL scheme without exposing password
DB_SCHEME=$(python3 -c "
import os
url = os.getenv('DATABASE_URL', 'NOT_SET')
if '://' in url:
    print(url.split('://')[0])
else:
    print('NO_DATABASE_URL')
")
echo "DATABASE_URL scheme (raw): $DB_SCHEME"

# Test that settings.py parses correctly
python3 -c "
from app.core.settings import settings
scheme = settings.database_url.split('://')[0]
print(f'DATABASE_URL scheme (after fix): {scheme}')
print(f'CORS origins: {settings.allowed_origins}')
print('Settings OK')
"

if [ $? -ne 0 ]; then
  echo "ERROR: settings.py failed to load — check DATABASE_URL and other env vars"
  exit 1
fi

echo "Starting uvicorn on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"