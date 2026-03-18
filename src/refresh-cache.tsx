import { updateCommandMetadata } from "@raycast/api";

import { fetchNextEvent, parseEvent, writeCache } from "./get-next-event";

export default async function RefreshCache() {
  try {
    const raw = fetchNextEvent();
    writeCache(raw);

    const event = parseEvent(raw);
    if (event && !event.isAllDay) {
      const diffMs = event.startTimestamp * 1000 - Date.now();
      if (diffMs > 0) {
        const mins = Math.floor(diffMs / 60_000);
        const hours = Math.floor(mins / 60);
        const rem = mins % 60;
        const timeStr = hours > 0 ? (rem > 0 ? `${hours}h ${rem}m` : `${hours}h`) : `${mins}m`;
        await updateCommandMetadata({ subtitle: `${event.title} - in ${timeStr}` });
      } else {
        await updateCommandMetadata({ subtitle: `${event.title} - now` });
      }
    } else if (event) {
      await updateCommandMetadata({ subtitle: `${event.title} - all day` });
    } else {
      await updateCommandMetadata({ subtitle: "No upcoming meetings" });
    }
  } catch {
    // Silently fail — next interval will retry
  }
}
