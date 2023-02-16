# Getting started

Just open the html file with Chrome (or ???) and hit ctl-enter to execute a block of code
- try just running console.log and seeing if it prints

## midi functionality using WebMidi.js
https://webmidijs.org/docs/getting-started/basics#code-examples

### Example code to try:

Logging available MIDI interfaces to console:
```
// Inputs
  WebMidi.inputs.forEach(input => console.log(input.manufacturer, input.name));
  
  // Outputs
  WebMidi.outputs.forEach(output => console.log(output.manufacturer, output.name));
  ```
  
  Listening for incoming MIDI device
  ```
  WebMidi.inputs[0].channels[1].addListener("noteon", e => {
    console.log(`Received 'noteon' message (${e.note.name}${e.note.octave}).`);
  });
  ```
  
  Sending MIDI out:
  ```
  let output = WebMidi.outputs[0];
  let channel = output.channels[1];
  channel.playNote("C3");
  ```

  
