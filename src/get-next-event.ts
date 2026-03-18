import { Cache } from "@raycast/api";
import { execSync } from "child_process";

// ---------------------------------------------------------------------------
// JXA script — reads EventKit directly, no access request needed (~0.1s)
// Looks ahead 7 days to always find the next event
// ---------------------------------------------------------------------------

const JXA_SCRIPT = `
ObjC.import("EventKit");
ObjC.import("Foundation");

var store = $.EKEventStore.alloc.init;
var cals = store.calendarsForEntityType(0);
var now = $.NSDate.date;
var horizon = $.NSDate.dateWithTimeIntervalSinceNow(7 * 86400);
var pred = store.predicateForEventsWithStartDateEndDateCalendars(now, horizon, cals);
var events = store.eventsMatchingPredicate(pred);

if (events.count === 0) {
  "NONE";
} else {
  var desc = $.NSSortDescriptor.sortDescriptorWithKeyAscending("startDate", true);
  var sorted = events.sortedArrayUsingDescriptors($.NSArray.arrayWithObject(desc));

  // Skip all-day events to find the next timed event, fall back to first event
  var picked = sorted.objectAtIndex(0);
  for (var i = 0; i < sorted.count; i++) {
    var candidate = sorted.objectAtIndex(i);
    if (!candidate.isAllDay) {
      picked = candidate;
      break;
    }
  }

  var title = ObjC.unwrap(picked.title) || "Untitled";
  var s = picked.startDate.timeIntervalSince1970;
  var en = picked.endDate.timeIntervalSince1970;
  var a = picked.isAllDay;
  var l = ObjC.unwrap(picked.location) || "";
  var n = ObjC.unwrap(picked.notes) || "";
  var u = picked.URL ? ObjC.unwrap(picked.URL.absoluteString) || "" : "";
  title + "|||" + s + "|||" + en + "|||" + a + "|||" + l + "|||" + n + "|||" + u;
}
`;

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

const cache = new Cache();
const CACHE_KEY = "next-event";
const CACHE_TS_KEY = "next-event-ts";
const THIRTY_MINUTES = 30 * 60 * 1000;

export interface CalendarEvent {
  title: string;
  startTimestamp: number;
  endTimestamp: number;
  isAllDay: boolean;
  location: string;
  notes: string;
  url: string;
}

export function parseEvent(output: string): CalendarEvent | null {
  const trimmed = output.trim();
  if (!trimmed || trimmed === "NONE") return null;

  const [title, startTs, endTs, allDay, location, notes, url] = trimmed.split("|||");
  return {
    title: title || "Untitled Meeting",
    startTimestamp: parseFloat(startTs),
    endTimestamp: parseFloat(endTs),
    isAllDay: allDay === "true",
    location: location || "",
    notes: notes || "",
    url: url || "",
  };
}

export function fetchNextEvent(): string {
  return execSync(`osascript -l JavaScript -e '${JXA_SCRIPT.replace(/'/g, "'\\''")}'`, {
    encoding: "utf-8",
    timeout: 10000,
  }).trim();
}

export function readCache(): CalendarEvent | null {
  const raw = cache.get(CACHE_KEY);
  return raw ? parseEvent(raw) : null;
}

export function writeCache(raw: string) {
  cache.set(CACHE_KEY, raw);
  cache.set(CACHE_TS_KEY, String(Date.now()));
}

export function isCacheStale(): boolean {
  const ts = cache.get(CACHE_TS_KEY);
  if (!ts) return true;
  return Date.now() - Number(ts) > THIRTY_MINUTES;
}

export function isEventPast(event: CalendarEvent): boolean {
  return event.endTimestamp * 1000 < Date.now();
}
