function main(){
   	// console.log(time); //Tone.Time(time).toNotation())
	if (Tone.Time(time) >= curSeqDurs[durInd] + lastNoteVal) {
		// console.log(curSeqEnable);
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
}