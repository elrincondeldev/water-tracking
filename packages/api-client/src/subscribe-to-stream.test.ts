import type { StreamEvent } from "@gota/contracts";
import { describe, expect, it } from "vitest";
import { subscribeToStream } from "./subscribe-to-stream";

class FakeEventSource {
  static last: FakeEventSource | undefined;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;
  listeners = new Map<string, (message: { data: string }) => void>();

  constructor(readonly url: string) {
    FakeEventSource.last = this;
  }

  addEventListener(type: string, listener: (message: { data: string }) => void) {
    this.listeners.set(type, listener);
  }

  emit(type: string, data: unknown) {
    this.listeners.get(type)?.({ data: JSON.stringify(data) });
  }

  close() {
    this.closed = true;
  }
}

function subscribe() {
  const events: StreamEvent[] = [];
  const connection: boolean[] = [];
  const unsubscribe = subscribeToStream(
    { onEvent: (e) => events.push(e), onConnectionChange: (c) => connection.push(c) },
    {
      baseUrl: "http://gota.lan:3000",
      EventSource: FakeEventSource as unknown as typeof EventSource,
    },
  );
  const source = FakeEventSource.last;
  if (!source) throw new Error("no event source");
  return { events, connection, unsubscribe, source };
}

describe("subscribeToStream", () => {
  it("parses named events from the stream URL", () => {
    const { events, source } = subscribe();
    expect(source.url).toBe("http://gota.lan:3000/api/v1/stream");
    source.emit("intake", {
      id: 2,
      kind: "sip",
      status: "counted",
      volume_ml: 46,
      occurred_at: "2026-11-09T21:23:57.759Z",
      bottle_id: 1,
      source_event_id: 30,
    });
    expect(events.map((e) => e.type)).toEqual(["intake"]);
  });

  it("drops events that break the contract", () => {
    const { events, source } = subscribe();
    source.emit("summary", { total_ml: "lots" });
    expect(events).toEqual([]);
  });

  it("reports the connection state and closes on unsubscribe", () => {
    const { connection, source, unsubscribe } = subscribe();
    source.onopen?.();
    source.onerror?.();
    unsubscribe();
    expect(connection).toEqual([true, false]);
    expect(source.closed).toBe(true);
  });
});
