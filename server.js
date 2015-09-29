const fs        = require('fs');
const https     = require('https');
const url       = require('url');
const webPush   = require('web-push');
const urlBase64 = require('urlsafe-base64');

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

function sendNotification(endpoint, userPublicKey, payload) {
  var encrypted = webPush.encrypt(urlBase64.decode(userPublicKey), payload);

  var urlParts = url.parse(endpoint);
  var options = {
    hostname: urlParts.hostname,
    path: urlParts.pathname,
    method: 'POST',
    headers: {
      'Content-Length': encrypted.cipherText.length,
      'Content-Type': 'application/octet-stream',
      'Encryption-Key': 'keyid=p256dh;dh=' + urlBase64.encode(encrypted.localPublicKey),
      'Encryption': 'keyid=p256dh;salt=' + urlBase64.encode(encrypted.salt),
      'Content-Encoding': 'aesgcm128',
    },
  };

  var pushRequest = https.request(options, function(pushResponse) {
    if (pushResponse.statusCode !== 201) {
      console.log("statusCode: ", pushResponse.statusCode);
      console.log("headers: ", pushResponse.headers);
    }
  });

  pushRequest.write(encrypted.cipherText);
  pushRequest.end();

  pushRequest.on('error', function(e) {
    console.error(e);
  });
}

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

          // XXX: Choose first player randomly.
          console.log('send start notification');
          sendNotification(opponent.endpoint, opponent.key, JSON.stringify({
            type: 'start',
          }));
        } else {
          waitingUsers.push({
            endpoint: obj.endpoint,
            key: obj.key,
          });
          console.log('wait for opponent');
        }
        break;

      case 'move':
        // Perform move; send notification to opponent
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

        console.log("send notification for move to " + opponent);

        try {
          sendNotification(opponent.endpoint, opponent.key, JSON.stringify({
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
