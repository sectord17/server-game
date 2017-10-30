#!/usr/bin/env bash

cp .env.example .env
npm install
MOCHA_FILE=./jenkins-test-results.xml ./node_modules/.bin/mocha tests/** --reporter mocha-junit-reporter
