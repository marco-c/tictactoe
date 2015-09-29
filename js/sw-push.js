var port;

self.addEventListener('push', function(event) {
  port.postMessage(event.data.json());
});

self.onmessage = function(e) {
  port = e.ports[0];
}
