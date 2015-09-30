function sendReq(obj) {
  return new Promise(function(resolve, reject) {
    var request = new XMLHttpRequest();

    request.open('POST', 'https://127.0.0.1:4443');
    request.setRequestHeader('Content-Type', 'application/json');

    request.send(JSON.stringify(obj));

    request.onload = resolve;
    request.onerror = reject;
  });
}

var endpoint, key;

var gameRegistered = false;
var yourTurn = false;
var xBoard = 0;
var oBoard = 0;

function sendRegister() {
  sendReq({
    type: 'register',
    endpoint: endpoint,
    key: btoa(String.fromCharCode.apply(null, new Uint8Array(key))),
  }).then(function() {
    gameRegistered = true;
  });
}

function startGame() {
  yourTurn = true;
  oBoard = xBoard = 0;
  localforage.setItem('game', [ gameRegistered, yourTurn, xBoard, oBoard ]);
}

function checkEndGame() {
  if (checkWinner(xBoard)) {
    alert('You won!');
  } else if (checkNobody()) {
    alert('Nobody won!');
  } else if (checkWinner(oBoard)) {
    alert('You lost!');
  } else {
    // Game hasn't ended.
    return;
  }

  gameRegistered = false;

  if (confirm('Play again?')) {
    context.clearRect(0, 0, width, height);
    paintBoard();
    sendRegister();
  }

  xBoard = oBoard = 0;
  yourTurn = false;
  localforage.setItem('game', [ gameRegistered, yourTurn, xBoard, oBoard ]);
}

function opponentMove(x, y) {
  if (yourTurn) {
    return;
  }

  var bit = (1 << x + (y * 3));

  if (!isEmpty(xBoard, oBoard, bit)) {
    return;
  }

  markBit(bit, 'O');

  if (checkEndGame()) {
    return;
  }

  yourTurn = true;

  localforage.setItem('game', [ gameRegistered, yourTurn, xBoard, oBoard ]);
}

function yourMove(x, y) {
  if (!yourTurn) {
    return;
  }
  yourTurn = false;

  var bit = (1 << x + (y * 3));

  if (!isEmpty(xBoard, oBoard, bit)) {
    return;
  }

	markBit(bit, 'X');

  sendReq({
    type: 'move',
    endpoint: endpoint,
    x: x,
    y: y,
  });

  if (checkEndGame()) {
    return;
  }

  localforage.setItem('game', [ gameRegistered, yourTurn, xBoard, oBoard ]);
}

var subscriptionPromise = navigator.serviceWorker.ready.then(function(reg) {
  var channel = new MessageChannel();
  channel.port1.onmessage = function(e) {
    var obj = e.data;

    switch (obj.type) {
      case "start":
        startGame();
        alert('Please start');
        break;

      case "move":
        opponentMove(obj.x, obj.y);
        break;

      case 'end':
        // XXX: Show an alert if the notification arrived before the game was finished
        break;
    }
  }
  reg.active.postMessage('setup', [channel.port2]);

  return reg.pushManager.getSubscription().then(function(subscription) {
    if (!subscription) {
      return reg.pushManager.subscribe({ userVisibleOnly: true }).then(function(subscription) {
        return subscription;
      });
    } else {
      return subscription;
    }
  });
}).then(function(subscription) {
  endpoint = subscription.endpoint;
  key = subscription.getKey('p256dh');
});

window.onload = function() {
  paintBoard();

  document.getElementById('board').onclick = clickHandler;

  var localforagePromise = localforage.getItem('game').then(function(game) {
    if (game === null) {
      xBoard = 0;
      oBoard = 0;
      return;
    }

    gameRegistered = game[0];
    yourTurn = game[1];
    xBoard = game[2];
    oBoard = game[3];

    for (var i= 0; i < 9; i++) {
      var bit = 1 << i;
      if ((xBoard & bit) === bit) {
        markBit(bit, 'X');
      } else if ((oBoard & bit) === bit) {
        markBit(bit, 'O');
      }
    }
  });

  Promise.all([ localforagePromise, subscriptionPromise ]).then(function() {
    if (!gameRegistered) {
      sendRegister();
      return;
    }
  });
};

var context;
var width, height;

function paintBoard() {
  var board = document.getElementById('board');

  width = board.width  = window.innerWidth;
  height = board.height = window.innerHeight;

  context = board.getContext('2d');

  context.beginPath();
  context.strokeStyle = '#000';
  context.lineWidth   = 4;

  context.moveTo((width / 3), 0);
  context.lineTo((width / 3), height);

  context.moveTo((width / 3) * 2, 0);
  context.lineTo((width / 3) * 2, height);

  context.moveTo(0, (height / 3));
  context.lineTo(width, (height / 3));

  context.moveTo(0, (height / 3) * 2);
  context.lineTo(width, (height / 3) * 2);

  context.stroke();
  context.closePath();
}

function checkWinner(board) {
  var result = false;

  if (((board | 0x1C0) == board) || ((board | 0x38 ) == board) ||
	    ((board | 0x7) == board) || ((board | 0x124) == board) ||
	    ((board | 0x92) == board) || ((board | 0x49) == board) ||
	    ((board | 0x111) == board) || ((board | 0x54) == board)) {
    result = true;
  }

  return result;
}

function paintX(x, y) {
  context.beginPath();

  context.strokeStyle = '#ff0000';
  context.lineWidth   = 4;

  var cellWidth = width / 3;
  var cellHeight = height / 3;

  var length = cellWidth < cellHeight ? cellWidth : cellHeight;
  length = length - 0.2 * length;

  var beginX = x * cellWidth + cellWidth / 2 - length / 2;
  var beginY = y * cellHeight + cellHeight / 2 - length / 2;

  var endX = beginX + length;
  var endY = beginY + length;

  context.moveTo(beginX, beginY);
  context.lineTo(endX, endY);

  context.moveTo(beginX, endY);
  context.lineTo(endX, beginY);

  context.stroke();
  context.closePath();
}

function paintO(x, y) {
  context.beginPath();

  context.strokeStyle = '#0000ff';
  context.lineWidth   = 4;

  var cellWidth = width / 3;
  var cellHeight = height / 3;

  var diameter = cellWidth < cellHeight ? cellWidth : cellHeight;
  diameter = diameter - 0.2 * diameter;

  context.arc(x * cellWidth + cellWidth / 2, y * cellHeight + cellHeight / 2, diameter / 2, 0, Math.PI * 2, true);

  context.stroke();
  context.closePath();
}

function clickHandler(e) {
  var y = Math.floor(e.clientY / (height / 3));
  var x =  Math.floor(e.clientX / (width/ 3));

  yourMove(x, y);
}

function checkNobody() {
  return (xBoard | oBoard) === 0x1FF;
}

function isEmpty(xBoard, oBoard, bit) {
  return (((xBoard & bit) == 0) && ((oBoard & bit) == 0));
}

function simulate(oBoard, xBoard) {
  var ratio = 0;

  var bit = 0;
  for (var i= 0; i < 9; i++) {
    var cBit = 1 << i;

	  if (isEmpty(xBoard, oBoard, cBit)) {
      if (checkWinner(oBoard | cBit)) {
	      bit = cBit;
        break;
	    } else if (checkWinner(xBoard | cBit)) {
        bit = cBit;
	    }
	  }
  }

  if (bit == 0) {
    for (var i= 0; i < 9; i++) {
	    var cBit = 1 << i;

	    if (isEmpty(xBoard, oBoard, cBit)) {
	      var result = think(oBoard, xBoard, 'X', 0, 1);
	      if (ratio == 0 || ratio < result) {
	        ratio = result;
	        bit = cBit;
	      }
	    }
    }
  }

  return bit;
}

function think(oBoard, xBoard, player, bit, ratio) {
  if (player == 'O') {
	  oBoard = oBoard | bit;
  } else {
	  xBoard = xBoard | bit;
  }

  if (checkWinner(oBoard)) {
    ratio *= 1.1;
    return ratio;
  }

  if (checkWinner(xBoard)) {
    ratio *= 0.7;
    return ratio;
  }

	var best = 0;
	ratio *= 0.6;
  for (var i= 0; i < 9; i++) {
	  if (isEmpty(xBoard, oBoard, 1 << i)) {
      var newRatio = think(oBoard, xBoard, player == 'O' ? 'X' : 'O', 1 << i, ratio);

      if (best == 0 || best < newRatio) {
	      best = newRatio;
      }
	  }
 	}

	return best;
}

function markBit(markBit, player) {
  var bit = 1;
  var posX = 0, posY = 0;

  while ((markBit & bit) == 0) {
    bit = bit << 1;
    posX++;
	  if (posX > 2) {
      posX = 0;
      posY++;
    }
  }

  if (player == 'O') {
    oBoard = oBoard | bit;
	  paintO(posX, posY);
  } else {
    xBoard = xBoard | bit;
	  paintX(posX, posY);
  }
}

function play() {
  var bestBit = simulate(oBoard, xBoard);
  markBit(bestBit, 'O');
}
