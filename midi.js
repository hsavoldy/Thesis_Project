// import '../node_modules/zyklus';
var midi = null;  // global MIDIAccess object
var outputIds = [];
var midiState = Array(128).fill(0);
var pop = false;
var noteInd = 0;
var curSeq = [60, 60, 60, 60];
var newSeq = [];
var tempo = 150;
var durInd = 0;
var secsPerBeat = 60 / tempo;
var curSeqDurs = new Array(8).fill(1); //1 is quarter note, .5 is eight, .25 is sixteenth
var newSeqDurs = [];
Tone.Transport.bpm.value = tempo * 4;
var midiDict = {};
var dialOffset = 21;
var padOffset = 36;
var lastNoteVal = 0;
var enableInd = 0;
var curSeqEnable = new Array(8).fill(1);
var outputMidiID = 'output-1';
const range = (start, end, length = end - start + 1) =>
	Array.from({ length }, (_, i) => start + i)

function onMIDISuccess(midiAccess) {
	console.log("MIDI ready!");
	midi = midiAccess;  // store in the global (in real usage, would probably keep in an object instance)
	console.log(midi);
	midiAccess.inputs.get('input-1').onmidimessage = getMIDIMessage;
	for (var output of midiAccess.outputs) {
		outputIds.push(output[1].id);
		console.log(output[1])
		if(output[1].name==="LoopMIDI Port"){
			outputMidiID = output[1].id;
		}
	}
	Tone.Transport.start()
	// populateHTMLList();
	// document.getElementById("curSeq").innerHTML = curSeq;
	// document.getElementById("curSeqDurs").innerHTML = curSeqDurs;
	// document.getElementById("curSeqEnable").innerHTML = curSeqEnable;

}
function onMIDIFailure(msg) {
	console.error(`Failed to get MIDI access - ${msg}`);
}

// const clock = ctx
//   .createClock((time, duration, tick) => {
//     console.log(time, duration, tick);
//   }, 0.2)
//   .start();

function getMIDIMessage(message) {
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
				console.log(note);
				//midi monitor
				midiState[note - 1] = 1;
				// document.getElementById("midimonitor").getElementsByTagName("li")[note - 1].innerHTML = "1";
				// document.getElementById("midimonitor").getElementsByTagName("li")[note - 1].style.color = "red";

				//populate array
				// if (pop) {
				// 	if (newSeq.length < curSeq.length) {
				// 		newSeq.push(note);
				// 	} else {
				// 		pop = false;
				// 	}
				for(let i = 0; i<seqs.length;i++){
					if(seqs[i].repopulating===true){
						seqs[i].addNote(note);
					}else if(seqs[i].inserting!==false){
						seqs[i].insertNote(note);
					}
				}
				

					// document.getElementById("newSeq").innerHTML = newSeq;
				}
			// } else {
			// 	midiState[note - 1] = 0;
			// 	// document.getElementById("midimonitor").getElementsByTagName("li")[note - 1].style.color = "black";
			// 	// document.getElementById("midimonitor").getElementsByTagName("li")[note - 1].innerHTML = "0";
			// }
			break;
		case 128: // noteOff
			midiState[note - 1] = 0;
			// document.getElementById("midimonitor").getElementsByTagName("li")[note - 1].style.color = "black";
			// document.getElementById("midimonitor").getElementsByTagName("li")[note - 1].innerHTML = "0";
			break;
		case 176: //capture
			switch (note) {
				case 117:
					if (velocity === 127) {
						pop = !pop;
						newSeq = [];
						// document.getElementById("newSeq").innerHTML = newSeq;
					}
					break;
				case 21: case 22: case 23: case 24: case 25: case 26: case 27: case 28: case 29: //TODO: please rewrite this
					var ind = note - dialOffset;
					curSeqDurs[ind] = Math.round((velocity / 127 * 3.75 + .25)/.25)*.25;
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
	const noteOnMessage = [0x90, noteNum, velocity];    // note on, midi pitch num, full velocity
	// console.log(noteNum);
	var output = midiAccess.outputs.get(outputMidiID);
	output.send(noteOnMessage);
}

// const noteLoop = new Tone.Loop(time => {
// 	// console.log(time); //Tone.Time(time).toNotation())
// if (Tone.Time(time) >= curSeqDurs[durInd]*secsPerBeat + lastNoteVal) {
// 	// console.log(curSeqEnable);
// }
// }, "16n").start(0);

const controlLoop = new Tone.Loop(time => {
	// document.getElementById("curSeqDurs").innerHTML = curSeqDurs;
	// document.getElementById("curSeqEnable").innerHTML = curSeqEnable;
	
	if (Tone.Time(time) >= curSeqDurs[noteInd]*secsPerBeat + lastNoteVal) {
		noteInd += 1;
		noteInd = noteInd % curSeq.length;
		console.log(seqs);
		// sendNote(midi, curSeq[noteInd], curSeqEnable[noteInd] * 127);
		for(let i = 0; i<seqs.length;i++){
			let note = seqs[i].nextNote()
			sendNote(midi, note, 127);
			console.log(note);
		}
		if (newSeq.length === curSeq.length && noteInd === 0) {
			curSeq = newSeq;
			newSeq = [];
			// pop = false;
			// document.getElementById("curSeq").innerHTML = curSeq;
			// document.getElementById("newSeq").innerHTML = newSeq;
		}
		lastNoteVal = Tone.Time(time)
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

// function populateHTMLList() {
// 	let list = document.getElementById("midimonitor");
// 	midiState.forEach((item) => {
// 		let li = document.createElement("li");
// 		li.innerText = item;
// 		list.appendChild(li);
// 	})
// }

var seqs = []

// class Seq{
// 	constructor(notes){
// 		this.seq = new SeqStruct(notes);
// 		seqs.push(this.seq)
// 	}

// }

class Seq {
	constructor(notes){
		this.notes = notes;
		this.ind = 0;
		this.repopulating = false;
		this.inserting = false;
		seqs.push(this);
	}

	nextNote(){
		if(this.notes.length===0){
			this.ind=0;
			return null;
		}
		var note = this.notes[this.ind]
		this.ind = (this.ind+1)%this.notes.length
		return note
	}

	repopulate(){
		this.notes = [];
		this.repopulating = true;
	}

	stopPop(){
		this.repopulating = false;
	}

	addNote(note){
		this.notes.push(note);
	}

	insertNoteAt(arrayInd){
		this.inserting = arrayInd;
	}

	insertNote(note){
		this.notes.splice(this.inserting, 0, note);
		this.inserting=false;
	}
}


window.onload = function() {
	const cm = CodeMirror( document.body, {
	value: "let a = new Seq([60,61,62]);\n",
	mode: "javascript"
})

cm.setOption( 'extraKeys', {
'Ctrl-Enter': function( cm ) {
	const code = cm.getValue()

	console.log( 'the code is:', code )
	eval( code )
}
})
}
