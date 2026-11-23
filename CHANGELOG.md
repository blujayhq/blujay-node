# Changelog

All notable changes to this library are listed here. It follows [semantic versioning](https://semver.org).

## 1.1.0 (2026-11-23)

Phone number health now matches what the API returns:

- `health_status` has a `status` (`healthy`, `degraded` or `critical`), plus a `reason_code` and a `reason` you can show your users when it isn't `healthy`. The reason codes are `low_reply_rate`, `new_contacts_slowed` and `apple_flag`.
- Removed `score`, `as_of` and `freshness`, and the `unknown` status. The API no longer returns them, so code that read them was already getting nothing.
- SMS and MMS messages can carry up to 25 MiB of files (was 5 MiB).

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
