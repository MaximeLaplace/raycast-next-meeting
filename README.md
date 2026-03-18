<p align="center">
  <img src="assets/extension-icon.png" width="100" />
</p>

# Next Meeting

A [Raycast](https://raycast.com) extension that shows all your upcoming calendar meetings and how long until each one starts.

## Features

- Reads events directly from macOS EventKit (no calendar permissions prompt)
- Instant display via cache, with background refresh
- Color-coded time indicator: green (> 1h), yellow (> 40m), orange (> 20m), red (< 20m)
- Detects video call links (Google Meet, Zoom, Microsoft Teams) for one-click join
- Background command updates the menu bar subtitle every 10 minutes

## Commands

| Command | Description |
|---------|-------------|
| **Next Meeting** | Show all upcoming calendar events with time, location, and video links |
| **Refresh Calendar Cache** | Background task that keeps the subtitle up to date |

## Install

```bash
npm install
npm run dev
```
