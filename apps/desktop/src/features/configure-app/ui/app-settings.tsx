import { Button } from "@gota/ui";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { type FormEvent, useEffect, useState } from "react";
import { getApiUrl, normalizeApiUrl, saveApiUrl } from "@/shared/config";

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
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Gota API address</span>
        <input
          value={apiUrl}
          onChange={(e) => {
            setApiUrl(e.target.value);
            setError(null);
          }}
          spellCheck={false}
          className="h-9 rounded-xl border border-line bg-surface px-3 text-text select-text focus-visible:outline-2 focus-visible:outline-accent"
        />
        {error && <span className="text-xs text-danger">{error}</span>}
      </label>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          disabled={launchAtLogin === null}
          checked={launchAtLogin ?? false}
          onChange={(e) => void toggleLaunchAtLogin(e.target.checked)}
          className="size-4 accent-accent"
        />
        Open Gota at login
      </label>
      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        <Button variant="ghost" onClick={onDone}>
          Back
        </Button>
      </div>
    </form>
  );
}
