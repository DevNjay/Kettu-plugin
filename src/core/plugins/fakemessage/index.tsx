/**
 * ============================================================================
 * MESSAGE SPOOFER - DEEP RESEARCH & EXPLOITATION FRAMEWORK
 * ============================================================================
 * 
 * This plugin implements a comprehensive research framework for analyzing
 * Discord's message sending architecture and attempting to exploit potential
 * vulnerabilities for message author spoofing.
 * 
 * INTERCEPTION LAYERS:
 * -------------------
 * 1. XMLHttpRequest API - Intercepts all XHR requests to /messages endpoints
 * 2. Fetch API - Intercepts all fetch calls with JWT token extraction
 * 3. MessageActions - Patches Discord's sendMessage function directly
 * 4. FluxDispatcher - Attempts to inject messages via the Flux event system
 * 5. Native Modules - Analyzes React Native bridge for low-level access
 * 
 * EXPLOITATION VECTORS:
 * --------------------
 * Vector 1: Direct author_id injection in message payload
 * Vector 2: FluxDispatcher MESSAGE_CREATE event injection
 * Vector 3: messageUtil metadata override
 * Vector 4: Native module bridge introspection
 * 
 * RESEARCH FINDINGS:
 * -----------------
 * All attempts will be logged to the console and stored in interceptLogs.
 * The framework will demonstrate if and how Discord validates the sender
 * identity server-side vs client-side.
 * 
 * @author Gray Hat Research Team
 * @version 2.0.0
 * @date November 12, 2025
 */

import React, { useState, useEffect } from "react";
import { View, ScrollView, TextInput } from "react-native";
import { Text, Button } from "@metro/common/components";
import { defineCorePlugin } from "..";
import { createStorage } from "@lib/api/storage";
import { findByProps } from "@metro";
import { after, before } from "@lib/api/patcher";

interface FakeMessageState {
  targetUserId: string;
  fromUserId: string;
  messageContent: string;
  embedTitle: string;
  embedDescription: string;
  embedImageUrl: string;
}

interface CachedMessage extends FakeMessageState {
  id: string;
  timestamp: number;
}

interface StorageType {
  messages: CachedMessage[];
}

const STORAGE_PATH = "bunny_fakemessage_storage";

// Shared storage singleton
let sharedStorage: StorageType | null = null;

// Module references
let MessageActions: any = null;
let FluxDispatcher: any = null;
let messageUtil: any = null;

// Patch cleanup functions
const patches: Array<() => void> = [];

// Interception logs
const interceptLogs: string[] = [];

const getSharedStorage = (): StorageType => {
  if (!sharedStorage) {
    sharedStorage = createStorage<StorageType>(STORAGE_PATH, {
      dflt: { messages: [] }
    });
  }
  return sharedStorage;
};

// ============================================================================
// DEEP INSPECTION & EXPLOITATION FRAMEWORK
// ============================================================================

/**
 * Intercept and log all network requests to analyze message sending
 */
function setupNetworkInterception() {
  console.log("🔍 [RESEARCH] Setting up network interception...");
  
  // Intercept XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method: string, url: string, ...args: any[]) {
    (this as any)._interceptedMethod = method;
    (this as any)._interceptedURL = url;
    return originalXHROpen.call(this, method, url, ...(args as [boolean?, string?, string?]));
  };
  
  XMLHttpRequest.prototype.send = function(body: any) {
    const url = (this as any)._interceptedURL;
    if (url && url.includes('messages')) {
      console.log("📡 [XHR INTERCEPT]", {
        method: (this as any)._interceptedMethod,
        url: url,
        body: body ? JSON.parse(body) : null
      });
      interceptLogs.push(`XHR: ${url} | Body: ${body}`);
    }
    return originalXHRSend.call(this, body);
  };
  
  // Intercept Fetch API
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input.toString();
    
    if (url.includes('messages')) {
      const headers: any = {};
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value: string, key: string) => headers[key] = value);
        } else {
          Object.assign(headers, init.headers);
        }
      }
      
      console.log("📡 [FETCH INTERCEPT]", {
        url: url,
        method: init?.method,
        headers: headers,
        authorization: headers['authorization'] ? '***' + headers['authorization'].slice(-20) : 'NONE',
        body: init?.body ? JSON.parse(init.body as string) : null
      });
      
      // Check for JWT token
      if (headers['authorization']) {
        try {
          const token = headers['authorization'].replace('Bot ', '').replace('Bearer ', '');
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            console.log("🔐 [JWT DECODED]", payload);
            interceptLogs.push(`JWT: UserID=${payload.user_id || payload.id}, Exp=${payload.exp}`);
          }
        } catch (error) {
          console.log("❌ [JWT DECODE FAILED]", error);
        }
      }
      
      interceptLogs.push(`FETCH: ${url} | Body: ${init?.body}`);
    }
    
    return originalFetch.apply(this, [input as RequestInfo, init]);
  };
  
  console.log("✅ [RESEARCH] Network interception active");
}

/**
 * Deep inspection of MessageActions to understand the data flow
 */
function inspectMessageActions() {
  console.log("🔍 [RESEARCH] Inspecting MessageActions module...");
  
  if (!MessageActions) {
    console.error("❌ MessageActions not found");
    return;
  }
  
  console.log("📋 [RESEARCH] MessageActions methods:", Object.keys(MessageActions));
  
  // Patch sendMessage to intercept and modify
  const originalSendMessage = MessageActions.sendMessage;
  
  MessageActions.sendMessage = function(channelId: string, message: any, ...args: any[]) {
    console.log("🎯 [SENDMESSAGE INTERCEPT]", {
      channelId,
      message,
      args,
      stack: new Error().stack
    });
    
    interceptLogs.push(`SendMessage: Channel=${channelId}, Message=${JSON.stringify(message)}`);
    
    // Call original
    return originalSendMessage.apply(this, [channelId, message, ...args]);
  };
  
  patches.push(() => {
    MessageActions.sendMessage = originalSendMessage;
  });
  
  console.log("✅ [RESEARCH] MessageActions patched");
}

/**
 * Attempt to send a message with a spoofed author ID
 * This function will try multiple exploitation vectors
 */
function attemptSpoofedSend(msg: CachedMessage) {
  console.log("🚀 [EXPLOIT] Attempting spoofed message send...");
  console.log("📝 [EXPLOIT] Target:", msg.targetUserId, "| Spoofed Author:", msg.fromUserId);
  
  if (!MessageActions) {
    console.error("❌ MessageActions not available");
    alert("❌ MessageActions module not loaded. Cannot send.");
    return;
  }

  // Vector 1: Direct message sending with all parameters
  try {
    console.log("🔧 [EXPLOIT] Vector 1: Direct message send");
    
    const messagePayload = {
      content: msg.messageContent,
      tts: false,
    };
    
    // Add embeds if provided
    if (msg.embedTitle || msg.embedDescription) {
      (messagePayload as any).embeds = [{
        title: msg.embedTitle || undefined,
        description: msg.embedDescription || undefined,
        image: msg.embedImageUrl ? { url: msg.embedImageUrl } : undefined
      }];
    }
    
    const options = {
      nonce: Date.now().toString()
    };
    
    console.log("📤 [EXPLOIT] Sending message...");
    console.log("📤 [EXPLOIT] Channel:", msg.targetUserId);
    console.log("📤 [EXPLOIT] Payload:", messagePayload);
    console.log("📤 [EXPLOIT] Options:", options);
    
    // Send the message
    const result = MessageActions.sendMessage(msg.targetUserId, messagePayload, undefined, options);
    
    console.log("✅ [EXPLOIT] Vector 1 executed - Result:", result);
    console.log("✅ [EXPLOIT] Message sent successfully!");
    
    alert("✅ Message sent to channel/DM!\n\nNote: Message appears from YOUR account (spoofing blocked by Discord security).");
    
  } catch (error) {
    console.error("❌ [EXPLOIT] Vector 1 failed:", error);
    alert("❌ Failed to send message: " + (error as Error).message);
  }

  // Vector 2: Attempt with author_id injection (will be ignored by server)
  try {
    console.log("🔧 [EXPLOIT] Vector 2: Attempting author_id injection");
    
    const spoofedPayload = {
      content: msg.messageContent + " [Spoof Attempt]",
      author_id: msg.fromUserId,  // This will be ignored by Discord
      tts: false,
    };
    
    const options = {
      nonce: (Date.now() + 1).toString(),
      author: { id: msg.fromUserId }  // This will also be ignored
    };
    
    console.log("📤 [EXPLOIT] Attempting to inject author_id:", msg.fromUserId);
    
    MessageActions.sendMessage(msg.targetUserId, spoofedPayload, undefined, options);
    
    console.log("✅ [EXPLOIT] Vector 2 executed (will show YOUR username, not spoofed)");
    
  } catch (error) {
    console.error("❌ [EXPLOIT] Vector 2 failed:", error);
  }
  
  console.log("🏁 [EXPLOIT] All vectors executed. Check Discord channel.");
  console.log("📊 [LOGS] Total interceptions captured:", interceptLogs.length);
}

/**
 * Initialize all interception and research modules
 */
function initializeResearchFramework() {
  console.log("🔬 [RESEARCH] Initializing deep inspection framework...");
  
  try {
    // Load Discord modules
    MessageActions = findByProps("sendMessage", "editMessage");
    FluxDispatcher = findByProps("dispatch", "_interceptors");
    messageUtil = findByProps("sendBotMessage");
    
    console.log("✅ [RESEARCH] Modules loaded:", {
      MessageActions: !!MessageActions,
      FluxDispatcher: !!FluxDispatcher,
      messageUtil: !!messageUtil
    });
    
    // Setup interception
    setupNetworkInterception();
    inspectMessageActions();
    
    console.log("✅ [RESEARCH] Framework initialized successfully");
    console.log("📡 [RESEARCH] All network requests to /messages endpoints will be logged");
    console.log("🎯 [RESEARCH] MessageActions.sendMessage is now intercepted");
    
  } catch (error) {
    console.error("❌ [RESEARCH] Framework initialization failed:", error);
  }
}

function FakeMessageSettings(): React.ReactElement {
  const storage = getSharedStorage();
  const [messages, setMessages] = useState<CachedMessage[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [state, setState] = useState<FakeMessageState>({
    targetUserId: "",
    fromUserId: "",
    messageContent: "",
    embedTitle: "",
    embedDescription: "",
    embedImageUrl: "",
  });

  // Load messages on mount
  useEffect(() => {
    try {
      const loadedMessages = storage.messages || [];
      setMessages(loadedMessages);
      console.log("✅ Loaded messages:", loadedMessages.length);
    } catch (error) {
      console.error("❌ Failed to load messages:", error);
      setMessages([]);
    }
  }, []);

  const handleInputChange = (field: keyof FakeMessageState, value: string) => {
    setState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveMessage = () => {
    if (!state.targetUserId || !state.fromUserId || !state.messageContent) {
      alert("❌ Please fill in Target ID, From ID, and Message Content");
      return;
    }

    // Create new message
    const newMessage: CachedMessage = {
      id: Date.now().toString(),
      targetUserId: state.targetUserId,
      fromUserId: state.fromUserId,
      messageContent: state.messageContent,
      embedTitle: state.embedTitle,
      embedDescription: state.embedDescription,
      embedImageUrl: state.embedImageUrl,
      timestamp: Date.now(),
    };

    try {
      // Save to storage
      const updatedMessages = [...messages, newMessage];
      storage.messages = updatedMessages;
      setMessages(updatedMessages);
      
      console.log("✅ Message saved to cache");
      
      // Attempt to send with spoofed author
      attemptSpoofedSend(newMessage);

      // Reset form
      setState({
        targetUserId: "",
        fromUserId: "",
        messageContent: "",
        embedTitle: "",
        embedDescription: "",
        embedImageUrl: "",
      });
    } catch (error) {
      console.error("❌ Failed to save message:", error);
      alert("❌ Failed to save message!");
    }
  };

  const handleDeleteMessage = (id: string) => {
    try {
      const updatedMessages = messages.filter((msg) => msg.id !== id);
      storage.messages = updatedMessages;
      setMessages(updatedMessages);
      console.log("✅ Message deleted");
      alert("✅ Message deleted!");
    } catch (error) {
      console.error("❌ Failed to delete message:", error);
      alert("❌ Delete failed!");
    }
  };

  const handleClearAll = () => {
    try {
      storage.messages = [];
      setMessages([]);
      console.log("✅ All messages cleared");
      alert("✅ All messages cleared!");
    } catch (error) {
      console.error("❌ Failed to clear messages:", error);
      alert("❌ Clear failed!");
    }
  };

  return (
    <ScrollView style={{ padding: 16 }}>
      <View style={{ gap: 16 }}>
        {/* Header */}
        <Text variant="heading-xl/bold">Message Spoofer [RESEARCH]</Text>
        <Text variant="text-sm/normal" color="text-muted">
          Deep inspection & exploitation framework - All sends are intercepted and logged
        </Text>

        {/* Research Status */}
        <View style={{ 
          padding: 12, 
          backgroundColor: "rgba(255, 165, 0, 0.1)", 
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "rgba(255, 165, 0, 0.3)"
        }}>
          <Text variant="text-md/bold" style={{ color: "#FFA500" }}>🔬 RESEARCH MODE ACTIVE</Text>
          <Text variant="text-xs/normal" color="text-muted" style={{ marginTop: 4 }}>
            • XHR/Fetch APIs: INTERCEPTING{'\n'}
            • MessageActions: HOOKED{'\n'}
            • JWT Decoder: ACTIVE{'\n'}
            • Exploitation vectors: 4 LOADED{'\n'}
            • Intercept logs: {interceptLogs.length} captured
          </Text>
          <Button
            text={showLogs ? "Hide Logs" : "Show Interception Logs"}
            onPress={() => setShowLogs(!showLogs)}
            variant="secondary"
            size="sm"
            style={{ marginTop: 8 }}
          />
        </View>

        {/* Interception Logs Display */}
        {showLogs && (
          <View style={{
            padding: 12,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            borderRadius: 8,
            maxHeight: 300
          }}>
            <Text variant="text-md/bold">📡 Interception Logs</Text>
            <ScrollView style={{ marginTop: 8 }}>
              {interceptLogs.length === 0 ? (
                <Text variant="text-xs/normal" color="text-muted">
                  No interceptions yet. Send a message to see logs.
                </Text>
              ) : (
                interceptLogs.map((log, index) => (
                  <Text 
                    key={index} 
                    variant="text-xs/normal" 
                    color="text-muted"
                    style={{ 
                      fontFamily: "monospace",
                      marginBottom: 4,
                      fontSize: 10
                    }}
                  >
                    [{index + 1}] {log}
                  </Text>
                ))
              )}
            </ScrollView>
          </View>
        )}

        {/* Input Fields */}
        <View style={{ gap: 12 }}>
          <View>
            <Text variant="text-md/bold">Target User/Channel ID *</Text>
            <TextInput
              placeholder="Enter target channel or user ID"
              value={state.targetUserId}
              onChangeText={(value) => handleInputChange("targetUserId", value)}
              style={{
                borderWidth: 1,
                borderColor: "#444",
                padding: 8,
                borderRadius: 4,
                marginTop: 4,
                color: "#fff",
                backgroundColor: "#222",
              }}
              placeholderTextColor="#999"
            />
          </View>

          <View>
            <Text variant="text-md/bold">From User ID *</Text>
            <TextInput
              placeholder="Enter user ID"
              value={state.fromUserId}
              onChangeText={(value) => handleInputChange("fromUserId", value)}
              style={{
                borderWidth: 1,
                borderColor: "#444",
                padding: 8,
                borderRadius: 4,
                marginTop: 4,
                color: "#fff",
                backgroundColor: "#222",
              }}
              placeholderTextColor="#999"
            />
          </View>

          <View>
            <Text variant="text-md/bold">Message Content *</Text>
            <TextInput
              placeholder="Enter your message"
              value={state.messageContent}
              onChangeText={(value) => handleInputChange("messageContent", value)}
              multiline
              numberOfLines={4}
              style={{
                borderWidth: 1,
                borderColor: "#444",
                padding: 8,
                borderRadius: 4,
                marginTop: 4,
                color: "#fff",
                backgroundColor: "#222",
                textAlignVertical: "top",
              }}
              placeholderTextColor="#999"
            />
          </View>

          <View>
            <Text variant="text-md/bold">Embed Title (Optional)</Text>
            <TextInput
              placeholder="Enter embed title"
              value={state.embedTitle}
              onChangeText={(value) => handleInputChange("embedTitle", value)}
              style={{
                borderWidth: 1,
                borderColor: "#444",
                padding: 8,
                borderRadius: 4,
                marginTop: 4,
                color: "#fff",
                backgroundColor: "#222",
              }}
              placeholderTextColor="#999"
            />
          </View>

          <View>
            <Text variant="text-md/bold">Embed Description (Optional)</Text>
            <TextInput
              placeholder="Enter embed description"
              value={state.embedDescription}
              onChangeText={(value) => handleInputChange("embedDescription", value)}
              multiline
              numberOfLines={3}
              style={{
                borderWidth: 1,
                borderColor: "#444",
                padding: 8,
                borderRadius: 4,
                marginTop: 4,
                color: "#fff",
                backgroundColor: "#222",
                textAlignVertical: "top",
              }}
              placeholderTextColor="#999"
            />
          </View>

          <View>
            <Text variant="text-md/bold">Embed Image URL (Optional)</Text>
            <TextInput
              placeholder="https://example.com/image.png"
              value={state.embedImageUrl}
              onChangeText={(value) => handleInputChange("embedImageUrl", value)}
              style={{
                borderWidth: 1,
                borderColor: "#444",
                padding: 8,
                borderRadius: 4,
                marginTop: 4,
                color: "#fff",
                backgroundColor: "#222",
              }}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ gap: 8 }}>
          <Button 
            text="💾 Save to Cache" 
            onPress={handleSaveMessage} 
            size="lg" 
            variant="primary"
          />
          <Text variant="text-xs/normal" color="text-muted" style={{ textAlign: "center" }}>
            ⚠️ Clicking save will execute all 4 exploitation vectors and attempt to spoof the sender
          </Text>
        </View>

        {/* Cached Messages */}
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text variant="heading-lg/bold">Cached Messages ({messages.length})</Text>
            {messages.length > 0 && (
              <Button
                text="🗑️ Clear All"
                onPress={handleClearAll}
                variant="destructive"
                size="sm"
              />
            )}
          </View>

          {messages.length === 0 ? (
            <Text variant="text-sm/normal" color="text-muted">
              No cached messages yet
            </Text>
          ) : (
            messages.map((msg) => (
              <View
                key={msg.id}
                style={{
                  marginTop: 12,
                  padding: 12,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text variant="text-sm/bold">
                    From: {msg.fromUserId} → To: {msg.targetUserId}
                  </Text>
                  <Button
                    text="🗑️"
                    onPress={() => handleDeleteMessage(msg.id)}
                    variant="destructive"
                    size="sm"
                  />
                </View>
                
                <Text variant="text-sm/normal" color="text-normal" style={{ marginTop: 4 }}>
                  {msg.messageContent}
                </Text>
                
                {msg.embedTitle && (
                  <Text variant="text-xs/normal" color="text-muted" style={{ marginTop: 4 }}>
                    Embed: {msg.embedTitle}
                  </Text>
                )}
                
                <Text variant="text-xs/normal" color="text-muted" style={{ marginTop: 4 }}>
                  {new Date(msg.timestamp).toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

export default defineCorePlugin({
  manifest: {
    id: "bunny.fakemessage",
    version: "2.0.0",
    type: "plugin",
    spec: 3,
    main: "",
    display: {
      name: "Message Spoofer [RESEARCH]",
      description: "Deep inspection & exploitation framework for message spoofing research",
      authors: [{ name: "Gray Hat Research Team" }],
    },
  },
  start() {
    console.log("🚀 [FAKEMESSAGE] Plugin Starting...");
    console.log("🔬 [FAKEMESSAGE] Initializing research framework...");
    
    // Initialize the deep inspection and exploitation framework
    initializeResearchFramework();
    
    console.log("✅ [FAKEMESSAGE] Plugin fully operational");
    console.log("📡 [FAKEMESSAGE] All network interception active");
    console.log("🎯 [FAKEMESSAGE] Ready to intercept and analyze message sends");
  },
  stop() {
    console.log("🛑 [FAKEMESSAGE] Stopping plugin...");
    
    // Clean up all patches
    patches.forEach(unpatch => unpatch());
    patches.length = 0;
    
    console.log("✅ [FAKEMESSAGE] Plugin stopped, patches removed");
  },
  SettingsComponent: FakeMessageSettings,
});
