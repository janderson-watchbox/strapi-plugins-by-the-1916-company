'use strict';

module.exports = {
    type: 'admin',
    routes: [
        {
            method: 'GET',
            path: '/export',
            handler: 'settings.export',
            config: {
                policies: [
                    {
                        name: 'admin::hasPermissions',
                        config: {
                            actions: ['plugin::view-settings-migrator.read'],
                        },
                    },
                ],
            },
        },
        {
            method: 'POST',
            path: '/import',
            handler: 'settings.import',
            config: {
                policies: [
                    {
                        name: 'admin::hasPermissions',
                        config: {
                            actions: ['plugin::view-settings-migrator.import'],
                        },
                    },
                ],
            },
        },
    ],
};
