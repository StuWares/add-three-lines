const timeSet = 30000; // 300000 ms = 5 min delay, use 30000 (30 secs) for debugging
export let subTimerId;

export function pageTimer() {
    subTimerId = setTimeout(() => {
        document.getElementById("getLines").hidden = false;
        document.getElementById("getLines").innerHTML= "Try again?"
        document.getElementById("textLines").hidden = true;
        document.getElementById("instructions").innerHTML = "Make sure to submit your lines within 5 mintues!"
        document.getElementById("firstLine").value = "";
        document.getElementById("secondLine").value = "";
        document.getElementById("thirdLine").value = "";
        document.getElementById("storySoFar").innerHTML = "";
        document.getElementById("introText").innerHTML = "";
        document.getElementById("lastLineWritten").innerHTML = "Out of time";
        document.getElementById('lineOneCount').innerHTML = 100;
        document.getElementById('lineTwoCount').innerHTML = 100;
        document.getElementById('lineThreeCount').innerHTML = 100;

    }        
    ,timeSet)
 }

 export function cancelSubTimer(timerId){
    clearTimeout(timerId);
}