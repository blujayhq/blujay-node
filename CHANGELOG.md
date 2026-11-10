# Changelog

All notable changes to this library are listed here. It follows [semantic versioning](https://semver.org).

## 1.0.0 (2026-11-10)

First release, covering the full Blujay API v1:

- Chats: create (with a phone number, or an email address over iMessage), list, read, mark as read, typing indicators; in iMessage groups, rename, group photo, leave and participants
- Messages: send text, attachments, voice memos, contact cards and links; list, read, edit, unsend, threaded replies, and reactions (tapbacks and emoji)
- Phone numbers, including Name and Photo Sharing, and iMessage and capability checks
- Team members you can assign contacts to
- Contacts (first and last names, and whether someone saved them), notes, tags, assignment, opt-outs and workflows
- Attachments and vCards
- Call recordings
- Webhook subscriptions, deliveries and replays
- Webhook signature verification (`verifyWebhook`), with events typed by `event_type`
- Runs on Node.js 20+, Bun, Deno, Cloudflare Workers and Vercel Edge
- Automatic paging, retries for reads, and typed errors with `code`, `traceId`, `retryable` and `retryAfter`
