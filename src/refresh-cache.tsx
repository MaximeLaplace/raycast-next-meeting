import { updateCommandMetadata } from "@raycast/api";

import { fetchNextEvent, formatTimeUntil, parseEvent, writeCache } from "./get-next-event";

export default async function RefreshCache() {
  try {
    const raw = fetchNextEvent();
    writeCache(raw);

    const event = parseEvent(raw);
    if (event && !event.isAllDay) {
      const timeStr = formatTimeUntil(event.startTimestamp);
      await updateCommandMetadata({ subtitle: `${event.title} - ${timeStr === "happening now" ? "now" : `in ${timeStr}`}` });
    } else if (event) {
      await updateCommandMetadata({ subtitle: `${event.title} - all day` });
    } else {
      await updateCommandMetadata({ subtitle: "No upcoming meetings" });
    }
  } catch {
    // Silently fail — next interval will retry
  }
}
