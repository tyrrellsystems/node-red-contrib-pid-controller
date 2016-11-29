/**
 * Copyright 2016 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
	"use strict";

	function PIDLoop(n) {
		RED.nodes.createNode(this, n);
		this.topic = n.topic;
		this.P = Number(n.Kp);
		this.Ti = Number(n.Ki);
		this.Td = Number(n.Kd);
		this.dt = Number(n.recalcTime);
		this.setPointTopic = n.setPointTopic;
		this.fireTopic = n.fireTopic;
		this.fixedTopic = n.fixedTopic;
		this.fixedValue = parseInt(n.fixedValue);
		this.setPoint = n.setPoint;
		this.deadBand = n.deadBand;

		this.minOutput = 0;
		this.maxOutput = 1;

		this.errorVal = 0;
		this.integral = 0;
		this.lastTimestamp = 0;

		this.fire = false;
		this.fireResetInterval;

		this.fixed =false;

		var node = this;
		if (this.setPoint) {
			node.status({text: node.setPoint});
		} else {
			node.status({});
		}

		function clearState() {
			node.lastTimestamp = 0;
			node.errorVal = 0;
			node.integral = 0;
			if (node.measured) {
				delete node.measured;
			}
			if (node.lastMeasured) {
				delete node.lastMeasured;
			}
		}

		this.on('input', function(msg){
			//console.log("%j", msg);

			if (msg.topic && msg.topic === node.setPointTopic) {
				node.setPoint = msg.payload;
				node.status({text: 'setpoint ' + node.setPoint});
			} else if (msg.topic && msg.topic === node.fireTopic) {
				if (!msg.payload) {
					node.status({text: 'FIRE', shape: 'dot', fill: 'red'});
					var newMsg = {
						topic: node.topic,
						payload: 0
					};
					node.send([newMsg,newMsg]);
					node.fireResetInterval = setTimeout(clearState,900000);
					node.fire = true;
				} else {
					node.status({text: 'setpoint ' + node.setPoint});
					node.fire = false;
					clearTimeout(node.fireResetInterval);
					delete node.fireResetInterval;
				}
			} else if (msg.topic && msg.topic === node.fixedTopic) {
				if (typeof msg.payload === 'number') {
					node.fixedValue = msg.payload;
				} else if (typeof msg.payload === 'boolean') {
					node.fixed = msg.payload;
				}

				if (node.fixed) {
					var msg = {
						topic: node.topic,
						payload: node.fixedValue
					}
					var msg2 = {
						topic: node.topic,
						payload: 0
					}
					var array = [];
					if (node.fixedValue > 0) {
						array = [msg,msg2];
					} else {
						array = [msg2,msg];
					}
					node.send(array);
					node.status({text: 'Fixed ' + node.fixedValue, fill:'green',shape:'dot'});
				}
			} else {
				if (typeof msg.payload === 'number') {
					if (!node.lastMeasured) {
						node.lastMeasured = msg.payload;
					}

					if (node.lastMeasured != msg.payload) {
						node.lastMeasured = node.measured;
					}
					node.measured = msg.payload;

					// if (node.lastMeasured != msg.payload) {
					// 	var last = node.lastMeasured;
					// 	var now = msg.payload + lastTimestamp/2;
					// 	node.lastMeasured = node.measured;
					// 	node.measured = now;
					// } else {
					// 	node.measured = msg.payload;
					// }

				}
			}
		});


		this.interval = setInterval(function(){
			if (node.measured && node.lastMeasured) {

				var error = node.setPoint - node.measured;

				if (Math.abs(error) < node.deadBand) {
					//console.log("in deadband");
					error = 0;
				}

				var deltaError = node.measured - node.lastMeasured;

				//console.log("error: " + error);

				var integral = (error * node.dt * node.P) / (node.Ti * 100);
				//console.log("delta integral: " + integral);

				//var output = (1/node.P) * (error + (node.Td * deltaError)/node.dt) + ((node.integral * node.dt) / node.Ti);
				var output = (error * node.P/100) + node.integral;

				var diff = (node.Td *deltaError)/node.dt;
				//console.log("diff:" + diff);

				

				//console.log("power: " +  output);
				if (Math.abs(output) > node.maxOutput) {
					if (output > 0) {
						output = node.maxOutput;
					} else {
						output = node.maxOutput * -1;
					}
				} else {
					if (!node.fixed) {
						node.integral = node.integral + integral;
						if (Math.abs(node.integral) > (node.maxOutput/2)) {
							if (node.integral > 0) {
								node.integral = node.maxOutput/2;
							} else {
								node.integral = node.maxOutput * -0.5;
							}
						}
					}
					//console.log("node.integral: " + node.integral);
				}
				output = Math.round(output * 10000) / 1000;
				//console.log("adjusted: " + output);
				//console.log("---------------");

				var msg = {
					topic: node.topic || "",
					payload: Math.abs(output)
				}

				var off = {
					topic: node.topic || "",
					payload: 0
				}

				if (!node.fixed && !node.fire) {
					if (output > 0) {
						node.send([msg,off]);

					} else {
						node.send([off,msg]);
					}
				}

			 //    var dt = node.recalcTime;
			 //    //(now - node.lastTimestamp)/1000;
			 //    //console.log("dt: ", dt)
			 //    node.lastTimestamp = now;
				// //console.log("measured %d", node.measured);
				// var errorVal = node.setPoint - node.measured;
				// //console.log("error %d", errorVal);

				// var integral = node.integral + (errorVal * dt);

				// console.log("integral %d", integral);
				// //TODO TESTING
				// if (Math.abs(integral) > node.maxOutput) {
				// 	if (integral > 0) {
				// 		integral = node.maxOutput;
				// 	} else {
				// 		integral = node.maxOutput * -1;
				// 	}
				// } 
				// //console.log("integral (after max) %d", integral);

				// node.integral = integral;
				// var derivitive = (errorVal - node.errorVal)/dt;
				// //console.log("derivitive %d", derivitive);
				// node.errorVal = errorVal;
				// var output = (node.Kp*errorVal) + (node.Ki*integral) + (node.Kd*derivitive);
				// if (Math.abs(output) > node.maxOutput) {
				// 	if (output > 0) {
				// 		output = node.maxOutput;
				// 	} else {
				// 		output = node.maxOutput * -1;
				// 	}
				// }

				// //console.log("output %d", output);
				// var newMsg = {
				// 	topic: node.topic,
				// 	payload: output,
				// };
				// var newMsg2 = {
				// 	topic: node.topic,
				// 	payload: 0,
				// };

				// var array = [];
				// if (output > 0) {
				// 	array = [newMsg, newMsg2];
				// } else {
				// 	newMsg.payload = newMsg.payload * -1;
				// 	array = [newMsg2, newMsg];
				// }

				// if (!node.fire && !node.fixed) { 
				// 	node.send(array);
				// }
				// var status = {fill:"green",shape:"ring", text: 'setpoint ' + node.setPoint}; 
				// if (output > 0) {
				// 	status.fill = "red";
				// } else {
				// 	status.fill = "blue";
				// }
				// node.status(status);
				//console.log("%j",node);
			}
		},node.dt * 1000);

		this.on('close', function(){
			if (node.fireResetInterval) {
				clearTimeout(node.fireResetInterval);
			}
			if (node.interval) {
				clearInterval(node.interval);
			}
		});

	}
	RED.nodes.registerType("PIDLoop", PIDLoop);	
}