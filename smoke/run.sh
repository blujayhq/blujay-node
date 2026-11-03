#!/usr/bin/env bash
# Installs the packed library the way a customer would and runs the quickstart
# against a local stand-in for api.blujay.io. No real API key is used.
set -euo pipefail
repo="$(cd "$(dirname "$0")/.." && pwd)"
work="$(mktemp -d)"
(cd "$repo" && npm pack --silent --pack-destination "$work" >/dev/null)
cd "$work"
echo '{"type":"module"}' > package.json
npm install --silent ./blujay-*.tgz
cp "$repo/smoke/quickstart.ts" .
node "$repo/smoke/mock-server.mjs" "$work/requests.log" & mock=$!
trap 'kill $mock' EXIT
sleep 1
export BLUJAY_API_KEY=blu_test BLUJAY_BASE_URL=http://127.0.0.1:4010
out="$(node quickstart.ts)"
echo "$out"
node -e 'const { BlujayClient } = require("blujay"); new BlujayClient({ baseUrl: process.env.BLUJAY_BASE_URL }).me.get().then(r => console.log("require:", r.data.workspace_label))'
grep -q "chat: chat_3" <<<"$out"
grep -q "flaky chat after retry: chat_flaky" <<<"$out"
grep -q "send failed: 503 QUEUE_UNAVAILABLE" <<<"$out"
grep -q "error message: 503 QUEUE_UNAVAILABLE: Sending is paused for a moment. Try again shortly. (trace_id trc_mock)" <<<"$out"
grep -q "edit failed: 503" <<<"$out"
grep -q "pages: 2" <<<"$out"
grep -q "error class: UnauthorizedError" <<<"$out"
grep -q "error class: TooManyRequestsError" <<<"$out"
grep -q "fetch send status: 503" <<<"$out"
grep -q "fetch default url: https://api.blujay.io/v1/me" <<<"$out"
# Writes are never retried: the send (and, in TypeScript, the client.fetch() send) once each, the edit once.
test "$(grep -c '"key":"POST /v1/chats/chat_down/messages"' requests.log)" = 2
test "$(grep -c '"key":"PATCH /v1/messages/msg_down"' requests.log)" = 1
test "$(grep -c '"key":"GET /v1/chats/chat_flaky"' requests.log)" = 2
grep -q '"key":"POST /v1/chats/chat_abc123/messages".*"idem":"[^"]' requests.log
echo "smoke: ok"
