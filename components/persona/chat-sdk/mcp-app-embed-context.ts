"use client";

import * as React from "react";

export interface McpAppSplit {
  /** A full-screen MCP app currently shares the viewport. */
  split: boolean;
  setSplit: (open: boolean) => void;
}

/**
 * Lets a full-screen MCP app share the viewport with the conversation instead
 * of covering it: the chat column narrows to the left and the app takes the
 * rest. A host that frames the chat (`PersonaChatFab`) provides it so its
 * frame can widen in the same commit; otherwise `PersonaChatView` provides
 * its own state.
 */
export const McpAppSplitContext = React.createContext<McpAppSplit | null>(null);
