# Channel Service

Run instructions:

- Ensure the CRM backend is running. Default CRM callback URL used by this service should point to the CRM backend.

Environment variables (example in `.env.example`):

- `CRM_CALLBACK_URL` (required) e.g. `http://localhost:5000/api/callbacks/channel-events`
- `PORT` (default `5001`)

To run locally:

Windows PowerShell:

```powershell
Set-Location 'd:\Xeno-crm\channel-service'
$env:CRM_CALLBACK_URL='http://localhost:5002/api/callbacks/channel-events'
$env:PORT=5001
npm run dev
```

This service reads `CRM_CALLBACK_URL` from the environment and will not fall back to a hard-coded default. Make sure the value points to your running CRM backend.
