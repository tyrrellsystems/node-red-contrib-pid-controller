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
		this.Kp = n.Kp;
		this.Ki = n.Ki;
		this.Kd = n.Kd;
		this.setPointTopic = n.setPointTopic;
		this.fireTopic = n.fireTopic;
		this.fixedTopic = n.fixedTopic;
		this.setPoint = n.setPoint;
		this.deadBand = n.deadBand;

		this.minOutput = 0;
		this.maxOutput = 100;

		this.errorVal = 0;
		this.integral = 0;
		this.lastTimestamp = 0;

		this.fire = false;
		this.fireResetInterval;

		this.fixedValue = 999;

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
		}

		this.on('input', function(msg){
			//console.log("%j", msg);

			if (msg.topic && msg.topic === node.setPointTopic) {
				node.setPoint = msg.payload;
				node.status({text: 'setpoint ' + node.setPoint});
			} else if (msg.topic && msg.topic === node.fireTopic) {
				if (msg.payload) {
					node.status({text: 'FIRE'});
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
				if (typeof msg.payload === "number") {
					node.fixedValue = msg.payload;
				}

				if (node.fixedValue != 999) {
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
				}
			} else {
				//console.log("value");
				if (node.lastTimestamp) {
				    var now = Date.now();
				    var dt = (now - node.lastTimestamp)/1000;
				    node.lastTimestamp = now;
					var measured = msg.payload;
					//console.log("measured %d", measured);
					var errorVal = node.setPoint - measured;
					if (Math.abs(errorVal) <= node.deadBand) {
						var newMsg = {
							topic: node.topic,
							payload: 0,
						};
						if (!node.fire) {
							node.send([newMsg,newMsg]);
							node.errorVal = errorVal;
							node.status({fill:"green",shape:"dot", text: 'setpoint ' + node.setPoint});
						}

						node.integral = 0

						return;
					}
					//console.log("errorVal %d", errorVal);
					var integral = node.integral + (errorVal * dt);

					//console.log("integral %d", integral);
					//TODO TESTING
					if (Math.abs(integral) > node.maxOutput) {
						if (integral > 0) {
							integral = node.maxOutput;
						} else {
							integral = node.maxOutput * -1;
						}
					} 
					//console.log("integral (after max) %d", integral);

					node.integral = integral;
					var derivitive = (errorVal - node.errorVal)/dt;
					//console.log("derivitive %d", derivitive);
					node.errorVal = errorVal;
					var output = (node.Kp*errorVal) + (node.Ki*integral) + (node.Kd*derivitive);
					if (Math.abs(output) > node.maxOutput) {
						if (output > 0) {
							output = node.maxOutput;
						} else {
							output = node.maxOutput * -1;
						}
					}

					//console.log("output %d", output);
					var newMsg = {
						topic: node.topic,
						payload: output,
					};
					var newMsg2 = {
						topic: node.topic,
						payload: 0,
					};

					var array = [];
					if (output > 0) {
						array = [newMsg, newMsg2];
					} else {
						newMsg.payload = newMsg.payload * -1;
						array = [newMsg2, newMsg];
					}
					if (!node.fire || node.fixedValue != 999) { 
						node.send(array);
					}
					var status = {fill:"green",shape:"dot", text: 'setpoint ' + node.setPoint}; 
					if (output > 0) {
						status.fill = "red";
					} else {
						status.fill = "blue";
					}
					node.status(status);
					//console.log("%j",node);
				} else {
					node.lastTimestamp = Date.now();
				}
			}
		});

		this.on('close', function(){
			if (node.fireResetInterval) {
				clearTimeout(node.fireResetInterval);
			}
		});

	}
	RED.nodes.registerType("PIDLoop", PIDLoop);	
}