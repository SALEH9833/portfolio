// Every /api/* request is handled by the Express app in server/app.js.
const app = require('../../server/app');
const { autoMigrate } = require('../../server/db/auto-migrate');

// Create/upgrade tables once per server instance (idempotent).
let migrated = null;

export const config = {
  api: {
    bodyParser: false,      // Express parses JSON / multipart itself
    externalResolver: true, // Express sends the response
  },
};

export default async function handler(req, res) {
  if (!migrated) migrated = autoMigrate().catch((e) => { migrated = null; console.error(e); });
  await migrated;
  return app(req, res);
}
