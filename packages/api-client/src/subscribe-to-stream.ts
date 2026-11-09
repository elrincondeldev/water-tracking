import { type StreamEvent, type StreamEventType, streamEventSchema } from "@gota/contracts";

const EVENT_TYPES: StreamEventType[] = ["summary", "device", "intake"];

export type StreamHandlers = {
  onEvent: (event: StreamEvent) => void;
  onConnectionChange?: (connected: boolean) => void;
};

export type StreamOptions = {
  baseUrl?: string;
  EventSource?: typeof globalThis.EventSource;
};

export function subscribeToStream(
  handlers: StreamHandlers,
  { baseUrl = "", EventSource = globalThis.EventSource }: StreamOptions = {},
): () => void {
  const source = new EventSource(`${baseUrl}/api/v1/stream`);
  source.onopen = () => handlers.onConnectionChange?.(true);
  source.onerror = () => handlers.onConnectionChange?.(false);
  for (const type of EVENT_TYPES) {
    source.addEventListener(type, (message) => {
      const parsed = streamEventSchema.safeParse({ type, data: JSON.parse(message.data) });
      if (parsed.success) handlers.onEvent(parsed.data);
    });
  }
  return () => source.close();
}
