
// include("onLoop.js", onLoop)

var midi = null;  // global MIDIAccess object
var mostRecentMidi = 60;
var outputIds = [];
var midiState = Array(128).fill(0);
var pop = false;
var noteInd = 0;
var curSeq = [60, 62, 64, 65, 67, 69, 71, 72];
var newSeq = [];
var tempo = 60;
var durInd = 0;
var beatSecs = 60 / tempo;
var curSeqDurs = new Array(8).fill(beatSecs); //1 is quarter note, .5 is eight, .25 is sixteenth
var newSeqDurs = [];
Tone.Transport.bpm.value = tempo * 4;
var midiDict = {};
var dialOffset = 21;
var padOffset = 36;
var lastNoteVal = 0;
curSeqDurs[3] = .5 * beatSecs;
var enableInd = 0;
var curSeqEnable = new Array(8).fill(1);
const range = (start, end, length = end - start + 1) =>
	Array.from({ length }, (_, i) => start + i)

function onMIDISuccess(midiAccess) {
	console.log("MIDI ready!");
	midi = midiAccess;  // store in the global (in real usage, would probably keep in an object instance)
	console.log(midi);
	midiAccess.inputs.get('input-1').onmidimessage = getMIDIMessage;
	//for (var input of midiAccess.inputs.values()){
	//console.log(input);
	//input.onmidimessage = getMIDIMessage;
	//}
	for (var output of midiAccess.outputs) {
		// console.log(output[1]);
		outputIds.push(output[1].id);
		//output[1].open()
	}
	Tone.Transport.start()
	populateHTMLList();
	document.getElementById("curSeq").innerHTML = curSeq;

}
function onMIDIFailure(msg) {
	console.error(`Failed to get MIDI access - ${msg}`);
}

function getMIDIMessage(message) {
	//console.log(midiState);
	//document.getElementById('midimonitor').innerHTML = midiState;'
	var command = message.data[0];
	var note = message.data[1];
	var velocity = (message.data.length > 2) ? message.data[2] : 0; // a velocity value might not be included with a noteOff command

	// if (command !== 248) {
	// 	console.log(command);
	// 	console.log(note);
	// 	console.log(velocity);
	// }

	switch (command) {
		case 144: // noteOn
			if (velocity > 0) {
				//noteOn(note, velocity);
				mostRecentMidi = note;
				//document.write(note);
				// console.log(note, velocity);
				midiState[note - 1] = 1;
				//console.log(document.getElementById("midimonitor").getElementsByTagName("li")[0].value)
				document.getElementById("midimonitor").getElementsByTagName("li")[note - 1].innerHTML = "1";
				document.getElementById("midimonitor").getElementsByTagName("li")[note - 1].style.color = "red";

				//populate array
				if (pop) {
					if (newSeq.length < curSeq.length) {
						newSeq.push(note);
					} else {
						pop = false;
					}

					document.getElementById("newSeq").innerHTML = newSeq;
				}
			} else {
				//noteOff(note);
				//console.log('note off ' + note);
				//console.log("off");
				midiState[note - 1] = 0;
				document.getElementById("midimonitor").getElementsByTagName("li")[note - 1].style.color = "black";
				document.getElementById("midimonitor").getElementsByTagName("li")[note - 1].innerHTML = "0";
			}
			break;
		case 128: // noteOff
			//console.log('note off ' + note);
			//noteOff(note);
			midiState[note - 1] = 0;
			document.getElementById("midimonitor").getElementsByTagName("li")[note - 1].style.color = "black";
			document.getElementById("midimonitor").getElementsByTagName("li")[note - 1].innerHTML = "0";
			break;
		case 176: //capture
			switch (note) {
				case 117:
					if (velocity === 127) {
						console.log("here");
						pop = !pop;
						newSeq = [];
						document.getElementById("newSeq").innerHTML = newSeq;

					}
					break;
				case 21: case 22: case 23: case 24: case 25: case 26: case 27: case 28: case 29: //TODO: please rewrite this
					var ind = note - dialOffset;
					curSeqDurs[ind] = velocity / 127 * 3.75 + .25;
					// console.log(velocity/127*4)
					break;
			}
		case 153: // noteOff
			if(note>=36 & note<=39){
				var ind = note - padOffset;
				// console.log(ind);
				curSeqEnable[ind] = curSeqEnable[ind]===1 ? 0 : 1;
				// console.log(velocity/127*4)

			}
			if(note>=44 & note<=47){
				var ind = note - padOffset;
				// console.log(ind-4);
				curSeqEnable[ind-4] = curSeqEnable[ind-4]===1 ? 0 : 1;
				// console.log(velocity/127*4)

			}
			break;
	}
}

function sendNote(midiAccess, noteNum, velocity) {
	const noteOnMessage = [0x90, noteNum, velocity];    // note on, middle C, full velocity
	// console.log(noteNum);
	var output = midiAccess.outputs.get('output-1');
	output.send(noteOnMessage);
}

const loopA = new Tone.Loop(time => {   	// console.log(time); //Tone.Time(time).toNotation())
	if (Tone.Time(time) >= curSeqDurs[durInd] + lastNoteVal) {
		console.log(curSeqEnable);
		sendNote(midi, curSeq[noteInd], curSeqEnable[noteInd] * 127);
		noteInd += 1;
		noteInd = noteInd % curSeq.length;
		// console.log(newSeq);
		if (newSeq.length === curSeq.length && noteInd === 0) {
			curSeq = newSeq;
			newSeq = [];
			pop = false;
			document.getElementById("curSeq").innerHTML = curSeq;
			document.getElementById("newSeq").innerHTML = newSeq;
		}
		lastNoteVal = Tone.Time(time)
		durInd += 1;
		durInd = durInd % curSeqDurs.length;
	}
}, "16n").start(0);
//can you assign rate to variable and update

document.getElementById("play-button").addEventListener("click", async function () {
	if (Tone.Transport.state !== 'started') {
		await Tone.start();
		Tone.Transport.start();
		console.log('started');
	} else {
		Tone.Transport.stop();
	}
});

navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

function populateHTMLList() {
	let list = document.getElementById("midimonitor");
	midiState.forEach((item) => {
		let li = document.createElement("li");
		li.innerText = item;
		list.appendChild(li);
	})
}

