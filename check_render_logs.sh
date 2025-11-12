#!/bin/bash
# 🔥 DIVINE: Check Render backend logs for credential save issues

echo "🔍 Fetching last 50 logs from Render backend..."
echo ""

curl -s "https://api.render.com/v1/services/srv-d3vrrns9c44c738skalg/logs?limit=50" \
  -H "Authorization: Bearer rnd_Il2IDV3qyOkyQYgb0ttLWPikIQJi" \
  -H "Accept: application/json" | \
  jq -r '.[] | "\(.timestamp | fromdateiso8601 | strftime("%Y-%m-%d %H:%M:%S")) | \(.message)"' | \
  grep -E "(vapi|twilio|commit|error|failed|rollback)" || echo "No matching logs found"

echo ""
echo "✅ Done. Look for 'commit', 'error', or 'failed' keywords"
