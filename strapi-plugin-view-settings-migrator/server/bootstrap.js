'use strict';

const actions = [
    {
        section: 'plugins',
        displayName: 'Read',
        uid: 'read',
        subCategory: 'settings',
        pluginName: 'view-settings-migrator',
    },
    {
        section: 'plugins',
        displayName: 'Import',
        uid: 'import',
        subCategory: 'settings',
        pluginName: 'view-settings-migrator',
    },
];

module.exports = async ({ strapi }) => {
    await strapi.service('admin::permission').actionProvider.registerMany(actions);
};
