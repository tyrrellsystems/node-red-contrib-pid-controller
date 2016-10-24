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

  function toggle(n){
    RED.nodes.createNode(this, n);
    this.name = n.name;
    this.onPayload = n.onPayload;
    this.onType = n.onType;
    this.offPayload = n.offPayload;
    this.offType = n.offPayload

    var node = this;

    node.on('input', function(msg){
      if (typeof msg.payload == 'boolean' || typeof msg.payload == 'number'){
        if (msg.payload) {
          msg.payload = node.onPayload;
        } else {
          msg.payload = node.offPayload;
        }
        node.send(msg);
      }
    });
  }

  RED.nodes.registerType("toggle", toggle); 
};