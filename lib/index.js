const express = require('express');
const logger = require('morgan');
const winston = require('winston');

const app = express();

app.use(logger('dev'));

module.exports = app;

require('./cli');
require('./communication');
