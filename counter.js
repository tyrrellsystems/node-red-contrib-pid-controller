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

  function counter(n) {
  	RED.nodes.createNode(this, n);
  	this.increment = parseInt(n.increment);
  	this.name = n.name;
  	this.topic = n.topic;
  	this.value = 0;

  	var node = this;

  	this.on('input', function(msg) {
  		if (typeof msg.payload === 'boolean' || typeof msg.payload === 'number') {
  			if (msg.payload) {
  				node.value += node.increment;
  			} else {
  				node.value -= node.increment;
  			}
  			node.send({
  				topic:node.topic,
  				payload: node.value
  			})
  		}
  	});
  }

  RED.nodes.registerType("counter", counter); 
};