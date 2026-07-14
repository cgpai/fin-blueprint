# Spreadsheet DB Schema

The app treats Google Sheets as the database.

## Runtime State

`state` is the app restore snapshot. The frontend reads this tab to hydrate the
React state quickly.

| key | purpose |
| --- | --- |
| `profiles` | Users keyed by email/name. |
| `profile` | Last saved profile, kept for compatibility only. |
| `phase` | Last app phase. |
| `processes` | Full process records with nested steps. |
| `systems` | System master records. |
| `notifications` | User inbox records. |
| `adminBroadcastLogs` | Admin broadcast history. |
| `improvementItems` | Transformation opportunity tracker. |

## Finance-Friendly Mirror Tabs

The Apps Script also writes flat tabs with business names so finance users can
read the spreadsheet without knowing the internal schema:

| tab | grain |
| --- | --- |
| `Users` | 1 row per registered user. |
| `Process Catalogue` | 1 row per documented process. |
| `Process Steps` | 1 row per process step, linked by Process ID. |
| `Systems Used` | 1 row per system. |
| `Inbox` | 1 row per notification. |
| `Broadcast History` | 1 row per programme broadcast. |
| `Improvement Tracker` | 1 row per transformation opportunity. |

Use `state` for the app. Use the relational tabs for audit, filtering, reporting,
and hand inspection.
