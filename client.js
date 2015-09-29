#! /usr/bin/env node

const packageJson = require('./package.json');
const program     = require('commander');
const https       = require('https');
const fs          = require('fs');

program.version(packageJson.version);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function sendReq(obj) {
  var payload = JSON.stringify(obj);

  var options = {
    hostname: '127.0.0.1',
    port: 4443,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length,
    },
  };

  var request = https.request(options, function(response) {
    if (response.statusCode !== 200) {
      console.log('statusCode: ', response.statusCode);
      console.log('headers: ', response.headers);
    }
  });

  request.write(payload);
  request.end();
}

program.command('register')
       .description('send register request to server')
       .action(function(env, options) {
  sendReq({
    type: 'register',
    endpoint: 'endpoint',
    key: 'key',
  });
});

program.command('move [x] [y]')
       .description('send move request to server with coordinates x and y')
       .action(function(xStr, yStr) {
  var x = Number(xStr);
  var y = Number(yStr);

  if (isNaN(x) || isNaN(y)) {
    program.outputHelp();
    return;
  }

  sendReq({
    type: 'move',
    endpoint: 'endpoint',
    x: x,
    y: y,
  });
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
