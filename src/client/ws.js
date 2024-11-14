/**
 * @ Author: Mo David
 * @ Create Time: 2024-11-14 10:01:18
 * @ Modified time: 2024-11-14 10:18:45
 * @ Description:
 * 
 * Client functionality of our websockets.
 */

export const WS = (() => {

	// Interface
	const _ = {};

	// Connection details
	const connection = {}

	// The host to connect to
	const HOST = 'ws://localhost:3000/'

	/**
	 * Establishes a connection to the host.
	 * 
	 * @return	The api. 
	 */
	_.connect = () => (

		// Connection instance
		connection.instance = new WebSocket(HOST),

		// Create a promise for the connection establishment
		connection.promise = new Promise((resolve, reject) => (
			connection.resolve = resolve,
			connection.reject = reject
		)),

		// Resolve connection later on
		connection.instance.onopen = () => connection.resolve(),
		_
	)

	/**
	 * Sends a message to the host.
	 * The message is converted into a string from an object via JSON.stringify().
	 * 
	 * @param message		The message to send. 
	 * @return					The api.
	 */
	_.send = (message) => (
		connection.promise.then(() => 
			connection.instance.send(JSON.stringify(message))),
		_
	)

	/**
	 * Adds an event listener to listen for incoming messages.
	 * 
	 * @param	listener	The event listener.
	 * @return					The api.
	 */
	_.listen = (listener) => (
		connection.instance.addEventListener('message', 
			(message) => listener(JSON.parse(message.data))),
		_
	)

	return {
		..._
	}
})()

export default {
	WS
}
