import { useEffect, useRef, useState } from "react";
import { ChevronDown, Compass } from "lucide-react";
import { SAMPLE_GOALS } from "../data/sampleGoals";
import type { SampleGoal } from "../types/curriculum";

interface TopNavProps {
  onSelectSample: (sample: SampleGoal) => void;
  isGenerating: boolean;
}

export function TopNav({ onSelectSample, isGenerating }: TopNavProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleChooseSample = (sample: SampleGoal) => {
    setOpen(false);
    onSelectSample(sample);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3.5 py-3 sm:gap-6 sm:px-6 sm:py-3.5 lg:px-8">
        {/* Brand Zone */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white sm:h-9 sm:w-9">
            <Compass className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2.5 min-w-0">
            <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 sm:text-lg">
              PathCraft AI
            </span>
            <span className="hidden text-xs font-medium text-slate-400 md:inline" aria-hidden="true">
              /
            </span>
            <span className="hidden text-xs font-medium text-slate-500 md:inline whitespace-nowrap">
              4-Week Learning Path Builder
            </span>
          </div>
        </div>

        {/* Right Action: Load Sample Goal Dropdown */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-haspopup="menu"
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0 sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
          >
            <span className="sm:hidden">Sample Goal</span>
            <span className="hidden sm:inline">Load Sample Goal</span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-150 sm:h-4 sm:w-4 ${
                open ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>

          {open && (
            <div
              role="menu"
              aria-label="Sample learning goals"
              className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1.75rem))] origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/5 sm:w-80"
            >
              <div className="px-3 py-2 text-xs font-medium text-slate-500 border-b border-slate-100">
                Choose a preset to generate immediately
              </div>
              <div className="mt-1 space-y-0.5">
                {SAMPLE_GOALS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    role="menuitem"
                    onClick={() => handleChooseSample(sample)}
                    className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-indigo-50/70 focus-visible:bg-indigo-50 focus-visible:outline-none"
                  >
                    <div className="text-sm font-semibold text-slate-900">
                      {sample.label}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {sample.shortMeta}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
