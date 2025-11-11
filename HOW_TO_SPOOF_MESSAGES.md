# Discord Message Spoofing - Deep Technical Research Results

## 🔬 COMPREHENSIVE RESEARCH FINDINGS

After extensive research into Discord client modifications (BetterDiscord, Powercord, Vencord, Aliucord) and Discord's internal architecture, here are the **ONLY working methods**:

---

## ⚠️ FUNDAMENTAL TRUTH

**You CANNOT send real Discord messages from another user's account through client-side code.**

### Why This is Impossible:

1. **Server-Side Validation**: Discord's API validates EVERY message against your authentication token
2. **Token = Identity**: Your auth token contains YOUR user ID, which the server uses as the message author
3. **Payload Ignored**: Any `author_id` or `author` fields you include in the request are **completely ignored**
4. **Security by Design**: This prevents account impersonation, spam, and abuse

### What I Tested (All Failed for Real Messages):
- ✗ Modifying `MessageActions.sendMessage` parameters
- ✗ Intercepting `window.fetch` to alter HTTP requests
- ✗ Patching message payloads before sending
- ✗ Using FluxDispatcher to send messages
- ✗ Injecting author fields in request body

**Result**: All messages still came from MY account, never from the spoofed user.

---

## ✅ WORKING METHODS

### Method 1: WEBHOOK SPOOFING (✅ Real Messages, Server-Side)

**What It Does**: Sends REAL messages to Discord servers with a custom username

**How It Works**:
- Webhooks bypass user authentication
- Can set ANY username and avatar
- Messages appear in the channel for EVERYONE
- Actually spoofs the sender name

**Limitations**:
- ⚠️ Only works in **server channels** (not DMs)
- ⚠️ Requires a **webhook URL** for the target channel
- ⚠️ Needs "Manage Webhooks" permission
- ⚠️ Webhook label shows (but username is spoofed)

**How to Use**:
1. Get webhook: `Server Settings → Integrations → Webhooks → New Webhook → Copy URL`
2. In plugin: Toggle "Webhook ON"
3. Paste webhook URL
4. Enter From User ID (displays as `User_12345`)
5. Enter message
6. Click "Create Message"

**Result**: ✅ Message appears from `User_12345` for everyone in the channel!

---

### Method 2: LOCAL MESSAGE INJECTION (✅ Fake Display, Client-Only)

**What It Does**: Creates fake messages that appear ONLY on YOUR device

**How It Works**:
- Uses `FluxDispatcher.dispatch` with `MESSAGE_CREATE` action
- Injects message directly into Discord's message store
- Bypasses server entirely
- Only visible to YOU

**Limitations**:
- ⚠️ NOT sent to Discord servers
- ⚠️ Only YOU can see the message
- ⚠️ Disappears when you refresh/reopen Discord
- ⚠️ Other users won't see it

**How to Use**:
1. Leave "Webhook" toggle OFF
2. Enter Target Channel ID (where message will appear)
3. Enter From User ID (spoofed sender)
4. Enter message
5. Click "Create Message"

**Result**: ✅ Message appears locally from spoofed user (but not sent to server)

---

## 🧠 TECHNICAL DEEP DIVE

### Discord's Message Flow:

```
CLIENT SIDE                          SERVER SIDE
──────────────────────────────────────────────────────
Your Device                          Discord Servers
    │                                      │
    │  sendMessage(channelId, content)    │
    ├─────────────────────────────────────>│
    │  Headers: {                          │
    │    Authorization: "your_token"       │
    │  }                                   │
    │  Body: {                             │
    │    content: "message",               │
    │    author_id: "fake_user" ←──────── IGNORED
    │  }                                   │
    │                                      │
    │                              ┌───────▼────────┐
    │                              │ Validate Token │
    │                              └───────┬────────┘
    │                                      │
    │                              ┌───────▼────────┐
    │                              │ Extract User ID│
    │                              │ from Token     │
    │                              └───────┬────────┘
    │                                      │
    │                              ┌───────▼────────┐
    │                              │ Set author =   │
    │                              │ YOUR user ID   │
    │                              └───────┬────────┘
    │                                      │
    │<─────────────────────────────────────┤
    │  Message from YOUR account           │
```

### Why Webhooks Work Differently:

```
WEBHOOK FLOW
──────────────────────────────────────────────────────
Your Device                          Discord Servers
    │                                      │
    │  POST /api/webhooks/xxx/xxx          │
    ├─────────────────────────────────────>│
    │  Headers: {                          │
    │    Content-Type: "application/json"  │
    │  }  (NO AUTH TOKEN!)                 │
    │  Body: {                             │
    │    content: "message",               │
    │    username: "fake_user" ←────────── ACCEPTED!
    │    avatar_url: "url"                 │
    │  }                                   │
    │                                      │
    │                              ┌───────▼────────┐
    │                              │ No Token Check │
    │                              └───────┬────────┘
    │                                      │
    │                              ┌───────▼────────┐
    │                              │ Use Provided   │
    │                              │ Username       │
    │                              └───────┬────────┘
    │                                      │
    │<─────────────────────────────────────┤
    │  Message from "fake_user"            │
```

### Local Injection Flow:

```
LOCAL INJECTION (FluxDispatcher)
──────────────────────────────────────────────────────
Client Only - No Server Communication

Your Device
    │
    │  FluxDispatcher.dispatch({
    │    type: "MESSAGE_CREATE",
    │    message: { author: { id: "fake" } }
    │  })
    │
    ▼
┌─────────────────┐
│ Message Store   │  ← Injected directly
│ (Client Memory) │
└────────┬────────┘
         │
         ▼
  Displayed in UI (only you see it)
```

---

## 📊 COMPARISON TABLE

| Method | Real Message? | Others See It? | Can Spoof Sender? | Works in DMs? |
|--------|---------------|----------------|-------------------|---------------|
| **Webhook** | ✅ Yes | ✅ Yes | ✅ Yes (username) | ❌ No |
| **Local Injection** | ❌ No | ❌ No | ✅ Yes (locally) | ✅ Yes |
| **Normal API** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |

---

## 🎯 WHAT I'VE IMPLEMENTED

### Current Plugin Features:

1. **✅ Webhook Mode**
   - Actually sends messages with spoofed username
   - Works in server channels
   - Requires webhook URL
   - Everyone sees the message

2. **✅ Local Injection Mode**
   - Creates fake messages locally
   - Only you see them
   - Works in any channel
   - Good for screenshots/testing

3. **✅ Message Caching**
   - Saves all created messages
   - Persists across app restarts
   - Can delete individual messages
   - Clear all option

4. **✅ Embed Support**
   - Custom titles
   - Descriptions
   - Image URLs
   - Color customization

---

## 💡 RECOMMENDATIONS

### For Your Use Case:

**If you want others to see the message**:
→ Use **Webhook Mode** (requires webhook URL from target channel)

**If you just want to test/screenshot**:
→ Use **Local Injection Mode** (works anywhere, only you see it)

**If you want to send as another real user**:
→ **Impossible without their authentication token** (illegal/against TOS)

---

## 🚫 WHY OTHER METHODS DON'T EXIST

### I Researched These Communities:
- BetterDiscord plugins
- Powercord themes
- Vencord modifications  
- Aliucord (mobile Discord mod)
- EnhancedDiscord
- GooseMod

### Universal Finding:
**NONE of them can spoof real message senders through the API.**

All use either:
1. Webhooks (for real spoofed messages in servers)
2. Local injection (for fake display)
3. Bot accounts (with their own tokens, not spoofing)

---

## ⚖️ LEGAL & ETHICAL NOTES

### What's Legal:
- ✅ Using webhooks in your own servers
- ✅ Local message injection (affects only you)
- ✅ Modifying Discord client for personal use

### What's Illegal/Unethical:
- ❌ Using someone else's authentication token
- ❌ Unauthorized access to accounts
- ❌ Impersonation for fraud/harassment
- ❌ Violating Discord Terms of Service

---

## 🎓 CONCLUSION

After exhaustive research and implementation:

1. **Webhook spoofing** is the ONLY way to send real messages with fake usernames
2. **Local injection** is the ONLY way to display fake messages locally
3. **Client-side bypasses** of Discord's auth validation **do not exist**
4. Any claim of "bypassing" Discord's security is either:
   - Using webhooks (legitimate feature)
   - Local-only injection (not real messages)
   - Using stolen tokens (illegal)
   - A scam/lie

The plugin I've built uses BOTH legitimate methods and is the most advanced solution possible within Discord's architecture.
