var particle;
var token = 'ed880e5f3f1f3ff58eb55857b566e4add8a2b93b';
var doorID = 'door1';
//array for users
var users = [];
var isInit = false;


//two users
var admin = {
    name: "a",
    pass: "a",
    email: "admin@admin.admin",
    phone: "123456789",
    id: "1234",
    doorStat: "closed",
    preferences: {
        autoClose: false,
        autoCloseTime: "",
        opens: true,
        closes: true,
        timeOut: true,
        timeOutTime: "45",
        autoOpen: false
    }
};
var phoebe = {
    name: "phoebe",
    pass: "4321",
    email: "phoebe@phoebe.phoebe",
    phone: "987654321",
    id: "4321",
    doorStat: "open",
    preferences: {
        autoClose: false,
        autoCloseTime: "30",
        opens: false,
        closes: false,
        timeOut: false,
        timeOutTime: "",
        autoOpen: true
    }
};
users.push(admin);
users.push(phoebe);

var deviceID = '370040000351353530373132';

var currentUser = phoebe;
var door = document.getElementById('door1');
var doorDisp = document.getElementById('doorStatus');
var butt = document.getElementById(doorID.concat("Butt"));
var doorStatus = document.getElementById(doorID.concat("Status"));

// Call back function for login success/failure
function loginSuccess(data) {
    console.log('API call completed on promise resolve - logged in: ', data.body.access_token);
    token = data.body.access_token;

    // send particle initial state that was saved only after successful login
    particle.callFunction({
        deviceId: deviceID,
        name: 'initState', // event name in photon
        argument: currentUser.doorStat,
        auth: token
    }).then(
        function (data) {
            console.log('set init state on photon succesfully:', data);
        },
        function (err) {
            console.log('Could not set init state - error:', err);
        });
    isInit = true;
}

function loginError(error) {
    console.log('API call completed on promise fail - cannot log in: ', error);
}

function callSuccess(data) {
    console.log('Function called succesfully:', data);

}

function callFailure(error) {
    console.log('An error occurred:', error);
    //alert("error");
}

window.onload = function () {
    console.log("window.onload start");
    var x = document.createElement('script');
    x.src = 'http://cdn.jsdelivr.net/particle-api-js/5/particle.min.js';
    document.getElementsByTagName("head")[0].appendChild(x);

    // login to particle.io
    particle = new Particle();
    particle.login({
        username: 'isabelle.xu@wustl.edu',
        password: 'sunshine_98'
    }).then(loginSuccess, loginError);

    document.getElementById('loggedOut').style.display = 'none';
    document.getElementById("defaultOpen2").click();
    door = document.getElementById('door1');
    butt = document.getElementById(doorID.concat("Butt"));
    // set door to what was initially saved on account
    doorStatus = document.getElementById(doorID.concat("Status"));
    doorDisp = document.getElementById('doorStatus');
    initializeDoor(doorID, currentUser.doorStat);


    // if (isInit == true) {
    console.log("isInit is true");
    //set event listeners and stuff only when current state successfully loaded
    document.getElementById("door1Butt").addEventListener("click", changeDoor);
    document.getElementById("loginButt").addEventListener("click", login);
    document.getElementById("registerButt").addEventListener("click", register);
    document.getElementById("recoverButt").addEventListener("click", recover);
    document.getElementById("saveAdvancedButt").addEventListener("click", saveAdvanced);

    //}

    //Recieves info from Particle
    particle.getEventStream({
        deviceId: deviceID,
        auth: token
    }).then(function (stream) {
        stream.on('event', function (data) {
            currentUser.doorStat = data.data;
            //alert(data.data);
            if (data.data == "faultO" || data.data == "faultC") {
                faultDoor();
            } else if (data.data == "closed") {
                closeDoor();
            } else if (data.data == "open") {
                openDoor();
            } else if (data.data == "pausedO2C" || data.data == "pausedC2O") {
                pauseDoor();
            } else if (data.data == "opening") {
                beginOpen();
            } else if (data.data == "closing") {
                beginClose();
            }
        });
    });


};
var newState;

// every time; UI button is clicked, changeDoor is called
// Called when: start opening/closing door, pause
function changeDoor() {
    console.log("changeDoor");
    if (currentUser.doorStat == 'closed') {
        newState = 'opening';
        beginOpen();
    } else if (currentUser.doorStat == 'open') {
        newState = 'closing';
        beginClose();
    } else if (currentUser.doorStat == 'closing') {
        newState = 'pausedC2O';
        pauseDoor();
    } else if (currentUser.doorStat == 'opening') {
        newState = 'pausedO2C';
        pauseDoor();
    } else if (currentUser.doorStat == 'pausedO2C') {
        newState = 'closing';
        beginClose();
    } else if (currentUser.doorStat == 'pausedC2O') {
        newState = 'opening';
        beginOpen();
    } else if (currentUser.doorStat == 'faultC') {
        faultDoor();
    } else if (currentUser.doorStat == 'faultO') {
        faultDoor();
    }

    // allows data to be published to photon
    var publishEventPr = particle.publishEvent({
        name: 'stateChange',
        data: newState,
        auth: token
    });

    publishEventPr.then(
        function (data) {
            if (data.body.ok) {
                console.log("Event published succesfully");
            }
        },
        function (err) {
            console.log("Failed to publish event: " + err);
        }
    );

}

function faultDoor() {
    alert("AAAAAAAAAAAAA");
    doorStatus.innerHTML = "Fault";
    doorDisp.innerHTML = "Fault";
    if (currentUser.doorStat == 'closing') {
        alert("this is a fault");
        door.className = '';
        door.classList.add('door');

        door.classList.add('fault');
        butt.classList.add('doorControlClose');

        doorStatus.innerHTML = "Fault";
        doorDisp.innerHTML = "Fault";
        butt.innerHTML = 'Close';

        currentUser.doorStat = 'faultC';
    } else if (currentUser.doorStat == 'opening') {
        alert("this is a bad fault");
        door.className = '';
        door.classList.add('door');

        door.classList.add('closed');
        butt.classList.add('doorControlOpen');

        doorStatus.innerHTML = "Fault";
        doorDisp.innerHTML = "Fault";
        butt.innerHTML = 'Open';

        currentUser.doorStat = 'faultO';
    }
}

function closeDoor() {
    console.log("closeDoor");

    if (currentUser.doorStat == 'closing' || currentUser.doorStat == 'closed') {
        door.className = '';
        door.classList.add('door');

        door.classList.add('closed');
        butt.classList.add('doorControlOpen');

        doorStatus.innerHTML = "Closed";
        doorDisp.innerHTML = "Closed";
        butt.innerHTML = 'Open';

        currentUser.doorStat = 'closed';


        newState = 'closed';
        // notify photon that door is now closed
        var publishEventPr = particle.publishEvent({
            name: 'stateChange',
            data: newState,
            auth: token
        });

        publishEventPr.then(
            function (data) {
                if (data.body.ok) {
                    console.log("closeDoor published succesfully");
                }
            },
            function (err) {
                console.log("Failed to publish closeDoor() " + err);
            }
        );

    }
}

function openDoor() {
    console.log("openDoor");

    if (currentUser.doorStat == 'opening' || currentUser.doorStat == 'open') {
        door.className = '';
        door.classList.add('door');

        door.classList.add('open');
        butt.classList.add('doorControlClose');

        doorStatus.innerHTML = "Open";
        doorDisp.innerHTML = "Open";
        butt.innerHTML = 'Close';

        currentUser.doorStat = 'open';

        newState = 'opened';
        // notify photon that door is now open
        var publishEventPr = particle.publishEvent({
            name: 'stateChange',
            data: newState,
            auth: token
        });

        publishEventPr.then(
            function (data) {
                if (data.body.ok) {
                    console.log("OpenDoor published succesfully")
                }
            },
            function (err) {
                console.log("Failed to publish openDoor: " + err)
            }
        );


        if (currentUser.preferences.autoClose) {
            console.log("timer start!");
            console.log(currentUser.preferences.autoCloseTime * 1000);
            setTimeout(function () {
                beginClose();
            }, currentUser.preferences.autoCloseTime * 1000);
        }

    }

}

function beginOpen() {
    console.log("beginOpen");

    door.className = '';
    door.classList.add('door');

    door.classList.add('opening');
    butt.classList.add('doorControlPause');

    doorStatus.innerHTML = "Opening...";
    butt.innerHTML = 'Pause';

    currentUser.doorStat = 'opening';

    doorStatus.innerHTML = "Opening...";
    doorDisp.innerHTML = "Opening...";
    butt.innerHTML = 'pause';

    currentUser.doorStat = 'opening';

    //    timeout1 = setTimeout(openDoor, 5000);
}

function beginClose() {
    console.log("beginClose");
    console.log(currentUser.doorStat);
    if (currentUser.doorStat == 'open' || currentUser.doorStat == 'closing' || currentUser.doorStat == 'pausedO2C' || currentUser.doorStat == 'pausedC2O') {
        console.log("door is closing");
        door.className = '';
        door.classList.add('door');

        door.classList.add('closing');
        butt.classList.add('doorControlPause');

        doorStatus.innerHTML = "Closing...";
        doorDisp.innerHTML = "Closing...";
        butt.innerHTML = 'Pause';

        currentUser.doorStat = 'closing';
        console.log("made it here");

        //        timeout2 = setTimeout(closeDoor, 5000);

        newState = 'closing';
        // notify photon that door is now closed
        var publishEventPr = particle.publishEvent({
            name: 'stateChange',
            data: newState,
            auth: token
        });

        publishEventPr.then(
            function (data) {
                if (data.body.ok) {
                    console.log("closeDoor published succesfully");
                }
            },
            function (err) {
                console.log("Failed to publish closeDoor() " + err);
            }
        );

    }


}

function pauseDoor() {
    console.log("pauseDoor");
    console.log(currentUser.doorStat);
    if (currentUser.doorStat == 'closing' || currentUser.doorStat == 'pausedC2O') {
        door.className = '';
        door.classList.add('door');

        door.classList.add('pausedC2O');
        butt.classList.add('doorControlOpen');

        doorStatus.innerHTML = "Paused";
        doorDisp.innerHTML = "Paused";
        butt.innerHTML = 'Open';

        currentUser.doorStat = 'pausedC2O';
    } else if (currentUser.doorStat == 'opening' || currentUser.doorStat == 'pausedO2C') {
        door.className = '';
        door.classList.add('door');

        door.classList.add('pausedO2C');
        butt.classList.add('doorControlClose');

        doorStatus.innerHTML = "Paused";
        doorDisp.innerHTML = "Paused";
        butt.innerHTML = 'Close';

        currentUser.doorStat = 'pausedO2C';
    }
}


function initializeDoor(doorID, set) {
    console.log("initializeDoor");
    if (set == 'open') {
        openDoor();
    } else if (set == 'closed') {
        closeDoor();
    } else if (currentUser.doorStat == 'closing') {
        beginClose();
    } else if (currentUser.doorStat == 'opening') {
        beginOpen();
    } else if (set == 'pausedC2O') {
        pauseDoor()
    } else if (set == 'pausedO2C') {
        pauseDoor();
    }
}

function login() {
    //get the guessed username and password, validate
    var userGuess = document.getElementById("userGuess").value;
    var passGuess = document.getElementById("passGuess").value;
    var possibleUser = validateUser(userGuess, passGuess);

    if (possibleUser) {
        //if the user is valid, change pages
        currentUser = possibleUser;
        document.getElementById('loggedIn').style.display = '';
        document.getElementById('loggedOut').style.display = 'none';
        //display door status
        initializeDoor(doorID, currentUser.doorStat);

        //Display saved preferences
        document.getElementById("autoClose").checked = currentUser.preferences.autoClose;
        document.getElementById("autoCloseTime").value = currentUser.preferences.autoCloseTime;

        document.getElementById("opens").checked = currentUser.preferences.opens;
        document.getElementById("closes").checked = currentUser.preferences.closes;
        document.getElementById("timeOut").checked = currentUser.preferences.timeOut;
        document.getElementById("timeOutTime").value = currentUser.preferences.timeOutTime;

        document.getElementById("autoOpen").checked = currentUser.preferences.autoOpen;


        document.getElementById("defaultOpen2").click();

    } else {
        //if invalid user, re-prompt user to try loggin in again
        alert("invalid username or password.  please try again");
    }


}

function validateUser(nameGuess, passGuess) {
    //search the users array for a user with the matching username AND password
    for (var i = 0; i < users.length; i++) {
        if ((users[i].name == nameGuess) && (users[i].pass == passGuess)) {
            return users[i];
        }
    }
    return null;
}

function logout() {
    //switch views on logout and set the current user to null
    document.getElementById('loggedIn').style.display = 'none';
    document.getElementById('loggedOut').style.display = '';
    currentUser = null;
    document.getElementById("defaultOpen").click();
}


function register() {
    if (document.getElementById("pass1").value == document.getElementById("pass2").value) {
        //ensure entered passwords match before creating auser object and saving it into the array
        var username = document.getElementById("user").value;
        var pass = document.getElementById("pass1").value;
        var email = document.getElementById("email").value;
        var phone = document.getElementById("phone").value;
        var doorID = document.getElementById("doorID").value

        var newUser = {
            name: username,
            pass: pass,
            email: email,
            phone: phone,
            id: doorID,
            doorStat: "closed",
            preferences: {
                autoClose: false,
                autoCloseTime: "",
                opens: false,
                closes: false,
                timeOut: false,
                timeOutTime: "",
                autoOpen: false
            }
        };
        users.push(newUser);
        alert("new user created!  please log in");
        document.getElementById("defaultOpen").click();
    } else {
        alert("please ensure passwords match");
    }

}

function recover() {
    var email = document.getElementById("recoverEmail").value;
    var name = document.getElementById("recoverName").value;
    //search for users in our array that have a matching username OR email
    for (var i = 0; i < users.length; i++) {
        if ((users[i].name == name) || (users[i].email == email)) {
            alert(users[i].pass);
        }
    }

}

function saveAdvanced() {
    //save the user's preferences and alert them
    currentUser.preferences.autoClose = document.getElementById("autoClose").checked;
    currentUser.preferences.autoCloseTime = document.getElementById("autoCloseTime").value;

    currentUser.preferences.opens = document.getElementById("opens").checked;
    currentUser.preferences.closes = document.getElementById("closes").checked;
    currentUser.preferences.timeOut = document.getElementById("timeOut").checked;
    currentUser.preferences.timeOutTime = document.getElementById("timeOutTime").value;

    currentUser.preferences.autoOpen = document.getElementById("autoOpen").checked;
    alert("info saved!");
    console.log(currentUser.preferences.autoClose);
    console.log(currentUser.preferences.autoCloseTime);
    console.log(document.getElementById("autoCloseTime").value);
    console.log(document.getElementById("autoClose").checked);

    if (currentUser.preferences.autoClose) {
        console.log("timer start!");
        console.log(currentUser.preferences.autoCloseTime * 1000);
        setTimeout(function () {
            beginClose();
        }, currentUser.preferences.autoCloseTime * 1000);
    }

}


function openPage(evt, pageName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(pageName).style.display = "block";
    evt.currentTarget.className += " active";
    var doorname = "Door 1: "
    document.getElementById("doorStatus").innerHTML = doorname.concat(currentUser.doorStat);
}
