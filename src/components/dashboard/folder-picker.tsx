"use client";

import { useEffect, useState } from "react";
import { FolderOpen, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FolderPickerProps {
  onScan: (path: string) => void;
  isScanning: boolean;
  lastPath?: string;
}

export function FolderPicker({ onScan, isScanning, lastPath }: FolderPickerProps) {
  const [path, setPath] = useState(lastPath ?? "");
  const [isElectron, setIsElectron] = useState(false);

  // Detect Electron after hydration to avoid SSR mismatch
  useEffect(() => {
    setIsElectron(!!window.electronAPI?.isElectron);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = path.trim();
    if (!trimmed) return;
    onScan(trimmed);
  };

  /** Open the native OS folder picker (Electron only) */
  const handleBrowse = async () => {
    if (!window.electronAPI) return;
    const selected = await window.electronAPI.selectDirectory();
    if (selected) {
      setPath(selected);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1 space-y-1.5">
        <label
          htmlFor="root-path-input"
          className="text-sm font-medium text-muted-foreground"
        >
          Root directory path
        </label>
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <FolderOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="root-path-input"
              type="text"
              placeholder={
                isElectron
                  ? 'Click "Browse" or type a path…'
                  : "/Users/you/Projects"
              }
              value={path}
              onChange={(e) => setPath(e.target.value)}
              disabled={isScanning}
              className="h-11 pl-10 font-mono text-sm"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* Native folder picker button — only visible inside Electron */}
          {isElectron && (
            <Button
              id="browse-button"
              type="button"
              variant="outline"
              onClick={handleBrowse}
              disabled={isScanning}
              className="h-11 shrink-0 cursor-pointer gap-2 border-border/60 transition-colors hover:bg-muted/60"
            >
              <FolderOpen className="h-4 w-4" />
              Browse
            </Button>
          )}
        </div>
      </div>

      <Button
        id="scan-button"
        type="submit"
        disabled={isScanning || !path.trim()}
        className="h-11 min-w-[140px] cursor-pointer bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg shadow-emerald-600/20 transition-all hover:from-emerald-500 hover:to-cyan-500 hover:shadow-emerald-500/30 disabled:opacity-50"
      >
        {isScanning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Scanning…
          </>
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" />
            Scan Projects
          </>
        )}
      </Button>
    </form>
  );
}
