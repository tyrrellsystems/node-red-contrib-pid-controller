# A Node-RED PID control node and a Hystersis node

## PID Control Node

This node has 2 outputs, the first is for heating control, the second is
for cooling control.

Both outputs provide a floating point value between 0 and 10.

### Settings

The node takes the following configuration values:

 - Gain: The % gain to apply to the difference between the setpoint and 
 input value
 - Ti: The time in seconds over which to apply the gain value
 - Dead Band: The +/- each side of the setpoint to consider the setpoint
 reached
 - Recalculation Time: The time in seconds between each calculation of 
 values
 - Setpoint Topic: the topic a message should have to set the setpoint
 - Fire Topic: the topic a message should have to enable/disable Fire 
 mode
 - Fixed Value Topic: the topic a message should have to enable/disable 
 fixed output mode
 - Fixed Value: the value to output when in fixed mode, +ve for heating
 -ve for cooling

### Operations

Before you can use the node you need to set the setpoint, to do this 
you need send a message with the setpoint value as the payload and a
topic set to the `Setpoint Topic` configured in the editor UI.

Fire mode sets all outputs to 0. Fire mode is enabled by sending a 
message with a payload of false to and a topic equal to the 
`Fire Topic`. To disable Fire mode send a message with a payload of
true and a topic equal to the `Fire Topic`

## Hysteresis Node

This node gives a true output value when the input values are 
outside the deadband of the setpoint and a false when the setpoint 
is reached.