// TODO: Unlocking locked stories if nobody updates them for a while
// Use a cloud function to run every 5 mins and unlock anything with a last edit time older than 5 mins?
// Will also need to find a way to stop the first user from updating after the timeout (tricky with anon auth!)
// Maybe a second collection to track what stories have been sent out but not yet had a submission back?
// Also need to deal with newly created stories that haven't had any lines added (same timeout needed)
// Can update the IF to treat a story with linetext length of 0 as brand new?

// Firebase sdk imports
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, 
        getFirestore, 
        query, 
        where, 
        collection, 
        getDocs, 
        orderBy, 
        limit, 
        setDoc, 
        updateDoc, arrayUnion, increment } from "firebase/firestore";

// Import timer functions
import { pageTimer, cancelSubTimer, subTimerId } from "./helpers";


// https://firebase.google.com/docs/web/setup#available-libraries

// Public Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAnQEf9FwA00AZkqrGw3L5FN1lDY0n6Q5o",
  authDomain: "add-3-lines.firebaseapp.com",
  projectId: "add-3-lines",
  storageBucket: "add-3-lines.appspot.com",
  messagingSenderId: "833846222277",
  appId: "1:833846222277:web:f5a3a35eac072bbd447fac",
  measurementId: "G-DZQ5TGRW3D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const storyColRef = collection(db, "stories");

let subTimer;

let writerId;
let storyRef;
let lastLine;
let isFinalEntry = false;


onAuthStateChanged(auth, user => {
    console.log(user);
    if (user != null) {
        writerId = user.uid;
        
        console.log('logged in! uid: ' + writerId);
        

    } else {
        console.log('No user');
    }
});

// create an anonymous UID if none already exists
signInAnonymously(auth).then(() => {
    
    // signed in
}).catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(errorCode, errorMessage);
});




// find the story ID of the oldest that the user hasn't edited last 
// don't think the query will do what I want exactly but enough for now! (needing to orderBy lastuseredit first is problematic)

async function beginWriting(writerId){
    document.getElementById("getLines").hidden = true;
    // line below is for testing purposes only
    //const q = query(storyColRef, where("lastuseredit", "==", writerId ), orderBy("lastedittime", "desc"), limit(1));
    const q = query(storyColRef, where("islocked", "==", false), where("iscomplete", "==", false), where("lastuseredit", "!=", writerId ), orderBy("lastuseredit"), orderBy("lastedittime", "desc"), limit(1));

    const querySnapshot = await getDocs(q);
    console.log(querySnapshot);

    if (querySnapshot.size > 0) {
    // if we've found a valid story, bring in the last line of linetext array
        querySnapshot.forEach((doc) => {
            lastLine = doc.data().linetext.at(-1);
            console.log(lastLine);
            storyRef = doc.ref;

            // check if this is the final entry
            if (doc.data().totallines == 33) { 
                isFinalEntry = true; 
            } else {
                isFinalEntry = false;
            }
            
        });

        // lock the story
        await updateDoc(storyRef, {
            islocked: true
        });

        // update DOM with the last line and prompt user to write.
        document.getElementById("introText").innerHTML = lastLine;
        document.getElementById("lastLineWritten").innerHTML = "The story so far...";

        if (isFinalEntry) {       
            document.getElementById('titleText').innerHTML = "You're the final writer! Conclude the story...";
        } else {
            document.getElementById('titleText').innerHTML = "Continue the story...";
        }
    } else {
        // start a new story
        console.log('we need a new story');
        let createTime = new Date;
        // add a new doc and save the generated reference id
        const newStoryRef = doc(collection(db, "stories"));
        storyRef = newStoryRef;
    
        // update the new story with the storyid
        await setDoc(newStoryRef, {
            storyid: newStoryRef,
            lastuseredit: writerId,
            islocked: true,
            iscomplete: false,
            linetext: [],
            totallines: 0,
            twitterhandles: [],
            lastedittime: createTime
        });
        document.getElementById("introText").innerHTML = "Let's begin...";
        document.getElementById("lastLineWritten").innerHTML = " ";
        document.getElementById('titleText').innerHTML = "It's time to begin a new story!";
        
    }
    subTimer = pageTimer()
};
    

const startButton = document.getElementById('getLines');

startButton.addEventListener('click', event => {
    beginWriting(writerId);
    document.getElementById("textLines").hidden = false;
    document.getElementById("submitButton").hidden = false;
});

// Character counters
const firstLine = document.getElementById('firstLine');
const secondLine = document.getElementById('secondLine');
const thirdLine = document.getElementById('thirdLine');

firstLine.addEventListener('keyup', event => {
    let strCount = firstLine.value.length;
    document.getElementById('lineOneCount').innerHTML = 100 - strCount;
});
secondLine.addEventListener('keyup', event => {
    let strCount = secondLine.value.length;
    document.getElementById('lineTwoCount').innerHTML = 100 - strCount;
});
thirdLine.addEventListener('keyup', event => {
    let strCount = thirdLine.value.length;
    document.getElementById('lineThreeCount').innerHTML = 100 - strCount;
});


// Get the new lines
const submitButton = document.getElementById("submitButton");

submitButton.addEventListener('click', async event => {
    
    const newLineOne = document.getElementById('firstLine').value;
    const newLineTwo = document.getElementById('secondLine').value;
    const newLineThree = document.getElementById('thirdLine').value;
    const twitterId = document.getElementById('twitterHandle').value;

    if (newLineOne == "" || newLineTwo == "" || newLineThree == "") {
        document.getElementById('titleText').innerHTML = "Please write 3 lines";
    } else {
        submitButton.hidden = true;

        const updateTime = new Date;

        await updateDoc(storyRef, {
            lastuseredit: writerId,
            islocked: false,
            iscomplete: isFinalEntry,
            twitterhandles: arrayUnion(twitterId),
            linetext: arrayUnion(newLineOne,newLineTwo,newLineThree),
            totallines: increment(3),
            lastedittime: updateTime
        });
        
        // hide the entry ui and unhide the submit button
        document.getElementById("getLines").hidden = false;
        document.getElementById("getLines").innerHTML= "Let's do another!"
        document.getElementById("textLines").hidden = true;
        document.getElementById("instructions").innerHTML = "Thanks for contributing!"
        document.getElementById("firstLine").value = "";
        document.getElementById("secondLine").value = "";
        document.getElementById("thirdLine").value = "";
        document.getElementById("storySoFar").innerHTML = "";
        document.getElementById("introText").innerHTML = "";
        document.getElementById("lastLineWritten").innerHTML = "Lines Submitted!";
        document.getElementById('lineOneCount').innerHTML = 100;
        document.getElementById('lineTwoCount').innerHTML = 100;
        document.getElementById('lineThreeCount').innerHTML = 100;

        cancelSubTimer(subTimerId);

    }

});