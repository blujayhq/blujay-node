# Reference
## Me
<details><summary><code>client.me.<a href="/src/api/resources/me/client/Client.ts">get</a>() -> Blujay.MeGetResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns the workspace and the API key that authenticated this request. Call it to confirm your key works.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.me.get();

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**requestOptions:** `MeClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Chats
<details><summary><code>client.chats.<a href="/src/api/resources/chats/client/Client.ts">list</a>({ ...params }) -> core.Page&lt;Blujay.Chat, Blujay.ChatListResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns the chats in your workspace, most recently active first, one page at a time. Pass `next_cursor` from the previous page as `cursor` to get the next page, with the same `to` and `from`.

Use `to` to find your chats with one person, direct and group, and `from` to list the chats on one of your phone numbers. A filter that matches nothing returns an empty list.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
const pageableResponse = await client.chats.list({
    to: "+15555550123",
    from: "+15555550100"
});
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.chats.list({
    to: "+15555550123",
    from: "+15555550100"
});
while (page.hasNextPage()) {
    page = await page.getNextPage();
}

// You can also access the underlying response
const response = page.response;

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.ChatListParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ChatsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.chats.<a href="/src/api/resources/chats/client/Client.ts">create</a>({ ...params }) -> Blujay.ChatCreateResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Starts a chat from one of your Blujay numbers and sends its first message. One recipient in `to` creates a direct chat; two or more create a group chat.

For a direct chat you can leave out `from`, and Blujay picks the number. It uses the number this person already knows you on. If they've never texted any of your numbers, it uses your only number, or else the default line of the teammate the contact is assigned to. If none of those apply, the request returns `422 FROM_NUMBER_REQUIRED` and Blujay never guesses. A group chat always needs `from`.

Blujay returns `202` as soon as the message is accepted and sends it in the background. Follow its progress with message webhooks or `GET /v1/messages/{message_id}`.

The first message has some limits (see the sending rules at https://docs.blujay.io/messaging/sending-rules):
- A link part returns `400 FIRST_MESSAGE_LINK_NOT_ALLOWED`. A URL in the text returns the same error until the person has replied to the sending number; after that it's accepted, even when this request sends into a chat that already exists. A send to several people starts a new group, so a URL there is always refused.
- Until the contact replies, `media`, `vcard` and `audio` parts return `400 PRE_REPLY_CONTENT_BLOCKED` and text is limited to 300 characters (`400 PRE_REPLY_LENGTH_EXCEEDED`). A first message is text only.
- `reply_to` isn't accepted (`400 VALIDATION_ERROR`), and message effects and text decorations return `400 FEATURE_NOT_ENABLED`.

Send an `Idempotency-Key` header (or `message.idempotency_key`) so you can safely retry. Repeating a request with the same key returns `200` with the original response instead of sending again.

Errors worth handling:
- `403 RECIPIENT_SUPPRESSED`: the recipient opted out.
- `403 CONTACT_NOT_VERIFIED`: on the Free Plan, the contact hasn't texted your Free Plan number to verify yet.
- `403 CONTACT_MUST_TEXT_FIRST`: the number is on the AI Agent plan: it only replies to people who text it first, and can't send to group chats.
- `422 FROM_NUMBER_REQUIRED`: you left out `from` and Blujay couldn't tell which number to use. `error.message` names the fix, such as setting a default line for the assigned teammate in Team Members.
- `400 EMAIL_REQUIRES_IMESSAGE`: an email address with `preferred_service` `SMS` or `RCS`, or a new group with an email address that would be an SMS group because someone in it can't get iMessages.

An email address in `to` is texted over iMessage only. If it isn't on iMessage, the message is accepted and then fails with `failure.code` `recipient_unavailable` and the reason "The email address isn't on iMessage, so it can't get texts." Check first with `POST /v1/capability/evaluate_service`. Free Plan shared numbers can't text email addresses (`400 FEATURE_NOT_ENABLED`).
- `429 RATE_LIMIT_EXCEEDED` or `429 QUEUE_FULL`: the sending number hit a limit. Wait `Retry-After` seconds. Each number's current limits are in `GET /v1/phone-numbers` under `limits`.
- `503 QUEUE_UNAVAILABLE`: Blujay couldn't accept the message right now. Retry with the same `Idempotency-Key`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.chats.create({
    from: "+15555550100",
    to: ["+15555550123"],
    message: {
        parts: [{
                type: "text",
                text: "Hi Ava, this is Sam from the Northwind support team."
            }]
    }
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.ChatCreateParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ChatsClient.IdempotentRequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.chats.<a href="/src/api/resources/chats/client/Client.ts">get</a>({ ...params }) -> Blujay.ChatGetResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns one chat in your workspace.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.chats.get({
    chat_id: "chat_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.ChatGetParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ChatsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.chats.<a href="/src/api/resources/chats/client/Client.ts">update</a>({ ...params }) -> Blujay.ChatUpdateResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Changes one thing about an active iMessage group chat: its name (`display_name`) or its photo (`group_chat_icon`). Everyone in the group sees the change. Blujay returns `202` once your phone number has accepted it.

For the photo, upload a JPEG or PNG with `POST /v1/attachments` first, then send `group_chat_icon: { "attachment_id": "att_..." }`. Blujay reduces the image to the size iMessage uses. Send `group_chat_icon: null` to remove the photo. Read the current photo back from `icon` on `GET /v1/chats/{chat_id}`.

Send `display_name` or `group_chat_icon`, not both (`400 VALIDATION_ERROR`). You can't clear a group name. If the chat isn't an active iMessage group, you get `400 UNSUPPORTED_CHAT_OPERATION`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.chats.update({
    chat_id: "chat_abc123",
    display_name: "Project kickoff"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.ChatUpdateParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ChatsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.chats.<a href="/src/api/resources/chats/client/Client.ts">downloadIcon</a>({ ...params }) -> core.BinaryResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns the group's current photo as an image. `icon.download_url` on `GET /v1/chats/{chat_id}` points here. Authenticate the same way as any other API call. A chat with no photo, a direct chat, or a chat outside your workspace returns `404 NOT_FOUND`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.chats.downloadIcon({
    chat_id: "chat_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.ChatDownloadIconParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ChatsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.chats.<a href="/src/api/resources/chats/client/Client.ts">leave</a>({ ...params }) -> Blujay.ChatLeaveResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Removes one of your Blujay numbers from an active iMessage group chat. If more than one of your numbers is in the group, set `from_phone_number_id` to choose which one leaves; otherwise you can send an empty body.

Errors worth handling (all `409`):
- `LAST_PHONE_NUMBER_IN_GROUP`: this is your only number in the group, so it can't leave.
- `GROUP_MINIMUM_PARTICIPANTS`: leaving would leave the group with fewer than three members.
- `PHONE_NUMBER_HAS_SCHEDULED_MESSAGES`: the number has scheduled messages for this group.
- `PHONE_NUMBER_HAS_MESSAGES_SENDING`: the number still has messages sending in this group. Retry once they finish.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.chats.leave({
    chat_id: "chat_abc123",
    from_phone_number_id: "phone_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.ChatLeaveParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ChatsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.chats.<a href="/src/api/resources/chats/client/Client.ts">markRead</a>({ ...params }) -> void</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Marks the chat's incoming messages as read in Blujay. In direct iMessage and RCS chats, Blujay also sends a read receipt when it can. SMS and group chats are only marked read in Blujay. A `204` means the request was accepted; it doesn't confirm that the other person sees a read receipt.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.chats.markRead({
    chat_id: "chat_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.ChatMarkReadParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ChatsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Messages
<details><summary><code>client.messages.<a href="/src/api/resources/messages/client/Client.ts">list</a>({ ...params }) -> core.Page&lt;Blujay.Message, Blujay.MessageListResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns messages across all chats in your workspace, one page at a time, most recently updated first. Filter by `status`, or by `updated_after` to pick up changes since your last sync. Sort a page by `created_at` to display messages in order.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
const pageableResponse = await client.messages.list({
    updated_after: "2026-10-14T17:01:00Z"
});
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.messages.list({
    updated_after: "2026-10-14T17:01:00Z"
});
while (page.hasNextPage()) {
    page = await page.getNextPage();
}

// You can also access the underlying response
const response = page.response;

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.MessageListParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `MessagesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.messages.<a href="/src/api/resources/messages/client/Client.ts">get</a>({ ...params }) -> Blujay.MessageGetResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns one message, including its current status and the service that carried it. Add `include=edit_history` to get earlier versions of an edited message.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.messages.get({
    message_id: "msg_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.MessageGetParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `MessagesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.messages.<a href="/src/api/resources/messages/client/Client.ts">edit</a>({ ...params }) -> Blujay.MessageEditResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Changes the text of an iMessage you sent from this workspace. The edit also shows on the recipient's device.

Apple's limits apply: you can edit a message within 15 minutes of sending it, up to 5 times. Only text-only messages can be edited, so `part_index` is always `0`.

If the message already has the text you send, Blujay returns the message without editing it again. Send an `Idempotency-Key` so a retry after a lost response is safe.

To hear about every edit, including edits your contacts make, subscribe to the `message.edited` webhook.

If editing is switched off for your workspace, the request returns `400 FEATURE_NOT_ENABLED`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.messages.edit({
    message_id: "msg_abc123",
    text: "See you at 4 instead"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.MessageEditParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `MessagesClient.IdempotentRequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.messages.<a href="/src/api/resources/messages/client/Client.ts">listThread</a>({ ...params }) -> core.Page&lt;Blujay.Message, Blujay.MessageListThreadResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Given any message in an iMessage reply thread, returns the original message and every reply, including replies that are still sending. Reactions are never part of a thread.

A message that isn't in a thread, or a reaction, returns only itself. One request covers at most the 1,000 nearest messages in the thread, in the order you ask for.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
const pageableResponse = await client.messages.listThread({
    message_id: "msg_abc123"
});
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.messages.listThread({
    message_id: "msg_abc123"
});
while (page.hasNextPage()) {
    page = await page.getNextPage();
}

// You can also access the underlying response
const response = page.response;

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.MessageListThreadParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `MessagesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.messages.<a href="/src/api/resources/messages/client/Client.ts">unsend</a>({ ...params }) -> Blujay.MessageUnsendResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Unsends a text-only iMessage you sent from this workspace. Apple allows this within 2 minutes of sending. Recipients on older Apple software may still see the message.

The message stays readable through the API with `unsent_at` and `unsent_scope` set, and its text is removed from `parts`. The unsent text is never returned. Repeating an unsend returns the current message. Send an `Idempotency-Key` so you can safely retry.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.messages.unsend({
    message_id: "msg_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.MessageUnsendParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `MessagesClient.IdempotentRequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Phone Numbers
<details><summary><code>client.phoneNumbers.<a href="/src/api/resources/phoneNumbers/client/Client.ts">list</a>() -> Blujay.PhoneNumberListResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns the Blujay numbers in your workspace. For each number you get whether it can send right now (`send_status`), what it supports (`capabilities`), and its link rules (`outbound_policy`).

Dedicated numbers also report `health_status`, `queue`, and `limits`. Sending limits and queue capacity, such as how many new contacts a number can message per day, are specific to each number and change over time. Read the live values from `limits` and `queue` instead of hard-coding them.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.phoneNumbers.list();

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**requestOptions:** `PhoneNumbersClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.phoneNumbers.<a href="/src/api/resources/phoneNumbers/client/Client.ts">get</a>({ ...params }) -> Blujay.PhoneNumberGetResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns one of your Blujay numbers with the same detail as the list. A number that has been retired returns `status: unavailable` and never reports current health, capacity, label or calling readiness.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.phoneNumbers.get({
    phone_number_id: "phone_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.PhoneNumberGetParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PhoneNumbersClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Capability
<details><summary><code>client.capability.<a href="/src/api/resources/capability/client/Client.ts">evaluateService</a>({ ...params }) -> Blujay.CapabilityEvaluateServiceResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Checks which service Blujay would use to reach a US phone number from one of your numbers: `iMessage`, `RCS` or `SMS`. If Blujay can't confirm iMessage or RCS, the result is `SMS`.

You can also check an email address. An email address is only ever texted over iMessage, so the result is `iMessage` when Blujay confirms it, and `null` otherwise.

If Blujay already checked the same recipient from the same number in the last five minutes (through this endpoint, the Blujay app, or a send), you get that answer with `source: cached`. Cached answers are free and never limited.

A fresh check runs from your number and shares its capacity with your messages, which always go first. Each of your numbers can run 30 fresh checks per clock hour and 100 per UTC day. Over a limit, or while the number is busy, the call returns `429 RATE_LIMIT_EXCEEDED` with `Retry-After`.

This endpoint counts toward your read request limit, not your write limit.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.capability.evaluateService({
    number: "+15555550123",
    from_phone_number_id: "phone_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.CapabilityEvaluateServiceParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CapabilityClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Team Members
<details><summary><code>client.teamMembers.<a href="/src/api/resources/teamMembers/client/Client.ts">listAssignable</a>() -> Blujay.TeamMemberListAssignableResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns the active team members in your workspace that you can assign contacts to. Pass a member's `id` to `PATCH /v1/contacts/{contact_id}/assignee`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.teamMembers.listAssignable();

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**requestOptions:** `TeamMembersClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Workflows
<details><summary><code>client.workflows.<a href="/src/api/resources/workflows/client/Client.ts">list</a>() -> Blujay.WorkflowListResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns the active, published workflows in your workspace that start manually. Each has a `workflow_id` and `label`; use the ID to enroll a contact. Workflow steps and run history aren't returned.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.workflows.list();

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**requestOptions:** `WorkflowsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.workflows.<a href="/src/api/resources/workflows/client/Client.ts">enroll</a>({ ...params }) -> Blujay.WorkflowEnrollResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Starts a manual workflow for one contact.

`request_id` is required and makes retries safe: sending the same `request_id` again returns `200` with the original result instead of enrolling the contact twice. A `200` can also mean no new run started; `enrollment_status` and `no_op_reason` say what happened.

`metadata` is optional context about the enrollment. It isn't available as workflow variables.

Returns `409 WORKFLOW_LIFECYCLE_ERROR` when the workflow isn't active or doesn't start manually, and `422 WORKFLOW_VALIDATION_ERROR` when the workflow can't run yet, for example because it has no published version.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.workflows.enroll({
    workflow_id: "workflow_abc123",
    contact_id: "contact_abc123",
    request_id: "signup-7f1d9d0a8a3d4b4d",
    metadata: {
        "source": "signup_form",
        "external_id": "A-1042"
    }
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.WorkflowEnrollParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WorkflowsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Contacts
<details><summary><code>client.contacts.<a href="/src/api/resources/contacts/client/Client.ts">list</a>({ ...params }) -> core.Page&lt;Blujay.Contact, Blujay.ContactListResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns the contacts someone saved in your workspace, newest changes first. Blujay also creates a contact on its own for people you text or call, and for US numbers that text or call you; those have `saved: false` and are listed only with `saved=false`. Saving one keeps its `contact_id`.

To read any contact you get from a message, chat or webhook, saved or not, use `GET /v1/contacts/{contact_id}`. Search finds both kinds too.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
const pageableResponse = await client.contacts.list();
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.contacts.list();
while (page.hasNextPage()) {
    page = await page.getNextPage();
}

// You can also access the underlying response
const response = page.response;

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.ContactListParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ContactsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.contacts.<a href="/src/api/resources/contacts/client/Client.ts">create</a>({ ...params }) -> Blujay.ContactCreateResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Creates a contact. `phone_number` is required; `email`, `name`, `first_name` and `last_name` are optional. Returns `409 CONTACT_ALREADY_EXISTS` if the phone number belongs to a saved contact, or the email to any other contact, in your workspace.

If Blujay already created a contact for this phone number (`saved: false`), this saves that contact instead: it keeps its `contact_id` and `created_at`, takes the `email` and names you send, and returns `201` with `saved: true`.

Creating a contact through the API doesn't send a webhook or start workflows that run on new contacts. To create or update in one call, use `POST /v1/contacts/import`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.contacts.create({
    phone_number: "+15555550123",
    name: "Ava Chen"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.ContactCreateParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ContactsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.contacts.<a href="/src/api/resources/contacts/client/Client.ts">upsert</a>({ ...params }) -> Blujay.ContactUpsertResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Creates or updates a contact by phone number. `phone_number` is required; `email`, `name`, `first_name` and `last_name` are optional.

- If a contact has this phone number, Blujay updates it (`200`), including its email and names when you send them. A contact Blujay created (`saved: false`) becomes saved.
- If no contact has this phone number, Blujay creates one (`201`).
- If you send an email that already belongs to a different contact, Blujay returns `409 CONTACT_MATCH_CONFLICT` and changes nothing. This happens even when no contact has the phone number.

The response's `created` and `updated` flags tell you which happened. Like create, import doesn't send a webhook or start workflows that run on new contacts.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.contacts.upsert({
    phone_number: "+15555550123",
    email: "ava@example.com",
    name: "Ava Chen"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.ContactUpsertParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ContactsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.contacts.<a href="/src/api/resources/contacts/client/Client.ts">search</a>({ ...params }) -> Blujay.ContactSearchResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Finds contacts by phone number, email address, or free text (`q`), whether or not someone saved them; each result's `saved` says which. Returns up to `limit` best matches. Results aren't paginated.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.contacts.search({
    phone_number: "+15555550123",
    email: "ava@example.com",
    q: "Ava"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.ContactSearchParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ContactsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.contacts.<a href="/src/api/resources/contacts/client/Client.ts">get</a>({ ...params }) -> Blujay.ContactGetResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns one contact, saved or not, including its tags, stage, assignee and opt-out state.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.contacts.get({
    contact_id: "contact_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.ContactGetParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ContactsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.contacts.<a href="/src/api/resources/contacts/client/Client.ts">delete</a>({ ...params }) -> void</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Deletes the contact. If the contact had opted out, the opt-out stays in place, so you still can't message that phone number or email.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.contacts.delete({
    contact_id: "contact_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.ContactDeleteParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ContactsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.contacts.<a href="/src/api/resources/contacts/client/Client.ts">update</a>({ ...params }) -> Blujay.ContactUpdateResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Changes a contact's phone number, email or name. Fields you leave out keep their values. A phone number or email that already belongs to another contact returns `409 CONTACT_ALREADY_EXISTS`. A phone number can change only while nothing has happened with the contact (no texts, chats or calls other than outbound calls that never connected, no opt-out, no Free Plan verification, no Follow Up Boss or HubSpot link, no group chat, no scheduled text waiting); otherwise the request returns `409 CONTACT_PHONE_LOCKED` with the reason in `error.details[0].reason`, and nothing is changed. Sending the contact's current phone number, or giving a number to a contact that has none, is not a change. A successful update saves a contact Blujay created (`saved` becomes `true`). To change tags, stage or assignee, use their own endpoints.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.contacts.update({
    contact_id: "contact_abc123",
    name: "Ava R."
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.ContactUpdateParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ContactsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.contacts.<a href="/src/api/resources/contacts/client/Client.ts">addTag</a>({ ...params }) -> Blujay.ContactAddTagResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Adds a tag to the contact and returns the contact. `tag_added` tells you whether the tag was new.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.contacts.addTag({
    contact_id: "contact_abc123",
    tag: "VIP"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.ContactAddTagParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ContactsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.contacts.<a href="/src/api/resources/contacts/client/Client.ts">markCompleted</a>({ ...params }) -> Blujay.ContactMarkCompletedResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Sets the contact's stage to `Completed` and returns the contact. `Completed` is the only stage you can set through the API. `stage_changed` tells you whether the stage changed.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.contacts.markCompleted({
    contact_id: "contact_abc123",
    stage: "Completed"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.ContactMarkCompletedParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ContactsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.contacts.<a href="/src/api/resources/contacts/client/Client.ts">assign</a>({ ...params }) -> Blujay.ContactAssignResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Assigns the contact to a team member and returns the contact. Get member IDs from `GET /v1/team-members/assignable`. `assignment_changed` tells you whether the assignee changed.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.contacts.assign({
    contact_id: "contact_abc123",
    team_member_id: "member_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.ContactAssignParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ContactsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.contacts.<a href="/src/api/resources/contacts/client/Client.ts">optOut</a>({ ...params }) -> Blujay.ContactOptOutResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Opts the contact out of messages. Sends to an opted-out contact are rejected with `403 RECIPIENT_SUPPRESSED`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.contacts.optOut({
    contact_id: "contact_abc123",
    reason: "Asked not to be contacted"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.ContactOptOutParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ContactsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.contacts.<a href="/src/api/resources/contacts/client/Client.ts">removeOptOut</a>({ ...params }) -> Blujay.ContactRemoveOptOutResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Removes an explicit opt-out from the contact.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.contacts.removeOptOut({
    contact_id: "contact_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.ContactRemoveOptOutParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ContactsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.contacts.<a href="/src/api/resources/contacts/client/Client.ts">optOutAddress</a>({ ...params }) -> Blujay.ContactOptOutAddressResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Opts out a phone number or email address, even if it doesn't belong to a contact yet. Sends to that address are rejected with `403 RECIPIENT_SUPPRESSED`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.contacts.optOutAddress({
    address: "+15555550123",
    reason: "requested_stop"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.ContactOptOutAddressParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ContactsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Attachments
<details><summary><code>client.attachments.<a href="/src/api/resources/attachments/client/Client.ts">create</a>({ ...params }) -> Blujay.AttachmentCreateResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Starts an upload for a file you can reuse in messages. The response gives you an `upload_url` and `upload_headers`.

1. `PUT` the file's raw bytes to `upload_url` with exactly the `upload_headers` returned. Don't use multipart form data. The URL expires after 15 minutes.
2. Send the `attachment_id` in a `media` message part, or call `GET /v1/attachments/{attachment_id}` to check it.

There's no separate "complete" call. Blujay checks the bytes the first time you read the attachment or send it, so the size and type must match what you declared. Files can be up to 100 MiB.

Attachment endpoints share a limit of 60 requests per minute per API key.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.attachments.create({
    filename: "photo.jpg",
    content_type: "image/jpeg",
    size_bytes: 428731
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.AttachmentCreateParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AttachmentsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.attachments.<a href="/src/api/resources/attachments/client/Client.ts">get</a>({ ...params }) -> Blujay.AttachmentGetResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns an attachment's details. The first read after an upload checks the uploaded bytes. Until the upload finishes you get `409 ATTACHMENT_NOT_READY`; if the bytes don't match what you declared you get `422 ATTACHMENT_UPLOAD_INVALID`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.attachments.get({
    attachment_id: "att_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.AttachmentGetParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AttachmentsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.attachments.<a href="/src/api/resources/attachments/client/Client.ts">delete</a>({ ...params }) -> void</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Stops the attachment from being sent or downloaded again, effective immediately. Messages that already include it keep their reference to it.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.attachments.delete({
    attachment_id: "att_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.AttachmentDeleteParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AttachmentsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.attachments.<a href="/src/api/resources/attachments/client/Client.ts">download</a>({ ...params }) -> core.BinaryResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns the attachment's file. Authenticate the same way as any other API call. Message parts link here through `download_url`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.attachments.download({
    attachment_id: "att_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.AttachmentDownloadParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AttachmentsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Calls
<details><summary><code>client.calls.<a href="/src/api/resources/calls/client/Client.ts">downloadRecording</a>({ ...params }) -> core.BinaryResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns the call's recording as audio. `call.recording_ready` webhooks link here through `recording.download_url`. Authenticate the same way as any other API call.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.calls.downloadRecording({
    call_id: "call_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.CallDownloadRecordingParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CallsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## vCards
<details><summary><code>client.vcards.<a href="/src/api/resources/vcards/client/Client.ts">list</a>({ ...params }) -> core.Page&lt;Blujay.Vcard, Blujay.VcardListResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns your workspace's saved contact cards, most recently updated first.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
const pageableResponse = await client.vcards.list();
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.vcards.list();
while (page.hasNextPage()) {
    page = await page.getNextPage();
}

// You can also access the underlying response
const response = page.response;

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.VcardListParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `VcardsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.vcards.<a href="/src/api/resources/vcards/client/Client.ts">create</a>({ ...params }) -> Blujay.VcardCreateResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Saves a contact card for your workspace, such as your support line or a colleague's details. To send it, add a `vcard` part with its ID to a message. Card photos are managed in the Blujay app.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.vcards.create({
    first_name: "Northwind",
    last_name: "Support",
    company: "Northwind Supply",
    title: "Customer Support",
    phones: [{
            number: "+15555550125",
            type: "work"
        }],
    emails: [{
            address: "support@example.com",
            type: "work"
        }],
    website: "https://example.com/support"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.VcardCreateParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `VcardsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.vcards.<a href="/src/api/resources/vcards/client/Client.ts">get</a>({ ...params }) -> Blujay.VcardGetResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns one saved contact card.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.vcards.get({
    vcard_id: "vcard_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.VcardGetParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `VcardsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.vcards.<a href="/src/api/resources/vcards/client/Client.ts">delete</a>({ ...params }) -> void</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Deletes a saved contact card. Messages that already included the card keep their copy.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.vcards.delete({
    vcard_id: "vcard_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.VcardDeleteParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `VcardsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.vcards.<a href="/src/api/resources/vcards/client/Client.ts">update</a>({ ...params }) -> Blujay.VcardUpdateResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Changes only the fields you send. The card must keep at least one phone number or email.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.vcards.update({
    vcard_id: "vcard_abc123",
    title: "Support Lead"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.VcardUpdateParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `VcardsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Webhook Subscriptions
<details><summary><code>client.webhookSubscriptions.<a href="/src/api/resources/webhookSubscriptions/client/Client.ts">list</a>({ ...params }) -> core.Page&lt;Blujay.WebhookSubscription, Blujay.WebhookSubscriptionListResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns your workspace's webhook subscriptions. Signing secrets aren't included; each subscription shows only `signing_secret_hint`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
const pageableResponse = await client.webhookSubscriptions.list();
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.webhookSubscriptions.list();
while (page.hasNextPage()) {
    page = await page.getNextPage();
}

// You can also access the underlying response
const response = page.response;

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.WebhookSubscriptionListParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WebhookSubscriptionsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhookSubscriptions.<a href="/src/api/resources/webhookSubscriptions/client/Client.ts">create</a>({ ...params }) -> Blujay.WebhookSubscriptionCreateResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Subscribes an HTTPS endpoint to the events you choose. The response includes `signing_secret`, which is shown only this once. Store it securely; you need it to verify webhook signatures. To change the secret, create a new subscription and delete the old one.

New subscriptions start `active` unless you set `status: disabled`. Leave out `phone_number_filter` to get events for all of your numbers, including numbers you add later.

The URL must use HTTPS and resolve to a public address.

Errors worth handling (all `400`):
- `UNSUPPORTED_WEBHOOK_EVENT`: an event type isn't recognized.
- `FEATURE_NOT_ENABLED`: an event type is recognized but can't be subscribed to.
- `WEBHOOK_URL_INVALID`, `WEBHOOK_URL_UNSAFE` or `WEBHOOK_URL_UNRESOLVABLE`: the URL isn't HTTPS, points to a private address, or doesn't resolve.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhookSubscriptions.create({
    url: "https://example.com/webhooks/blujay",
    event_types: ["message.accepted", "message.sent", "message.delivered", "message.read", "message.failed"]
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.WebhookSubscriptionCreateParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WebhookSubscriptionsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhookSubscriptions.<a href="/src/api/resources/webhookSubscriptions/client/Client.ts">get</a>({ ...params }) -> Blujay.WebhookSubscriptionGetResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns one webhook subscription. The signing secret isn't included.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhookSubscriptions.get({
    subscription_id: "whsub_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.WebhookSubscriptionGetParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WebhookSubscriptionsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhookSubscriptions.<a href="/src/api/resources/webhookSubscriptions/client/Client.ts">delete</a>({ ...params }) -> void</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Deletes the subscription so it stops receiving new events. Deleting it again returns `404`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhookSubscriptions.delete({
    subscription_id: "whsub_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.WebhookSubscriptionDeleteParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WebhookSubscriptionsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhookSubscriptions.<a href="/src/api/resources/webhookSubscriptions/client/Client.ts">update</a>({ ...params }) -> Blujay.WebhookSubscriptionUpdateResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Changes only the fields you send. Set `status: disabled` to pause a subscription; disabled subscriptions don't receive new events. Changing `webhook_version` affects only events created after the change.

Errors match create: `UNSUPPORTED_WEBHOOK_EVENT`, `FEATURE_NOT_ENABLED` for event types you can't add, and the `WEBHOOK_URL_*` codes for a bad URL.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhookSubscriptions.update({
    subscription_id: "whsub_abc123",
    event_types: ["message.accepted", "message.delivered", "message.read"]
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.WebhookSubscriptionUpdateParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WebhookSubscriptionsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhookSubscriptions.<a href="/src/api/resources/webhookSubscriptions/client/Client.ts">listDeliveries</a>({ ...params }) -> core.Page&lt;Blujay.WebhookDeliveryAttempt, Blujay.WebhookSubscriptionListDeliveriesResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns the attempts Blujay made to deliver events to this subscription. Each attempt shows the HTTP status your endpoint returned and, when it failed, an `error_code` and `error_message`. Filter by `event_id` to see every attempt for one event.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
const pageableResponse = await client.webhookSubscriptions.listDeliveries({
    subscription_id: "whsub_abc123",
    event_id: "evt_abc123"
});
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.webhookSubscriptions.listDeliveries({
    subscription_id: "whsub_abc123",
    event_id: "evt_abc123"
});
while (page.hasNextPage()) {
    page = await page.getNextPage();
}

// You can also access the underlying response
const response = page.response;

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.WebhookSubscriptionListDeliveriesParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WebhookSubscriptionsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhookSubscriptions.<a href="/src/api/resources/webhookSubscriptions/client/Client.ts">replayEvent</a>({ ...params }) -> Blujay.WebhookSubscriptionReplayEventResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Requests that a stored event be sent to this subscription again. The event keeps its original `event_id`.

The subscription must be `active` and still include the event's type, or you get `409 WEBHOOK_SUBSCRIPTION_INACTIVE`. If the subscription's `phone_number_filter` excludes the number the event belongs to, you get `409 WEBHOOK_PHONE_NUMBER_EXCLUDED`.

Send an `Idempotency-Key` so you can safely retry this call.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhookSubscriptions.replayEvent({
    subscription_id: "whsub_abc123",
    event_id: "evt_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.WebhookSubscriptionReplayEventParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WebhookSubscriptionsClient.IdempotentRequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Chat Participants
<details><summary><code>client.chats.participants.<a href="/src/api/resources/chats/resources/participants/client/Client.ts">list</a>({ ...params }) -> Blujay.ChatParticipantListResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns the people in a group chat. Your own Blujay numbers in the group aren't listed here; they appear in the chat's `phone_numbers` field.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.chats.participants.list({
    chat_id: "chat_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.chats.ChatParticipantListParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ParticipantsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.chats.participants.<a href="/src/api/resources/chats/resources/participants/client/Client.ts">add</a>({ ...params }) -> Blujay.ChatParticipantAddResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Adds a phone number or email address to an active iMessage group chat. One of your Blujay numbers in the group makes the change. If more than one of your numbers is in the group, set `from_phone_number_id` to choose which one.

Adding someone who is already in the group returns `200` with `status: already_active`. Send an `Idempotency-Key` so you can safely retry.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.chats.participants.add({
    chat_id: "chat_abc123",
    handle: "+15555550123",
    from_phone_number_id: "phone_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.chats.ChatParticipantAddParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ParticipantsClient.IdempotentRequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.chats.participants.<a href="/src/api/resources/chats/resources/participants/client/Client.ts">remove</a>({ ...params }) -> Blujay.ChatParticipantRemoveResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Removes a phone number or email address from an active iMessage group chat. If more than one of your Blujay numbers is in the group, set `from_phone_number_id` to choose which one makes the change.

Removing someone who already left returns `200` with `status: already_removed`; removing someone who was never in the group returns `404 NOT_FOUND`. Neither contacts the phone. To take one of your own numbers out of a group, use `POST /v1/chats/{chat_id}/leave` instead. Send an `Idempotency-Key` so you can safely retry.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.chats.participants.remove({
    chat_id: "chat_abc123",
    handle: "+15555550123",
    from_phone_number_id: "phone_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.chats.ChatParticipantRemoveParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ParticipantsClient.IdempotentRequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Chat Messages
<details><summary><code>client.chats.messages.<a href="/src/api/resources/chats/resources/messages/client/Client.ts">list</a>({ ...params }) -> core.Page&lt;Blujay.Message, Blujay.ChatMessageListResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns the messages in one chat, one page at a time, most recently updated first (a read receipt or an edit moves an older message up). Sort a page by `created_at` to display a conversation in order.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
const pageableResponse = await client.chats.messages.list({
    chat_id: "chat_abc123"
});
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.chats.messages.list({
    chat_id: "chat_abc123"
});
while (page.hasNextPage()) {
    page = await page.getNextPage();
}

// You can also access the underlying response
const response = page.response;

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.chats.ChatMessageListParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `MessagesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.chats.messages.<a href="/src/api/resources/chats/resources/messages/client/Client.ts">send</a>({ ...params }) -> Blujay.ChatMessageSendResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Sends a message in an existing chat. Blujay returns `202` as soon as the message is accepted and sends it in the background. Follow its progress with message webhooks or `GET /v1/messages/{message_id}`.

A message can have `text`, `link`, `media`, `vcard` and `audio` parts. A `link` part must be the only part. An `audio` part (a voice memo, sent as a native iMessage audio message) must also be the only part, and goes out over iMessage or RCS only.

Optional features:
- `reply_to` sends an iMessage threaded reply. It isn't available for SMS or RCS chats.
- `effect` adds an iMessage screen or bubble effect to a text message.
- `text_decorations` styles text in direct iMessage chats and established iMessage group chats.
- `preferred_service` picks iMessage, RCS or SMS for a direct chat. Omit it to let Blujay choose. Group chats don't accept it.

If an effect or text style can't be delivered because the message goes out as SMS or RCS, the text is still sent and the message lists what was dropped in `degradations`.

These limits protect your number's reputation. Until the contact replies to this number with a text or a tapback:
- Links, media and contact cards return `400 PRE_REPLY_CONTENT_BLOCKED`.
- Text longer than 300 characters returns `400 PRE_REPLY_LENGTH_EXCEEDED`.
At any time, before or after a first reply, at most 6 texts go to a contact in a row without a response (a text or tapback from them, or a message from them in a group) on any of your numbers. Calls don't count as a response. The next returns `400 PRE_REPLY_LIMIT_REACHED`. With an API key, `pre_reply_override: true` sends a 7th once. The count starts again when the contact responds.
In a group, the content limits apply until someone in the group replies, and the 6-text limit counts the group's texts since anyone in it last wrote. These errors are never retryable and never `429`.

Send an `Idempotency-Key` header (or `message.idempotency_key`) so you can safely retry. Repeating a request with the same key returns `200` with the original response instead of sending again.

Errors worth handling:
- `400 PRE_REPLY_*`: the contact hasn't replied yet, or hasn't responded to your last 6 texts (see the limits above).
- `403 RECIPIENT_SUPPRESSED`: the recipient opted out.
- `403 CONTACT_NOT_VERIFIED`: on the Free Plan, the contact hasn't texted your Free Plan number to verify yet.
- `403 CONTACT_MUST_TEXT_FIRST`: the number is on the AI Agent plan: it only replies to people who text it first, and can't send to group chats.
- `429 RATE_LIMIT_EXCEEDED` or `429 QUEUE_FULL`: the sending number hit a limit. Wait `Retry-After` seconds. Each number's current limits are in `GET /v1/phone-numbers` under `limits`.
- `409 SENDER_RETIRED`: the chat's number was retired. Start a new chat from an active number.
- `503 QUEUE_UNAVAILABLE`: Blujay couldn't accept the message right now. Retry with the same `Idempotency-Key`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.chats.messages.send({
    chat_id: "chat_abc123",
    message: {
        parts: [{
                type: "text",
                text: "Here is the follow-up we discussed."
            }]
    }
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.chats.ChatMessageSendParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `MessagesClient.IdempotentRequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Chat Typing
<details><summary><code>client.chats.typing.<a href="/src/api/resources/chats/resources/typing/client/Client.ts">start</a>({ ...params }) -> void</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Shows a typing indicator in an active direct or group chat. Typing is best effort:
- Direct chats confirmed as iMessage get a typing indicator.
- iMessage group chats get one when the chat's number is still in the group.
- SMS and RCS chats, direct chats whose service isn't confirmed yet, and groups that can't receive iMessage typing accept the request and show nothing.

A `204` means Blujay accepted the request, not that the recipient saw a typing bubble. Check the chat's `supports_typing_indicators` to know whether one can appear.

Returns `400 FEATURE_NOT_ENABLED` if typing indicators are switched off for your workspace (they're on by default; contact support@blujay.io if yours were switched off), and `400 UNSUPPORTED_CHAT_OPERATION` if the chat isn't active.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.chats.typing.start({
    chat_id: "chat_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.chats.ChatTypingStartParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `TypingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.chats.typing.<a href="/src/api/resources/chats/resources/typing/client/Client.ts">stop</a>({ ...params }) -> void</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Clears a typing indicator in an active direct or group chat. The same rules apply as for starting one. A `204` means Blujay accepted the request, not that an indicator was showing or was cleared.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.chats.typing.stop({
    chat_id: "chat_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.chats.ChatTypingStopParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `TypingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Message Reactions
<details><summary><code>client.messages.reactions.<a href="/src/api/resources/messages/resources/reactions/client/Client.ts">add</a>({ ...params }) -> Blujay.MessageReactionAddResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Adds a tapback to a message in an iMessage chat, from the Blujay phone number the chat belongs to. You can react to messages your contacts sent and to your own. The six standard reactions are `love`, `like`, `dislike`, `laugh`, `emphasize` and `question`. To react with any emoji, send `type: custom` with `emoji` set to exactly one emoji, such as `😍` or `👍🏽`. A symbol sent without its emoji style, such as `❤`, is sent and reported as iPhones send it (`❤️`). A message can carry one reaction per person on each part, so adding a different one, standard or emoji, replaces yours. Recipients on iOS 17 or earlier see an emoji reaction as the text "Reacted 😍 to …".

Stickers contacts put on your messages arrive as `sticker` reactions, but you can't send stickers (`400 VALIDATION_ERROR`). A phone number that can't send emoji reactions yet returns `502 CHANGE_REJECTED`.

A `202` means Blujay accepted the reaction and is sending it. Confirm it through the `reaction.added` webhook, where `reactor` is your phone number. If you already have that reaction on the message, Blujay returns `202` without sending it again. Send an `Idempotency-Key` so a retry after a lost response is safe.

iMessage only: a message sent or received as SMS or RCS returns `400 UNSUPPORTED_CHAT_OPERATION`. A reaction can't itself be reacted to (`404 NOT_FOUND`), and an unsent or failed message can't be either (`400 VALIDATION_ERROR`). A reaction notifies the other person like a message, so a chat with an opted-out contact returns `403 RECIPIENT_SUPPRESSED`, the same rule as sending a message in it.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.messages.reactions.add({
    message_id: "msg_abc123",
    type: "love"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.messages.MessageReactionAddParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ReactionsClient.IdempotentRequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.messages.reactions.<a href="/src/api/resources/messages/resources/reactions/client/Client.ts">remove</a>({ ...params }) -> Blujay.MessageReactionRemoveResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Removes a tapback your phone number put on a message, whether it was added through the API or in the Blujay app. A `202` means Blujay accepted the removal and is sending it; confirm it through the `reaction.removed` webhook.

To remove an emoji reaction, use `custom` as the type and pass the emoji: `DELETE /v1/messages/{message_id}/reactions/custom?emoji=😍` (URL-encoded). Stickers can't be removed (`400 VALIDATION_ERROR`).

If you don't have that reaction on the message, Blujay returns `202` and sends nothing. Pass `part_index` when you reacted to a part other than the first. Send an `Idempotency-Key` so a retry after a lost response is safe. The same iMessage-only rules apply as for adding a reaction.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.messages.reactions.remove({
    message_id: "msg_abc123",
    type: "custom",
    emoji: "😍"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.messages.MessageReactionRemoveParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ReactionsClient.IdempotentRequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Phone Number Contact Card
<details><summary><code>client.phoneNumbers.contactCard.<a href="/src/api/resources/phoneNumbers/resources/contactCard/client/Client.ts">get</a>({ ...params }) -> Blujay.PhoneNumberContactCardGetResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns the iMessage name and photo one of your dedicated numbers offers to people who don't have it saved (Apple's "Share name and photo"). Blujay asks the number for its current state on every read, so `status` is live:
- `not_set`: the number shares no name and photo.
- `applying`: a change was accepted and the number is finishing it. Read again in about 15 seconds.
- `active`: the name and photo are in place.
- `unavailable`: the number can't report its state right now.

`photo` is `null` when the number has no photo (iMessage shows initials); otherwise `photo.download_url` returns the current photo as a PNG. Free Plan numbers return `400 FEATURE_NOT_ENABLED`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.phoneNumbers.contactCard.get({
    phone_number_id: "phone_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.phoneNumbers.PhoneNumberContactCardGetParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ContactCardClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.phoneNumbers.contactCard.<a href="/src/api/resources/phoneNumbers/resources/contactCard/client/Client.ts">set</a>({ ...params }) -> Blujay.PhoneNumberContactCardSetResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Sets the iMessage name and photo for one of your dedicated numbers. Upload the photo first with `POST /v1/attachments` (JPEG or PNG, up to 25 MiB); Blujay center-crops it to a square and resizes it for iMessage. `PUT` replaces the name. Omit `avatar_attachment_id` to keep the current photo, or send `null` to remove it so iMessage shows the number's initials.

`PUT` waits up to about 3 seconds for the number to publish the change. Usually it does, and you get `200` with `status: active`. If Apple is slow to take the change, you get `202` with `status: applying`; the number keeps going on its own, and `GET .../contact-card` about 15 seconds later reports `active`. There is no need to send the change again. The response confirms the number accepted the change, not that anyone has seen it yet. Blujay offers the card automatically with your next message in each iMessage chat and refreshes it once a day, so there is nothing to call. If you change it several times in a row, an iPhone may show an earlier version until the next daily refresh. People who saved the number as a contact keep their own card.

Refusals: Free Plan numbers `400 FEATURE_NOT_ENABLED`; a photo that isn't JPEG or PNG `415 UNSUPPORTED_ATTACHMENT_TYPE`; a photo still uploading `409 ATTACHMENT_NOT_READY`; a number that is busy with another change, not set up, or not reachable `503 PHONE_NUMBER_UNAVAILABLE` with `Retry-After`. After a `503`, read `GET .../contact-card` before retrying: if the number applied the change after all, the read reports it.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.phoneNumbers.contactCard.set({
    phone_number_id: "phone_abc123",
    first_name: "Acme",
    last_name: "Support",
    avatar_attachment_id: "att_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.phoneNumbers.PhoneNumberContactCardSetParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ContactCardClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.phoneNumbers.contactCard.<a href="/src/api/resources/phoneNumbers/resources/contactCard/client/Client.ts">delete</a>({ ...params }) -> Blujay.PhoneNumberContactCardDeleteResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Stops the number from offering a name and photo. Returns `202` with the profile; `status` becomes `not_set` once the number confirms. People who already accepted the name and photo keep it on their phones.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.phoneNumbers.contactCard.delete({
    phone_number_id: "phone_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.phoneNumbers.PhoneNumberContactCardDeleteParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ContactCardClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.phoneNumbers.contactCard.<a href="/src/api/resources/phoneNumbers/resources/contactCard/client/Client.ts">downloadPhoto</a>({ ...params }) -> core.BinaryResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns the number's current iMessage photo as a 512 by 512 PNG, the image Blujay made from your upload. `404 NOT_FOUND` when the number has no photo.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.phoneNumbers.contactCard.downloadPhoto({
    phone_number_id: "phone_abc123"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Blujay.phoneNumbers.PhoneNumberContactCardDownloadPhotoParams` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ContactCardClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

