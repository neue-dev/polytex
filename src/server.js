/**
 * @ Author: Mo David
 * @ Create Time: 2024-11-13 12:35:19
 * @ Modified time: 2024-11-13 12:37:42
 * @ Description:
 * 
 * The main server thread for running the service.
 */

import express from 'express'
import exressWs from 'express-ws'

// Create the app and decorate it with WS capabilities
const app = express()
expressWs(app)

app.get('/', (req, res) => {
  res.end();
});

app.ws('/', (ws, req) => {
  ws.on('message', (message) => console.log(message));
});

// Listen for requests on port 6000
app.listen(6000)