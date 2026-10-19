import * as React from 'react';

import { Layouts } from '@strapi/admin/strapi-admin';
import {
  Alert,
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  Textarea,
  Typography,
} from '@strapi/design-system';
import { Download, Upload } from '@strapi/icons';
import {
  Page,
  useAPIErrorHandler,
  useFetchClient,
  useNotification,
  useRBAC,
} from '@strapi/strapi/admin';

const EXPORT_FILE_PREFIX = 'strapi-core-store-settings';

const downloadJson = (payload) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${EXPORT_FILE_PREFIX}-${timestamp}.json`;
  const content = JSON.stringify(payload, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();

  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};

const parseJson = (rawText) => {
  try {
    return { data: JSON.parse(rawText), error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

const AppPage = () => {
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { formatAPIError } = useAPIErrorHandler();

  const [scope, setScope] = React.useState('view');
  const [importJsonText, setImportJsonText] = React.useState('');
  const [summary, setSummary] = React.useState(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);

  const {
    isLoading: isLoadingPermissions,
    allowedActions: { canRead, canImport },
  } = useRBAC({
    read: { action: 'plugin::view-settings-migrator.read', subject: null },
    import: { action: 'plugin::view-settings-migrator.import', subject: null },
  });

  const isLoading = isLoadingPermissions;

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await get('/view-settings-migrator/export', {
        params: { scope },
      });

      downloadJson(response.data);
      toggleNotification({
        type: 'success',
        message: `Exported ${response.data?.meta?.rowCount ?? 0} rows.`,
      });
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error),
      });
    } finally {
      setIsExporting(false);
    }
  };

  const loadFileIntoTextarea = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const text = await file.text();
    setImportJsonText(text);
    event.target.value = '';
  };

  const handleImport = async (dryRun = false) => {
    const { data, error } = parseJson(importJsonText);

    if (error) {
      toggleNotification({
        type: 'danger',
        message: `Invalid JSON: ${error}`,
      });
      return;
    }

    setIsImporting(true);

    try {
      const response = await post('/view-settings-migrator/import', {
        payload: data,
        scope,
        dryRun,
      });

      setSummary(response.data);
      toggleNotification({
        type: 'success',
        message: dryRun ? 'Dry run completed.' : 'Settings import completed.',
      });
    } catch (requestError) {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(requestError),
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return <Page.Loading />;
  }

  return (
    <Page.Main>
      <Page.Title>View Settings Migrator</Page.Title>
      <Layouts.Header
        title="View Settings Migrator"
        subtitle="Export and import strapi_core_store_settings records between Strapi instances."
      />
      <Layouts.Content>
        <Flex direction="column" gap={4} alignItems="stretch">
          <Alert closeLabel="Close" title="" variant="default">
            <Box paddingTop={2}>
              <Typography>
                Choose what to migrate: "View settings only" exports/imports content manager UI configs and upload view configuration. "All rows" includes the full table.
              </Typography>
            </Box>
            <Box paddingTop={3}>
              <label htmlFor="core-store-scope">Scope: </label>
              <select
                id="core-store-scope"
                value={scope}
                onChange={(event) => setScope(event.target.value)}
              >
                <option value="view">View settings only</option>
                <option value="all">All rows</option>
              </select>
            </Box>
          </Alert>

          <Card>
            <CardBody>
              <Flex direction="column" gap={3} alignItems="stretch">
                <Typography variant="beta">Export</Typography>
                <Typography>
                  Export selected rows to a JSON file that can be imported in another instance.
                </Typography>
                <Flex>
                  <Button
                    startIcon={<Download />}
                    onClick={handleExport}
                    loading={isExporting}
                    disabled={!canRead || isExporting}
                  >
                    Export JSON
                  </Button>
                </Flex>
              </Flex>
            </CardBody>
          </Card>

          <Divider />

          <Card>
            <CardBody>
              <Flex direction="column" gap={3} alignItems="stretch">
                <Typography variant="beta">Import</Typography>
                <Typography>
                  Paste JSON or load a previously exported file, then run a dry run or apply import.
                </Typography>

                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={loadFileIntoTextarea}
                  aria-label="Import JSON file"
                />

                <Textarea
                  name="import-json"
                  label="Import JSON"
                  hint="Expected shape: { meta: {...}, rows: [...] }"
                  onChange={(event) => setImportJsonText(event.target.value)}
                  value={importJsonText}
                  minRows={14}
                />

                <Flex gap={2}>
                  <Button
                    variant="secondary"
                    onClick={() => handleImport(true)}
                    loading={isImporting}
                    disabled={!canImport || !importJsonText.trim() || isImporting}
                  >
                    Dry Run
                  </Button>
                  <Button
                    startIcon={<Upload />}
                    onClick={() => handleImport(false)}
                    loading={isImporting}
                    disabled={!canImport || !importJsonText.trim() || isImporting}
                  >
                    Import JSON
                  </Button>
                </Flex>

                {summary ? (
                  <Alert closeLabel="Close" title="Last import result" variant="success">
                    <Typography>
                      Scope: {summary.scope} | Inserted: {summary.inserted} | Updated: {summary.updated} | Skipped: {summary.skipped} | Dry run: {String(summary.dryRun)}
                    </Typography>
                  </Alert>
                ) : null}
              </Flex>
            </CardBody>
          </Card>
        </Flex>
      </Layouts.Content>
    </Page.Main>
  );
};

const ProtectedAppPage = () => (
  <Page.Protect permissions={[{ action: 'plugin::view-settings-migrator.read', subject: null }]}>
    <AppPage />
  </Page.Protect>
);

export default ProtectedAppPage;
