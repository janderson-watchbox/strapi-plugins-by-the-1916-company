'use strict';

const register = require('./register');
const bootstrap = require('./bootstrap');
const controllers = require('./controllers');
const services = require('./services');
const routes = require('./routes');

module.exports = {
    register,
    bootstrap,
    controllers,
    services,
    routes,
};
