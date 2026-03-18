<p align="center">
  <img src="assets/extension-icon.png" width="100" />
</p>

# Next Meeting

A [Raycast](https://raycast.com) extension that shows your next calendar meeting and how long until it starts.

## Features

- Reads events directly from macOS EventKit (no calendar permissions prompt)
- Instant display via cache, with background refresh
- Color-coded time indicator (green > 15m, orange > 5m, red < 5m)
- Detects video call links (Google Meet, Zoom, Microsoft Teams) for one-click join
- Background command updates the menu bar subtitle every 10 minutes

## Commands

| Command | Description |
|---------|-------------|
| **Next Meeting** | Show your next calendar event with time, location, and video link |
| **Refresh Calendar Cache** | Background task that keeps the subtitle up to date |

## Install

```bash
npm install
npm run dev
```
