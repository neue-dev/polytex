/**
 * @ Author: Mo David
 * @ Create Time: 2024-11-13 12:35:19
 * @ Modified time: 2024-11-14 09:24:00
 * @ Description:
 * 
 * The main server thread for running the service.
 */

import express from 'express'
import expressWs from 'express-ws'

import { FS } from './fs.js'
import { WS } from './ws.js'

// Create the app and decorate it with WS capabilities
const app = express()
expressWs(app)

app.ws('/', (ws, req) => {

  // Our client sender
  const send = WS.sender(ws);

  // On message
  ws.on('message', WS.receiver(ws, (message) => (

    // Send back the message
    send(message)
  )));

  ws.on('close', WS.receiver(ws, () => (
    console.log('Connection closed.')
  )))
});

// Listen for requests on port 3000
app.listen(3000)