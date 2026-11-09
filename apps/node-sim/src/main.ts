import { parseArgs } from "node:util";
import { listSessions, loadSession } from "./load-session";
import { rebaseSession } from "./rebase-session";
import { replay } from "./replay";
import { batchSender } from "./send-batch";

const USAGE = `Usage: pnpm --filter node-sim start [options] <session>...

Replays recorded sessions from fixtures/sessions against the API.

Options:
  --url <url>        API base URL (default http://localhost:3000)
  --token <token>    device token (default $GOTA_DEVICE_TOKEN)
  --device <id>      device id (default gota-sim)
  --speed <n>        0 sends at once; n > 0 replays n times faster than real time (default 0)
  --list             list the available sessions`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    url: { type: "string", default: "http://localhost:3000" },
    token: { type: "string" },
    device: { type: "string", default: "gota-sim" },
    speed: { type: "string", default: "0" },
    list: { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
});

if (values.help) {
  console.log(USAGE);
} else if (values.list) {
  console.log(listSessions().join("\n"));
} else {
  const token = values.token ?? process.env.GOTA_DEVICE_TOKEN;
  if (!token || positionals.length === 0) {
    console.error(token ? USAGE : "Missing --token or GOTA_DEVICE_TOKEN.");
    process.exit(1);
  }
  const send = batchSender({ url: values.url, token, deviceId: values.device, firmware: "sim" });
  // Seqs start at the current Unix time in ms so repeated runs never reuse one.
  let seqStart = Date.now();
  const speed = Number(values.speed);
  for (const name of positionals) {
    const recorded = loadSession(name);
    const durationMs = (recorded.at(-1)?.uptime_ms ?? 0) - (recorded[0]?.uptime_ms ?? 0);
    const events = rebaseSession(
      recorded,
      speed > 0
        ? { seqStart, startMs: Date.now(), timeScale: 1 / speed }
        : { seqStart, startMs: Date.now() - durationMs },
    );
    const acceptedSeq = await replay(events, { send, speed }).catch((error: unknown) => {
      console.error(`${name}: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    });
    console.log(`${name}: ${events.length} events sent, accepted up to seq ${acceptedSeq}`);
    seqStart = acceptedSeq + 1;
  }
}
