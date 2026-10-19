'use strict';

const TABLE_NAME = 'strapi_core_store_settings';

const VIEW_SETTING_EXACT_KEYS = new Set(['plugin_upload_view_configuration']);

const isViewSettingKey = (key) => {
    if (typeof key !== 'string') {
        return false;
    }

    return key.startsWith('plugin_content_manager_configuration_') || VIEW_SETTING_EXACT_KEYS.has(key);
};

const normalizeType = (type) => {
    if (typeof type === 'string' && type.trim() !== '') {
        return type.trim();
    }

    return 'object';
};

const getRowsByScope = (rows, scope) => {
    if (scope === 'all') {
        return rows;
    }

    return rows.filter((row) => isViewSettingKey(row.key));
};

const validateImportedRows = (rows) => {
    const errors = [];

    if (!Array.isArray(rows)) {
        return ['The imported payload must include a rows array.'];
    }

    rows.forEach((row, index) => {
        if (!row || typeof row !== 'object') {
            errors.push(`rows[${index}] must be an object.`);
            return;
        }

        if (typeof row.key !== 'string' || row.key.trim() === '') {
            errors.push(`rows[${index}].key must be a non-empty string.`);
        }
    });

    return errors;
};

module.exports = ({ strapi }) => ({
    async exportSettings(scope = 'view') {
        const db = strapi.db.connection;

        const rows = await db(TABLE_NAME)
            .select(['key', 'value', 'type', 'environment', 'tag'])
            .orderBy('key', 'asc');

        const filteredRows = getRowsByScope(rows, scope);

        return {
            meta: {
                plugin: 'view-settings-migrator',
                exportedAt: new Date().toISOString(),
                strapiVersion: strapi.config.get('info.strapi') || strapi.config.get('info.strapiVersion') || null,
                scope,
                rowCount: filteredRows.length,
            },
            rows: filteredRows,
        };
    },

    async importSettings(payload, options = {}) {
        const dryRun = Boolean(options.dryRun);
        const scope = options.scope || 'view';

        const candidateRows = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.rows)
                ? payload.rows
                : null;

        const validationErrors = validateImportedRows(candidateRows);

        if (validationErrors.length > 0) {
            const message = `Invalid import payload: ${validationErrors.join(' ')}`;
            throw new Error(message);
        }

        const filteredRows = getRowsByScope(candidateRows, scope);

        if (filteredRows.length === 0) {
            return {
                scope,
                dryRun,
                inserted: 0,
                updated: 0,
                skipped: candidateRows.length,
            };
        }

        const db = strapi.db.connection;

        return db.transaction(async (trx) => {
            const keys = filteredRows.map((row) => row.key);
            const existingRows = await trx(TABLE_NAME).select(['id', 'key']).whereIn('key', keys);
            const existingByKey = new Map(existingRows.map((row) => [row.key, row.id]));

            let inserted = 0;
            let updated = 0;

            if (!dryRun) {
                for (const row of filteredRows) {
                    const dataToWrite = {
                        key: row.key,
                        value: row.value,
                        type: normalizeType(row.type),
                        environment: row.environment ?? null,
                        tag: row.tag ?? null,
                    };

                    if (existingByKey.has(row.key)) {
                        await trx(TABLE_NAME).where({ key: row.key }).update(dataToWrite);
                        updated += 1;
                    } else {
                        await trx(TABLE_NAME).insert(dataToWrite);
                        inserted += 1;
                    }
                }
            } else {
                for (const row of filteredRows) {
                    if (existingByKey.has(row.key)) {
                        updated += 1;
                    } else {
                        inserted += 1;
                    }
                }
            }

            return {
                scope,
                dryRun,
                inserted,
                updated,
                skipped: candidateRows.length - filteredRows.length,
            };
        });
    },
});
