var NanoEvents = require('nanoevents')

/**
 * Logux connection for browser WebSocket.
 *
 * @param {string} url WebSocket server URL.
 *
 * @example
 * import { BrowserConnection } from 'logux-core'
 *
 * const connection = new BrowserConnection('wss://logux.example.com/')
 * const node = new ClientNode(nodeId, log, connection, opts)
 *
 * @class
 * @extends Connection
 */
function BrowserConnection (url) {
  this.connected = false
  this.emitter = new NanoEvents()

  this.url = url
}

BrowserConnection.prototype = {

  connect: function connect () {
    if (typeof WebSocket === 'undefined') {
      throw new Error('Browser has no WebSocket support')
    }

    this.emitter.emit('connecting')
    this.ws = new WebSocket(this.url)
    var self = this

    this.ws.onerror = function (e) {
      self.emitter.emit('error', e)
    }

    this.ws.onclose = function () {
      if (self.connected) {
        self.connected = false
        self.emitter.emit('disconnect')
      }
    }

    this.ws.onmessage = function (event) {
      var data
      try {
        data = JSON.parse(event.data)
      } catch (e) {
        self.error(event.data)
        return
      }
      self.emitter.emit('message', data)
    }

    return new Promise(function (resolve) {
      self.ws.onopen = function () {
        self.connected = true
        self.emitter.emit('connect')
        resolve()
      }
    })
  },

  disconnect: function disconnect () {
    if (this.ws) {
      this.ws.onclose()
      this.ws.close()
      this.ws = undefined
    }
  },

  on: function on (event, listener) {
    return this.emitter.on(event, listener)
  },

  send: function send (message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      this.disconnect()
    }
  },

  error: function error (message) {
    var err = new Error('Wrong message format')
    err.received = message
    this.emitter.emit('error', err)
  }

}

module.exports = BrowserConnection
