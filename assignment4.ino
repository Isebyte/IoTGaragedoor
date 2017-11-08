// This #include statement was automatically added by the Particle IDE.
#include "GarageHardware.h"

boolean isD3 = false;
boolean isD4 = false;
boolean isD5 = false;
boolean isD6 = false;
boolean buttonPress = false;

unsigned long workTime = 3000;
unsigned long workStart;

String newStateFromUI;



typedef enum { // sets states
  closed = 0,      // 0
  opening,     // 1
  opened,        // 2
  closing,     // 3
  pausedC2O,   // 4
  pausedO2C,   // 5
  faultO,
  faultC      // 7
} State;

State s = closed; // First initial state

 

void check_fault(){
    if (isFaultActive()){
if(s==closing){
s=faultC;
}
else if(s==opening){
s=faultO;
}
}
}

Timer fault_checker(200, check_fault);

// Handles data recieved from UI for state changes
void doorHandler(const char *event, String data)
{
  
  Serial.print(event);
  Serial.print(", data: ");
    newStateFromUI =  data;
    Serial.println(data);

    
}

int initStateHandler(String data)
{
  
 // Serial.print(event);
  Serial.print(", data: ");
  
  if (data == "open") {
      s = opened;
  } else if (data == "closed") {
      s =  closed; // set current state to door state
  } else if (data == "closing") {
      s =  closing; // set current state to door state
  } else if (data == "opening") {
      s =  opening; // set current state to door state
  } else if (data == "pausedO2C") {
      s =  pausedO2C; // set current state to door state
  } else if (data == "pausedC2O") {
      s =  pausedC2O; // set current state to door state
  } else if (data == "faultC") {
      s =  faultC; // set current state to door state
  } else if (data == "faultO") {
      s =  faultO; // set current state to door state
  }
   return 1;
    Serial.println(data);

    
}



void setup() {
    Serial.begin(9600);
    setupHardware();
    // recieve data from stateChange event from Javascript - passes data to doorHandler
    Particle.subscribe("stateChange", doorHandler);
    Particle.function("initState",initStateHandler);
    fault_checker.start();
    Serial.println("Closed");
}



/**
 * Return true if the door open/close button is pressed
 * 
 * Note: this is directly based on hardware.  No debouncing or
 *       other processing is performed.
 * 
 * return  true if buttons is currently pressed, false otherwise
 */
boolean isButtonPressed() {  // pause/open/close button
    return buttonPress;
}


/**
 * Return true if the door is fully closed
 * 
 * Note: This is directly based on hardware.  No debouncing or
 *       other processing is performed.
 * 
 * return  true if the door is completely closed, false otherwise
 */
boolean isDoorFullyClosed() {
    // if closing to closed button is pressed
  return (isD3 == true);
}

/**
 * Return true if the door has experienced a fault
 * 
 * Note: This is directly based on hardware.  No debouncing or
 *       other processing is performed.
 * 
 * return  true if the door is has experienced a fault
 */
boolean isFaultActive() {
    return (isD6 == true);
}

/**
 * Return true if the door is fully open
 * 
 * Note: This is directly based on hardware.  No debouncing or
 *       other processing is performed.
 * 
 * return  true if the door is completely open, false otherwise
 */
boolean isDoorFullyOpen() {
  // TODO: Your code to simulate the door open sensor
  return (isD5 == true);
}




// state switching method
State nextState(State state) {
  switch (state) {
    case closed: //0 red
        // if open button is pressed
        if (isD4 == true || newStateFromUI == "opening") {
            state = opening;
            Particle.publish("event","opening");
         }
      break;
      
    case opening:  // 1 blue
        // if pause button pressed
         if (isD4 == true || newStateFromUI == "pausedO2C") {
            state = pausedO2C;
            Particle.publish("event","pausedO2C");
            break;
         }
         else if (isFaultActive()){ // fault ONLY detected from hardware!
            state = faultO;
            Particle.publish("event","faultO");
            break;
         }
         else if (isDoorFullyOpen() || newStateFromUI == "opened") {
            state = opened;
            Particle.publish("event","open");
            break;
         }
         break;
      
    case opened: //2 green
         if (isD4 == true  || newStateFromUI == "closing"){
            state = closing;
            Particle.publish("event","closing");
         }
        break;
        
    case closing: //yellow
        // if pause button pressed
         if (isD4 == true || newStateFromUI == "pausedC2O") {
             state = pausedC2O;
             Particle.publish("event","pausedC2O");
             break;
         } 
         else if (isFaultActive()){ // fault ONLY detected from hardware!
            state = faultC;
            Particle.publish("event","faultC");
            break;
         }
         else if(isDoorFullyClosed() || newStateFromUI == "closed"){
            state = closed;
            Particle.publish("event","closed");
            break;
         } else {
             break;
         }
        
        
    case pausedC2O: // white
        // if pause button pressed again, flip then resume
        if (isD4 == true || newStateFromUI == "opening"){
            state = opening;
            Particle.publish("event","opening");
         }
        break;
        // if pause button pressed again, flip then resume
    case pausedO2C: //white
        if (isD4 == true || newStateFromUI == "closing"){
            state = closing;
            Particle.publish("event","closing");
         }
        break;
        
    case faultO: // purple
        // if fault button pressed again, resume
        if (isFaultActive()){
            state = opening;
            Particle.publish("event","opening");
         }
        break;
        
    case faultC: // purple
        // if fault button pressed again, resume
        if (isFaultActive()){
            state = closing;
            Particle.publish("event","closing");
         }
        break;
  }
  return state; 
}



void loop() {
    
  int thisSwitch = thisSwitch_justPressed();
  switch(thisSwitch)
  {  
  case 0: 
    Serial.println("finish closing switch just pressed");  // D3
    isD3 = true;
    isD4 = false;
    isD5 = false;
    isD6 = false;
    buttonPress = true;
    break;
    
  case 1: 
    Serial.println("open/close/pause switch just pressed");  // D4
     isD3 = false;
    isD4 = true;
    isD5 = false;
    isD6 = false;
    buttonPress = true;
    break;
  case 2: 
    Serial.println("finish opening switch just pressed"); // D5
     isD3 = false;
    isD4 = false;
    isD5 = true;
    isD6 = false;
    buttonPress = true;
    break;
  case 3: 
    Serial.println("fault switch just pressed");  // D6
     isD3 = false;
    isD4 = false;
    isD5 = false;
    isD6 = true;
    buttonPress = true;
    break;
  }
    
    s = nextState(s); 
 
  switch(s) {
    case closed: //0
        Serial.println("closed");
        stopMotorClosed();
      break;
      
    case opening:  // 1
        Serial.println("opening");
        startMotorOpening();
      break;
      
    case opened: //2
        Serial.println("opened");
        stopMotorOpened();
        break;
        
    case closing:
        Serial.println("closing");
        startMotorClosing();
        break;
        
    case pausedC2O:
        Serial.println("pausedC2O");
         stopMotorPaused();
        break;
        
    case pausedO2C:
        Serial.println("pausedO2C");
         stopMotorPaused();
        break;
        
    case faultO:
        Serial.println("faultO");
         stopMotorFault();
        break;
        
    case faultC:
        Serial.println("faultC");
         stopMotorFault();
        break;
  }

// reset button press
    buttonPress = false;
    isD3 = false;
    isD4 = false;
    isD5 = false;
    isD6 = false;
 
}