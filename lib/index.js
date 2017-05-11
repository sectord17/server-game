const express = require('express');
const logger = require('morgan');

const app = express();

// TODO: Make usage of logger
app.use(logger('dev'));

module.exports = app;

require('./cli');
require('./http');
require('./game');