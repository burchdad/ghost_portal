# Trial Configuration

`TrialSettings` stores Alex trial configuration:

- trial start and end dates
- weekly hour target
- maximum trial hours
- hourly rate in cents
- primary timezone
- required overlap timezone
- trial status

Stephen uses `America/Chicago`. Alex uses `Asia/Manila`. Dates are stored in UTC and rendered with explicit timezone context where possible.
