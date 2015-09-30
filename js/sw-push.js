var port;

self.addEventListener('push', function(event) {
  event.waitUntil(self.registration.showNotification('TicTacToe', {
    body: 'It\'s your turn!',
    tag: 'tictactoe',
  }));

  port.postMessage(event.data.json());
});

self.onmessage = function(e) {
  port = e.ports[0];
}
