'use strict';

module.exports = ({ strapi }) => ({
    async export(ctx) {
        const scope = ctx.query.scope === 'all' ? 'all' : 'view';

        const data = await strapi
            .plugin('view-settings-migrator')
            .service('settings')
            .exportSettings(scope);

        ctx.body = data;
    },

    async import(ctx) {
        const scope = ctx.request.body?.scope === 'all' ? 'all' : 'view';
        const dryRun = Boolean(ctx.request.body?.dryRun);
        const payload = ctx.request.body?.payload ?? ctx.request.body;

        const result = await strapi
            .plugin('view-settings-migrator')
            .service('settings')
            .importSettings(payload, { scope, dryRun });

        ctx.body = result;
    },
});
