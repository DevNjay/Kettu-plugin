/// <reference types="react" />

declare module "@core/plugins/fakemessage" {
  import React from "react";

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

  export function FakeMessageSettings(): React.ReactElement;
}
