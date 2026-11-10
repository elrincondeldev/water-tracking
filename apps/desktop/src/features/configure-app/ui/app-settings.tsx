import { Button } from "@gota/ui";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { type FormEvent, useEffect, useState } from "react";
import { getApiUrl, normalizeApiUrl, saveApiUrl } from "@/shared/config";
import { Switch } from "@/shared/ui";

export function AppSettings({ onDone }: { onDone: () => void }) {
  const [apiUrl, setApiUrl] = useState(getApiUrl());
  const [error, setError] = useState<string | null>(null);
  const [launchAtLogin, setLaunchAtLogin] = useState<boolean | null>(null);

  useEffect(() => {
    void isEnabled().then(setLaunchAtLogin);
  }, []);

  const toggleLaunchAtLogin = async (on: boolean) => {
    await (on ? enable() : disable());
    setLaunchAtLogin(await isEnabled());
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const url = normalizeApiUrl(apiUrl);
    if (!url) return setError("Enter a full URL, like http://192.168.1.10:3000");
    if (url === getApiUrl()) return onDone();
    saveApiUrl(url);
    window.location.reload();
  };

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col gap-4">
      <div className="divide-y divide-pane-line rounded-xl border border-pane-line bg-pane">
        <label className="flex flex-col gap-1.5 px-3 py-2.5">
          <span className="text-[11px] text-muted">API address</span>
          <input
            value={apiUrl}
            onChange={(e) => {
              setApiUrl(e.target.value);
              setError(null);
            }}
            spellCheck={false}
            className="h-8 rounded-md border border-pane-line bg-raised/70 px-2.5 text-text tabular-nums select-text focus-visible:outline-2 focus-visible:outline-accent"
          />
          {error && <span className="text-xs text-danger">{error}</span>}
        </label>
        <div className="flex items-center justify-between px-3 py-2.5">
          <span>Open Gota at login</span>
          <Switch
            aria-label="Open Gota at login"
            disabled={launchAtLogin === null}
            checked={launchAtLogin ?? false}
            onChange={(on) => void toggleLaunchAtLogin(on)}
          />
        </div>
      </div>
      <p className="px-1 text-xs text-muted">
        Goal, reminders and quiet hours are set in the Gota web app.
      </p>
      <div className="mt-auto flex justify-end gap-2">
        <Button variant="ghost" className="h-8 rounded-lg px-3 text-[13px]" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" className="h-8 rounded-lg px-3 text-[13px]">
          Save
        </Button>
      </div>
    </form>
  );
}
