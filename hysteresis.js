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

  function hysteresis(n) {
  	RED.nodes.createNode(this, n);
  	this.setpoint = parseInt(n.setpoint);
  	this.deadband = parseInt(n.deadband);
  	this.topic = n.topic;
  	this.name = n.name;

  	var node = this;

  	this.on('input', function(msg){

  		var top = node.setpoint + node.deadband;
  		var bottom = node.setpoint - node.deadband;

  		if (typeof msg.payload === 'number') {
  			if (node.lastvalue) {
  				if (msg.payload > node.lastvalue) {
  					//node.direction = "rising";
  					if (msg.payload > top) {
  						node.send({
  							topic: node.topic,
  							payload: false
  						})
  					} else {
  						node.send({
  							topic: node.topic,
  							payload: true
  						});
  					}

  				} else {
  					//node.direction = "faling";
  					if (msg.payload > bottom) {
  						node.send({
  							topic: node.topic,
  							payload: false
  						});
  					} else {
  						node.send({
  							topic: node.topic,
  							payload: true
  						});
  					}
  				}
  			} 
  			node.lastvalue = msg.payload;
  			
  		}
  	});
  }

  RED.nodes.registerType("hysteresis", hysteresis); 
};