#!/usr/bin/env bash

#cp .env.example .env
npm install
MOCHA_FILE=./jenkins-test-results.xml IP=127.0.0.1 GAME_PORT=0 HTTP_PORT=0 TOKEN=secret \
./node_modules/.bin/mocha test/** --reporter mocha-junit-reporter
