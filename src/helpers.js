export function pageTimer() {
    setTimeout(() => {
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
    ,300000)
 }