# tictactoe
Tic Tac Toe with offline and multiplayer support.

This simple game is an example of Service Workers and [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) usage.

Uses [oghliner](https://github.com/mozilla/oghliner) for offline support and the [web-push](https://github.com/marco-c/web-push) library to connect the application server to the push server.

## Build

```
npm install
gulp
```

## Run the app

- Start the Node.js server by running `node server.js`
- Serve the *dist/* directory via an HTTP server (or simply open https://marco-c.github.io/tictactoe/).
- Open the app with two different browsers to try a multiplayer game or use the `client.js` CLI tool to simulate an opponent.
