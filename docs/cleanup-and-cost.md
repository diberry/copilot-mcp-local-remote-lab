# Cleanup and cost

> This is a learning repository, not a production reference architecture.

ACA compute, ACR storage/build, Log Analytics ingestion, egress, and optional services can incur cost. Use one replica, bounded maximum scale, synthetic traffic, a budget alert, and prompt teardown.

Review the active subscription and environment, then:

```powershell
azd down --purge --force
az group exists --name YOUR_RESOURCE_GROUP
npm run clean
node scripts/verify-teardown.mjs
```

The group query must return `false`. Uninstall the lab plugin from the client, remove local lab containers by exact container ID, and verify no generated binding or credential-bearing file remains.
