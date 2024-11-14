/**
 * @ Author: Mo David
 * @ Create Time: 2024-11-14 09:10:37
 * @ Modified time: 2024-11-14 09:25:25
 * @ Description:
 * 
 * Handles the websocket infrastructure so we don't need to fuss over it.
 */

const WS = (() => {
	
	// Interface
	const _ = {};

	/**
	 * Creates a function that receives messages from the client.
	 * Wraps a function in receiver functionality.
	 * 
	 * @param ws	The websocket object to use.
	 * @param f		The function to decorate into a receiver. 
	 * @return		The decorated receiver.
	 */
	_.receiver = (ws, f) => (message, ...args) => f(JSON.parse(message, ...args))

	/**
	 * Creates a function that sends messages to the client.
	 * 
	 * @param	ws	The websocket object to use.
	 * @return		A function that sends out messages to the client.
	 */
	_.sender = (ws) => (message) => ws.send(JSON.stringify(message))

	return {
		..._
	}

})()

export {
	WS
}
