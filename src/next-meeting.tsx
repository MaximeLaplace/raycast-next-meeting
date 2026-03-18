import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { useExec } from "@raycast/utils";
import { useEffect, useMemo } from "react";

import { type CalendarEvent, isEventPast, isCacheStale, parseEvent, readCache, writeCache } from "./get-next-event";

// ---------------------------------------------------------------------------
// JXA script (duplicated as string for useExec)
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
// Helpers
// ---------------------------------------------------------------------------

function formatTimeUntil(timestamp: number): string {
  const diffMs = timestamp * 1000 - Date.now();
  if (diffMs <= 0) return "happening now";

  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function extractVideoLink(text: string): string | undefined {
  const patterns = [
    /https:\/\/meet\.google\.com\/[a-z-]+/i,
    /https:\/\/zoom\.us\/j\/\d+/i,
    /https:\/\/[a-z0-9]+\.zoom\.us\/j\/\d+/i,
    /https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s]+/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return undefined;
}

function getTimeColor(event: CalendarEvent): Color {
  if (event.isAllDay) return Color.Blue;
  const minutes = Math.floor((event.startTimestamp * 1000 - Date.now()) / 60_000);
  if (minutes <= 5) return Color.Red;
  if (minutes <= 15) return Color.Orange;
  return Color.Green;
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export default function NextMeeting() {
  // 1. Read cache synchronously — instant render
  const cachedEvent = useMemo(() => {
    const cached = readCache();
    return cached && !isEventPast(cached) ? cached : null;
  }, []);

  // 2. Fetch fresh data in background
  const { data: freshData } = useExec("osascript", ["-l", "JavaScript", "-e", JXA_SCRIPT], {
    shell: false,
  });

  // 3. Update cache when fresh data arrives
  useEffect(() => {
    if (freshData) writeCache(freshData);
  }, [freshData]);

  // Show fresh data if available, otherwise cached
  const event = freshData ? parseEvent(freshData) : cachedEvent;
  const showLoading = !cachedEvent && !freshData;
  const videoLink = event ? extractVideoLink(`${event.location} ${event.notes} ${event.url}`) : undefined;
  const stale = !freshData && isCacheStale();

  return (
    <List isLoading={showLoading}>
      {!showLoading && !event && (
        <List.EmptyView icon={Icon.CheckCircle} title="No upcoming meetings" description="Your calendar is clear!" />
      )}
      {event && (
        <List.Item
          icon={{ source: event.isAllDay ? Icon.Calendar : Icon.Clock, tintColor: getTimeColor(event) }}
          title={event.title}
          subtitle={event.isAllDay ? "All day" : `${formatTime(event.startTimestamp)} - ${formatTime(event.endTimestamp)}`}
          accessories={[
            ...(stale ? [{ tag: { value: "updating...", color: Color.SecondaryText } }] : []),
            ...(event.location ? [{ icon: Icon.Pin, text: event.location }] : []),
            ...(videoLink ? [{ icon: Icon.Video, tooltip: "Video call available" }] : []),
            {
              tag: {
                value: event.isAllDay ? "all day" : `in ${formatTimeUntil(event.startTimestamp)}`,
                color: getTimeColor(event),
              },
            },
          ]}
          actions={
            <ActionPanel>
              {videoLink && <Action.OpenInBrowser title="Join Video Call" url={videoLink} icon={Icon.Video} />}
              <Action.CopyToClipboard
                title="Copy Meeting Name"
                content={event.title}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}
