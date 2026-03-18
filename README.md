<p align="center">
  <img src="assets/extension-icon.png" width="100" />
</p>

# Next Meeting

A [Raycast](https://raycast.com) extension that shows all your upcoming calendar meetings and how long until each one starts.

<p align="center">
  <img width="600" alt="Next Meeting extension showing upcoming calendar events in Raycast" src="https://github.com/user-attachments/assets/ac83664a-cca8-4961-8245-d3386ad54dc3" />
</p>

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
