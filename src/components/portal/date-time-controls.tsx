"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { dateInTimezone, timeInTimezone, todayInTimezone, zonedDateTimeToUtcIso } from "@/lib/timezone";

type FieldProps = {
  name: string;
  label: string;
  helper?: string;
  timezone: string;
  required?: boolean;
  optional?: boolean;
  defaultValue?: string | Date | null;
  className?: string;
};

const fieldClass = "h-10 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none transition focus:border-accent";

export function DatePicker({ name, label, helper, timezone, required, optional, defaultValue, className }: FieldProps) {
  const initialDate = defaultValue ? dateInTimezone(defaultValue, timezone) : required ? todayInTimezone(timezone) : "";
  const [value, setValue] = useState(initialDate);

  return (
    <FieldShell label={label} helper={helper} required={required} className={className}>
      <CalendarPicker value={value} onChange={setValue} timezone={timezone} optional={optional} />
      <input type="hidden" name={name} value={value} required={required} />
    </FieldShell>
  );
}

export function TimePicker({ name, label, helper, timezone, required, defaultValue, className }: FieldProps) {
  const [value, setValue] = useState(defaultValue ? timeInTimezone(defaultValue, timezone) : "");

  return (
    <FieldShell label={label} helper={helper} required={required} className={className}>
      <TimeSelect value={value} onChange={setValue} timezone={timezone} required={required} />
      <input type="hidden" name={name} value={value} required={required} />
    </FieldShell>
  );
}

export function DateTimePicker({ name, label, helper, timezone, required, optional, defaultValue, className }: FieldProps) {
  const [dateValue, setDateValue] = useState(defaultValue ? dateInTimezone(defaultValue, timezone) : "");
  const [timeValue, setTimeValue] = useState(defaultValue ? timeInTimezone(defaultValue, timezone) : "");
  const normalized = useMemo(() => zonedDateTimeToUtcIso(dateValue, timeValue, timezone), [dateValue, timeValue, timezone]);

  return (
    <FieldShell label={label} helper={helper} required={required} className={className}>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_190px]">
        <CalendarPicker value={dateValue} onChange={setDateValue} timezone={timezone} optional={optional} />
        <TimeSelect value={timeValue} onChange={setTimeValue} timezone={timezone} required={required} />
      </div>
      <input type="hidden" name={name} value={normalized} required={required} />
    </FieldShell>
  );
}

export function TimezoneDisplay({ timezone }: { timezone: string }) {
  return <p className="text-xs font-medium text-accent">Times shown in {timezone}</p>;
}

export function BreakDurationSelect({ name = "breakMinutes", label, helper, className, defaultValue }: { name?: string; label: string; helper?: string; className?: string; defaultValue?: number | string | null }) {
  const initialMinutes = String(defaultValue ?? 0);
  const [selected, setSelected] = useState(["0", "15", "30", "45", "60"].includes(initialMinutes) ? initialMinutes : "custom");
  const [customMinutes, setCustomMinutes] = useState(initialMinutes);
  const submittedValue = selected === "custom" ? customMinutes : selected;

  return (
    <FieldShell label={label} helper={helper} className={className}>
      <input type="hidden" name={name} value={submittedValue} />
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px]">
        <select value={selected} onChange={(event) => setSelected(event.target.value)} className={fieldClass}>
          <option value="0">0 minutes</option>
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">60 minutes</option>
          <option value="custom">Custom</option>
        </select>
        <input
          type="number"
          min="0"
          max="480"
          step="5"
          value={customMinutes}
          onChange={(event) => setCustomMinutes(event.target.value)}
          disabled={selected !== "custom"}
          aria-label="Custom break minutes"
          className={cn(fieldClass, selected !== "custom" && "opacity-45")}
        />
      </div>
    </FieldShell>
  );
}

export function FieldShell({
  label,
  helper,
  required,
  className,
  children
}: {
  label: string;
  helper?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block space-y-2", className)}>
      <span className="flex items-center gap-2 text-sm font-medium text-white/84">
        {label}
        {required ? <span className="rounded-full bg-accent/14 px-2 py-0.5 text-[11px] text-accent">Required</span> : null}
      </span>
      {helper ? <span className="block text-xs leading-5 text-white/48">{helper}</span> : null}
      {children}
    </label>
  );
}

function CalendarPicker({
  value,
  onChange,
  timezone,
  optional
}: {
  value: string;
  onChange: (value: string) => void;
  timezone: string;
  optional?: boolean;
}) {
  const today = todayInTimezone(timezone);
  const [open, setOpen] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(value || today));
  const days = useMemo(() => buildCalendarDays(monthCursor), [monthCursor]);

  useEffect(() => {
    if (value) setMonthCursor(startOfMonth(value));
  }, [value]);

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} className={cn(fieldClass, "text-left")}>
        {value ? humanDate(value) : "Select date"}
      </button>
      {open ? (
        <div className="absolute z-30 mt-2 w-[292px] rounded-lg border border-white/10 bg-zinc-950 p-3 shadow-2xl shadow-black/40">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" className="rounded-md p-2 hover:bg-white/10" onClick={() => setMonthCursor(addMonths(monthCursor, -1))} aria-label="Previous month">
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-semibold">{monthTitle(monthCursor)}</span>
            <button type="button" className="rounded-md p-2 hover:bg-white/10" onClick={() => setMonthCursor(addMonths(monthCursor, 1))} aria-label="Next month">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase text-white/42">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {days.map((day) => (
              <button
                type="button"
                key={day.value}
                onClick={() => {
                  onChange(day.value);
                  setOpen(false);
                }}
                className={cn(
                  "h-8 rounded-md text-sm text-white/72 hover:bg-white/10",
                  !day.currentMonth && "text-white/28",
                  value === day.value && "bg-accent text-zinc-950 hover:bg-accent"
                )}
              >
                {day.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => onChange(today)} className="h-8 rounded-md border border-white/10 px-3 text-xs hover:bg-white/10">Today</button>
            {optional ? <button type="button" onClick={() => onChange("")} className="h-8 rounded-md border border-white/10 px-3 text-xs hover:bg-white/10">Clear</button> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TimeSelect({ value, onChange, timezone, required }: { value: string; onChange: (value: string) => void; timezone: string; required?: boolean }) {
  const options = useMemo(() => buildTimeOptions(), []);
  return (
    <div>
      <select value={value} onChange={(event) => onChange(event.target.value)} required={required} className={fieldClass}>
        <option value="">Select time</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <p className="mt-1 text-xs text-white/42">{timezone}</p>
    </div>
  );
}

function buildTimeOptions() {
  const options: Array<{ value: string; label: string }> = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 5) {
      const suffix = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      options.push({ value, label: `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}` });
    }
  }
  return options;
}

function buildCalendarDays(monthCursor: Date) {
  const year = monthCursor.getUTCFullYear();
  const month = monthCursor.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1));
  const start = new Date(firstDay);
  start.setUTCDate(1 - firstDay.getUTCDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return {
      value: date.toISOString().slice(0, 10),
      label: String(date.getUTCDate()),
      currentMonth: date.getUTCMonth() === month
    };
  });
}

function startOfMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

function addMonths(date: Date, amount: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
}

function monthTitle(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

function humanDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
}
