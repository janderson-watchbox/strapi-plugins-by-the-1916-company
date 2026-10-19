import { PuzzlePiece } from '@strapi/icons';

import pluginId from './pluginId';
import getTrad from './utils/getTrad';

const name = 'View Settings Migrator';

export default {
    register(app) {
        app.addMenuLink({
            to: `/plugins/${pluginId}`,
            icon: PuzzlePiece,
            intlLabel: {
                id: getTrad('plugin.name'),
                defaultMessage: name,
            },
            permissions: [
                {
                    action: 'plugin::view-settings-migrator.read',
                    subject: null,
                },
            ],
            Component: async () => {
                const component = await import('./pages/App');

                return component;
            },
        });

        app.registerPlugin({
            id: pluginId,
            name,
        });
    },

    bootstrap() { },

    async registerTrads({ locales }) {
        return Promise.all(
            locales.map(async (locale) => {
                try {
                    const { default: data } = await import(`./translations/${locale}.json`);

                    return { locale, data };
                } catch (error) {
                    return { locale, data: {} };
                }
            })
        );
    },
};
