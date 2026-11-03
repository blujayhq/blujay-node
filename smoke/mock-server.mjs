// Local stand-in for api.blujay.io: returns envelope-shaped responses and logs
// every request so the quickstarts can be checked without a real API key.
import http from 'node:http';
import fs from 'node:fs';
const log = process.argv[2];
const ok = (data, status = 200) => [status, { status: 'success', data, trace_id: 'trc_mock', timestamp: '2026-10-17T17:00:00.000Z' }];
const messages = { QUEUE_UNAVAILABLE: 'Sending is paused for a moment. Try again shortly.', UNAUTHORIZED: 'Authentication failed', RATE_LIMITED: 'Too many requests' };
const fail = (status, code) => [status, { status: 'error', error: { code, message: messages[code] ?? code, type: 'queue', http_status: status, retryable: true, doc_url: `https://docs.blujay.io/errors/${code.toLowerCase().replaceAll('_', '-')}`, details: [] }, trace_id: 'trc_mock', timestamp: '2026-10-17T17:00:00.000Z' }];
const chat = id => ({ chat_id: id, type: 'direct', participants: [] });
const counts = {};
http.createServer((req, res) => {
  let body = '';
  req.on('data', c => (body += c));
  req.on('end', () => {
    const url = new URL(req.url, 'http://x');
    const key = `${req.method} ${url.pathname}`;
    counts[key] = (counts[key] ?? 0) + 1;
    fs.appendFileSync(log, JSON.stringify({ key, query: url.search, auth: req.headers.authorization, idem: req.headers['idempotency-key'] ?? null, body: body || null, n: counts[key] }) + '\n');
    let out;
    if (key === 'GET /v1/me') out = ok({ workspace_id: 'ws_123', workspace_label: 'Northwind', credential: { type: 'api_key' } });
    else if (key === 'GET /v1/chats' && url.searchParams.get('cursor') === 'page2') out = ok({ data: [chat('chat_3')], has_more: false, limit: 2 });
    else if (key === 'GET /v1/chats') out = ok({ data: [chat('chat_1'), chat('chat_2')], next_cursor: 'page2', has_more: true, limit: 2 });
    else if (key === 'GET /v1/chats/chat_flaky') out = counts[key] === 1 ? fail(503, 'QUEUE_UNAVAILABLE') : ok(chat('chat_flaky'));
    else if (key === 'POST /v1/chats/chat_down/messages') out = fail(503, 'QUEUE_UNAVAILABLE');
    else if (key === 'PATCH /v1/messages/msg_down') out = fail(503, 'QUEUE_UNAVAILABLE');
    else if (key === 'GET /v1/chats/chat_unauth') out = fail(401, 'UNAUTHORIZED');
    else if (key === 'GET /v1/messages/msg_limited') out = fail(429, 'RATE_LIMITED');
    else if (key === 'POST /v1/chats') out = ok({ chat_id: 'chat_new', message: { id: 'msg_1', direction: 'outbound', delivery_status: 'queued', service: null, from: '+15555550100', to: ['+15555550123'], created_at: '2026-10-17T17:00:00.000Z', parts: [] } }, 202);
    else if (key === 'GET /v1/messages/msg_1') out = ok({ message_id: 'msg_1', chat_id: 'chat_new', phone_number_id: 'phone_1', direction: 'outbound', preferred_service: null, service: 'imessage', status: 'sent', parts: [], degradations: [], reply_to: null, sent_at: '2026-10-17T17:00:01.000Z', delivered_at: null, read_at: null, failed_at: null, failure: null });
    else if (key === 'POST /v1/chats/chat_abc123/messages') out = ok({ chat_id: 'chat_abc123', message: { id: 'msg_1', direction: 'outbound', delivery_status: 'queued', service: 'imessage', from: '+15555550100' } }, 202);
    else out = fail(404, 'NOT_FOUND');
    res.writeHead(out[0], { 'content-type': 'application/json', 'retry-after': '0' });
    res.end(JSON.stringify(out[1]));
  });
}).listen(4010, '127.0.0.1', () => console.log('mock listening'));
