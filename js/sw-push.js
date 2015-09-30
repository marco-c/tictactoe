var port;

self.addEventListener('notificationclick', function(event) {
  event.waitUntil(clients.matchAll().then(function(clientList) {
    if (clientList.length > 0) {
      return clientList[0].focus();
    }
  }));
});

self.addEventListener('push', function(event) {
  event.waitUntil(clients.matchAll().then(function(clientList) {
    var focused = false;
    for (var i = 0; i < clientList.length; i++) {
      if (clientList[i].focused) {
        focused = true;
        break;
      }
    }

    if (!focused) {
      return self.registration.showNotification('TicTacToe', {
        body: 'It\'s your turn!',
        tag: 'tictactoe',
      });
    }
  }));

  port.postMessage(event.data.json());
});

self.onmessage = function(e) {
  port = e.ports[0];
}
