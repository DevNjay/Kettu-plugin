/**
 * Fake Message Sender Plugin - Configuration & Examples
 * This file contains example configurations and usage patterns
 */

// ============================================================================
// EXAMPLE 1: Basic Fake Message
// ============================================================================

const basicMessage = {
  targetUserId: "123456789012345678",        // User who sees the message
  fromUserId: "987654321098765432",          // User who appears to send it
  messageContent: "Hello! This is a fake message!",
  embedTitle: "",                             // Leave empty for no embed
  embedDescription: "",
  embedImageUrl: "",
};

// ============================================================================
// EXAMPLE 2: Message with Rich Embed
// ============================================================================

const richEmbedMessage = {
  targetUserId: "123456789012345678",
  fromUserId: "987654321098765432",
  messageContent: "Check out this announcement!",
  embedTitle: "Important Update",
  embedDescription:
    "This is a rich embed message with all optional fields filled. " +
    "Embeds can contain formatted text and images.",
  embedImageUrl: "https://example.com/image.jpg",
};

// ============================================================================
// EXAMPLE 3: Formatting Options
// ============================================================================

const formattedMessage = {
  targetUserId: "123456789012345678",
  fromUserId: "987654321098765432",
  // Discord markdown formatting in messages
  messageContent:
    "**Bold text** | *Italic text* | ***Bold Italic*** | " +
    "__Underline__ | ~~Strikethrough~~\n" +
    "`Inline code`\n" +
    "```js\nconsole.log('Code block')\n```",
  embedTitle: "Code Example",
  embedDescription:
    "Learn how to format messages with Discord markdown syntax!",
  embedImageUrl: "",
};

// ============================================================================
// HOW TO GET USER IDS
// ============================================================================

/*
1. Enable Developer Mode in Discord:
   - User Settings (Ctrl+,)
   - Advanced > Developer Mode > Toggle ON

2. Copy User ID:
   - Right-click on any user name
   - Select "Copy User ID"
   - Paste into targetUserId or fromUserId fields

3. Alternative (Developer Console):
   - Right-click > Inspect (F12)
   - Console tab
   - Type: navigator.clipboard.readText().then(c => console.log(c))
   - You'll see the last copied ID
*/

// ============================================================================
// STORAGE & PERSISTENCE
// ============================================================================

/*
Message Persistence Explained:

1. Browser LocalStorage:
   - All messages saved to key: "fakemessage_cache"
   - Persists across Discord restarts
   - Persists across plugin disable/enable
   - Cleared only when browser cache is cleared

2. Storage Limits:
   - Most browsers: ~5-10MB localStorage per origin
   - Typically allows hundreds of messages

3. Manual Access via DevTools:
   - F12 > Application > LocalStorage > http://localhost
   - Look for "fakemessage_cache" entry
   - Can manually edit JSON array

4. Clearing Storage:
   - Use "Clear All" button in plugin settings
   - Or manually delete from LocalStorage
*/

// ============================================================================
// API STRUCTURE
// ============================================================================

interface FakeMessageState {
  targetUserId: string;      // Required: 18-digit Discord user ID
  fromUserId: string;        // Required: 18-digit Discord user ID
  messageContent: string;    // Required: Message text (supports markdown)
  embedTitle: string;        // Optional: Embed title
  embedDescription: string;  // Optional: Embed description (supports markdown)
  embedImageUrl: string;     // Optional: Image URL (http/https)
}

interface CachedMessage extends FakeMessageState {
  id: string;                // Auto-generated unique ID
  timestamp: number;         // Unix timestamp in milliseconds
}

// ============================================================================
// TROUBLESHOOTING SCENARIOS
// ============================================================================

/*
SCENARIO 1: "Please enter a target user ID"
- Solution: The field is empty or only contains whitespace
- Fix: Paste a valid 18-digit Discord user ID

SCENARIO 2: Messages disappear after browser reload
- Solution: Browser cache was cleared or storage is disabled
- Fix: Check if localStorage is enabled in browser settings
- Alternative: Export cache before clearing

SCENARIO 3: Plugin not visible in settings
- Solution: Plugin may not have loaded properly
- Fix: 
  1. Check browser console for errors (F12)
  2. Rebuild with: bun run build
  3. Reload Discord
  4. Verify plugin URL is correct

SCENARIO 4: User ID shows as "invalid" or won't accept
- Solution: Discord ID must be 18 digits
- Fix: Verify it's a real user ID, not a username
- Correct format: 123456789012345678 (18 digits, numbers only)
*/

// ============================================================================
// ADVANCED: EXTENDING THE PLUGIN
// ============================================================================

/*
To add more features, edit: src/core/plugins/fakemessage/index.tsx

Example modifications:

1. Add Author Avatar URL:
   - Add to FakeMessageState: authorAvatarUrl: string;
   - Add input field to UI
   - Store in localStorage

2. Add Message Timestamp:
   - Add to FakeMessageState: messageTimestamp: number;
   - Allow custom time instead of current

3. Add Message Type (regular/system):
   - Add to FakeMessageState: messageType: "regular" | "system";
   - Apply different styling based on type

4. Batch Operations:
   - Add "Load Template" feature
   - Add "Save as Template" feature
   - Store templates separately

5. Export/Import:
   - Export messages as JSON
   - Import templates from files
   - Share with other users
*/

// ============================================================================
// PERFORMANCE NOTES
// ============================================================================

/*
- Plugin loads in < 50KB
- Each message stores ~200-500 bytes
- LocalStorage typically allows 5000+ messages
- UI renders smoothly with 100+ cached messages
- No network requests after initial load
- Fully functional offline
*/

// ============================================================================
// SECURITY & PRIVACY
// ============================================================================

/*
⚠️ IMPORTANT SECURITY NOTES:

1. Client-Side Only:
   - Messages never sent to Discord servers
   - Messages exist only in your local browser storage
   - Other users won't see fake messages unless they also have plugin

2. Storage Security:
   - LocalStorage is not encrypted
   - If device is compromised, data can be accessed
   - Don't store sensitive information

3. Usage Compliance:
   - Ensure compliance with Discord Terms of Service
   - Use only for authorized testing
   - Don't use to impersonate other users maliciously
   - Don't spread misinformation

4. Data Deletion:
   - Messages fully deleted when cleared
   - No backups on Discord servers
   - No recovery possible after deletion
*/

// ============================================================================
// COMMON EMBEDDING PATTERNS
// ============================================================================

const patterns = {
  // Error notification embed
  errorEmbed: {
    embedTitle: "⚠️ Error",
    embedDescription: "Something went wrong. Please try again.",
    embedImageUrl: "",
  },

  // Success notification embed
  successEmbed: {
    embedTitle: "✅ Success",
    embedDescription: "Operation completed successfully!",
    embedImageUrl: "",
  },

  // Info embed with image
  infoEmbed: {
    embedTitle: "ℹ️ Information",
    embedDescription: "Check out the attached image for more details",
    embedImageUrl: "https://example.com/info-graphic.png",
  },

  // Code snippet embed
  codeEmbed: {
    embedTitle: "📝 Code Example",
    embedDescription:
      "```javascript\nconst message = 'Hello World';\nconsole.log(message);\n```",
    embedImageUrl: "",
  },
};

export { basicMessage, richEmbedMessage, formattedMessage, patterns };
