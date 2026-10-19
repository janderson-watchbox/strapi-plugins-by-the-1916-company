# strapi-plugin-view-settings-migrator

A Strapi v5 plugin to export and import rows from the `strapi_core_store_settings` table via the admin UI.

This is useful for migrating Content Manager view/layout settings between environments.

## Features

- Export `strapi_core_store_settings` as JSON
- Import settings from JSON
- Dry run mode for safe previews
- Scope mode:
  - `view`: only Content Manager and Upload view configuration rows
  - `all`: all rows in `strapi_core_store_settings`
- RBAC permissions:
  - `plugin::view-settings-migrator.read`
  - `plugin::view-settings-migrator.import`

## Requirements

- Node.js 18+
- Strapi v5

## Install

```bash
npm install strapi-plugin-view-settings-migrator
# or
yarn add strapi-plugin-view-settings-migrator
```

Restart Strapi and rebuild admin if needed:

```bash
npm run build
npm run develop
```

The plugin appears in the Strapi admin menu as **View Settings Migrator**.

## Usage

1. Open **View Settings Migrator** from the admin sidebar.
2. Pick scope (`View settings only` or `All rows`).
3. Export JSON from source environment.
4. In target environment, paste/upload the JSON.
5. Run **Dry Run** first, then **Import JSON**.

## Permissions

Grant plugin permissions to the roles that should use it:

- `Read`
- `Import`

## Local Development

If you want to test this plugin from a local Strapi project:

```bash
# in your Strapi app
npm install /absolute/path/to/strapi-plugin-view-settings-migrator
```

## License

MIT
