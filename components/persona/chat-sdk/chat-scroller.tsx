"use client";

import * as React from "react";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerViewport,
  MessageScrollerButton,
  MessageScrollerItem,
  useMessageScroller,
} from "@/components/ui/message-scroller";
import { cn } from "@/lib/utils";

interface ChatScrollerProps extends React.ComponentProps<typeof MessageScroller> {
  autoScrollToBottom?: boolean;
  hideScrollButton?: boolean;
}

function ChatScrollerBody({
  children,
  autoScrollToBottom = false,
  hideScrollButton = true,
}: {
  children: React.ReactNode;
  autoScrollToBottom?: boolean;
  hideScrollButton?: boolean;
}) {
  const { scrollToEnd } = useMessageScroller();
  const bottomAnchorRef = React.useRef<HTMLDivElement>(null);

  // In voice mode or when autoScrollToBottom is enabled, keep chat scrolled to the bottom
  React.useEffect(() => {
    if (autoScrollToBottom) {
      try {
        scrollToEnd({ behavior: "smooth" });
      } catch {
        bottomAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }
  }, [autoScrollToBottom, children, scrollToEnd]);

  return (
    <>
      <MessageScrollerViewport>
        <MessageScrollerContent className="mx-auto w-full max-w-3xl px-4 py-6">
          {children}
          <div ref={bottomAnchorRef} className="h-px w-full" aria-hidden="true" />
        </MessageScrollerContent>
      </MessageScrollerViewport>
      {!hideScrollButton && <MessageScrollerButton />}
    </>
  );
}

/**
 * Auto-scrolling chat viewport — wraps the `MessageScroller*` primitive.
 * Supports auto-scrolling to bottom during voice mode and hiding floating jump-to-bottom arrows.
 */
function ChatScroller({
  className,
  children,
  autoScrollToBottom = false,
  hideScrollButton = true,
  ...props
}: ChatScrollerProps) {
  return (
    <MessageScrollerProvider>
      <MessageScroller className={cn("flex-1", className)} {...props}>
        <ChatScrollerBody
          autoScrollToBottom={autoScrollToBottom}
          hideScrollButton={hideScrollButton}
        >
          {children}
        </ChatScrollerBody>
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

// Re-exported so callers wrap each message in one of these (enables
// content-visibility:auto per item) without a second import from ui/.
export { ChatScroller, MessageScrollerItem as ChatScrollerItem };
