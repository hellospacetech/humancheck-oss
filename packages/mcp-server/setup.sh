#!/bin/bash
# HumanCheckMe MCP Setup — tek komutla Claude Code'a entegre et

set -e

MCP_LAUNCHER="$(cd "$(dirname "$0")" && pwd)/launch.sh"
API_URL="${HUMANCHECK_API_URL:-http://localhost:3010}"
API_KEY="${HUMANCHECK_API_KEY:-}"

# Renk
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${GREEN}HumanCheckMe${NC} — MCP Setup"
echo "─────────────────────────────"

# API key yoksa iste
if [ -z "$API_KEY" ]; then
  echo ""
  echo -e "${YELLOW}API key gerekli.${NC}"
  echo "Dashboard'dan al: Login → Profile → Generate API Key"
  echo "veya terminal'den:"
  echo "  curl -s -c /tmp/hcm.txt -X POST $API_URL/api/auth/sign-in/email \\"
  echo "    -H 'Content-Type: application/json' \\"
  echo "    -d '{\"email\":\"EMAIL\",\"password\":\"PASS\"}'"
  echo "  curl -s -b /tmp/hcm.txt -X POST $API_URL/api/v1/users/me/api-key"
  echo ""
  read -p "API Key: " API_KEY
  if [ -z "$API_KEY" ]; then
    echo "API key boş. Çıkılıyor."
    exit 1
  fi
fi

# Test connection
echo ""
echo "Bağlantı test ediliyor..."
HEALTH=$(curl -s "$API_URL/api/health" 2>/dev/null || echo '{"status":"fail"}')
if echo "$HEALTH" | grep -q '"ok"'; then
  echo -e "  ${GREEN}✓${NC} Server erişilebilir"
else
  echo "  ✗ Server'a ulaşılamıyor: $API_URL"
  echo "  Server'ı başlat: cd human-check-systems && set -a && source .env && set +a && npm run dev:server"
  exit 1
fi

# API key test
AUTH_TEST=$(curl -s -H "Authorization: Bearer $API_KEY" "$API_URL/api/v1/projects" 2>/dev/null || echo "fail")
if echo "$AUTH_TEST" | grep -q '"id"' || echo "$AUTH_TEST" | grep -q '^\['; then
  echo -e "  ${GREEN}✓${NC} API key geçerli"
else
  echo "  ✗ API key geçersiz"
  exit 1
fi

# Claude Code settings dosyasını bul/oluştur
CLAUDE_DIR=".claude"
SETTINGS_FILE="$CLAUDE_DIR/settings.json"

mkdir -p "$CLAUDE_DIR"

if [ -f "$SETTINGS_FILE" ]; then
  # Mevcut dosyaya MCP ekle
  python3 -c "
import json, sys

with open('$SETTINGS_FILE', 'r') as f:
    settings = json.load(f)

if 'mcpServers' not in settings:
    settings['mcpServers'] = {}

settings['mcpServers']['humancheckme'] = {
    'command': 'bash',
    'args': ['$MCP_LAUNCHER'],
    'env': {
        'HUMANCHECK_API_URL': '$API_URL',
        'HUMANCHECK_API_KEY': '$API_KEY'
    }
}

with open('$SETTINGS_FILE', 'w') as f:
    json.dump(settings, f, indent=2)

print('  Mevcut settings.json güncellendi')
"
else
  # Yeni dosya oluştur
  cat > "$SETTINGS_FILE" << SETTINGSEOF
{
  "mcpServers": {
    "humancheckme": {
      "command": "bash",
      "args": ["$MCP_LAUNCHER"],
      "env": {
        "HUMANCHECK_API_URL": "$API_URL",
        "HUMANCHECK_API_KEY": "$API_KEY"
      }
    }
  }
}
SETTINGSEOF
  echo "  Yeni settings.json oluşturuldu"
fi

echo ""
echo -e "${GREEN}✓ Kurulum tamamlandı!${NC}"
echo ""
echo "Şimdi Claude Code'u başlat:"
echo "  claude"
echo ""
echo "Ve de ki:"
echo '  "Login akışlarımı HumanCheckMe ile test et"'
echo ""
