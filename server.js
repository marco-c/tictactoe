const fs        = require('fs');
const https     = require('https');
const webPush   = require('web-push');

if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

var waitingUsers = [];
var matches = [];

var pem = fs.readFileSync('cert.pem');

var options = {
  key: pem,
  cert: pem,
};

https.createServer(options, function(req, res) {
  var body = '';

  req.on('data', function(chunk) {
    body += chunk;
  })

  req.on('end', function() {
    if (!body) return;
    var obj = JSON.parse(body);

    switch (obj.type) {
      case 'register':
        if (waitingUsers.find(function(waitingUser) {
              return waitingUser.endpoint === obj.endpoint;
            })) {
          return;
        }

        if (waitingUsers.length > 0) {
          var opponent = waitingUsers.pop();
          matches.push({
            player1: {
              endpoint: obj.endpoint,
              key: obj.key,
            },
            player2: opponent,
          });

          // Choose first player randomly.
          var firstPlayer = Math.random() >= 0.5 ? opponent : obj;

          console.log('send start notification to ' + firstPlayer.endpoint);

          try {
            webPush.sendNotification(firstPlayer.endpoint, 200, firstPlayer.key, JSON.stringify({
              type: 'start',
            }));
          } catch (e) {
            // XXX: Log error.
          }
        } else {
          waitingUsers.push({
            endpoint: obj.endpoint,
            key: obj.key,
          });
          console.log('wait for opponent');
        }
        break;

      case 'move':
        var opponent;
        for (var i = 0; i < matches.length; i++) {
          var match = matches[i];

          if (match.player1.endpoint === obj.endpoint) {
            opponent = match.player2;
            break;
          }

          if (match.player2.endpoint === obj.endpoint) {
            opponent = match.player1;
            break;
          }
        }

        if (!opponent) {
          console.error('move - no opponent found');
          return;
        }

        console.log('send notification for move to ' + opponent.endpoint);

        try {
          webPush.sendNotification(opponent.endpoint, opponent.key, JSON.stringify({
            type: 'move',
            x: obj.x,
            y: obj.y,
          }));
        } catch (e) {
          // XXX: Log error.
        }

        break;
    }
  });

  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
  });

  res.end('ok');
}).listen(4443);
