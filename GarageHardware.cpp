#include"GarageHardware.h"

// TODO: Define any variables or constants here

#define DEBOUNCE 100  // how many ms to debounce, 5+ ms is usually plenty

// initial var (closed light)
int R = 255;
int G = 0;
int B = 0;

//define the buttons that we'll use.
const int led1 = D0; 
const int led2 = D1;
const int led3 = D2;

const int led4 = D7;

const int buttons[] = {3,4,5,6}; 
//determine how big the array up above is, by checking the size
#define NUMBUTTONS sizeof(buttons)
//track if a button is just pressed, just released, or 'currently pressed' 
int pressed[NUMBUTTONS], justpressed[NUMBUTTONS], justreleased[NUMBUTTONS];
int previous_keystate[NUMBUTTONS], current_keystate[NUMBUTTONS];


int t_closed = 0;
int t_opened = 0;

/**
 * Setup the door hardware (all I/O should be configured here)
 *
 * This routine should be called only once from setup()
 */
void setupHardware() {
  // TODO: Your code to setup your "simulated" hardware
  //D1, 0 = pushed, 1 = unpushed
  int i;

  pinMode(D3, INPUT_PULLUP); // closing to close button
  pinMode(D4, INPUT_PULLUP); // start opening/start closing pause button 
  pinMode(D5, INPUT_PULLUP); // opening to open button
  pinMode(D6, INPUT_PULLUP); // fault button
  pinMode(led1, OUTPUT);
  pinMode(led2, OUTPUT);
  pinMode(led3, OUTPUT);
  pinMode(led4, OUTPUT);
  
   analogWrite(led1, B);
    analogWrite(led2, G);
    analogWrite(led3, R);
  
    // pull-up resistors on switch pins
  for (i=0; i< NUMBUTTONS; i++) {
    digitalWrite(buttons[i], HIGH);
  }
}


void startMotorOpening() {
     setLight(true);
    // opening = blue
    R = 0;
    G = 0;
    B = 255;
    analogWrite(led1, B);
    analogWrite(led2, G);
    analogWrite(led3, R);
    
}
/**
 * This function will start the motor moving in a direction closes the door.
 * 
 * Note: This is a non-blocking function.  It will return immediately
 *       and the motor will continue to opperate until stopped or reversed.
 * 
 * return void 
 */
void startMotorClosing() {
    setLight(true);
    // closing = yellow
    R = 255;
    G = 255;
    B = 0;
    analogWrite(led1, B);
    analogWrite(led2, G);
    analogWrite(led3, R);
   
}

/**
 * This function will stop all motor movement.
 * 
 * Note: This is a non-blocking function.  It will return immediately.
 * 
 * return void 
 */
void stopMotorPaused() {
  // TODO: Your code to simulate the door stopping motion  
    // (grey)
    R = 160;
    G = 160;
    B = 160;
    analogWrite(led1, B);
    analogWrite(led2, G);
    analogWrite(led3, R);
}


void stopMotorClosed() {
    t_closed = millis();
    // write fully closed light (red)
    R = 255;
    G = 0;
    B = 0;
    if(millis()-t_closed>5000){
	        setLight(false);
    }
    else{
        analogWrite(led1, B);
        analogWrite(led2, G);
        analogWrite(led3, R);   
    }
}

void stopMotorOpened() {
    t_opened = millis();
     // fully opened color (green)
    R = 0;
    G = 255;
    B = 0;
    if(millis()-t_opened>5000){
	        setLight(false);
    }
    else{
         analogWrite(led1, B);
        analogWrite(led2, G);
        analogWrite(led3, R);
    }
}

void stopMotorFault() {
    R = 239;
    G = 55;
    B = 252;
    analogWrite(led1, B);
    analogWrite(led2, G);
    analogWrite(led3, R);
    
}


/**
 * This function will control the state of the light on the opener.
 * 
 * Parameter: on: true indicates the light should enter the "on" state; 
 *                false indicates the light should enter the "off" state
 * 
 * Note: This is a non-blocking function.  It will return immediately.
 * 
 * return void 
 */
void setLight(boolean on) {
  if (on){
   digitalWrite(D7,HIGH);
  }   
  else{
   digitalWrite(D7,LOW);
      
  }
}


void check_switches()
{
  static int previousstate[NUMBUTTONS];
  static int currentstate[NUMBUTTONS];
  static long lasttime;
  int index;
  if (millis() < lasttime) {
    // we wrapped around, lets just try again
    lasttime = millis();
  }
  if ((lasttime + DEBOUNCE) > millis()) {
    // not enough time has passed to debounce
    return; 
  }
  // reset timer after debounce time passed
  lasttime = millis();
  for (index = 0; index < NUMBUTTONS; index++) {
    justpressed[index] = 0;       //when we start, we clear out the "just" indicators
    justreleased[index] = 0;
    currentstate[index] = digitalRead(buttons[index]);   //read the button
    if (currentstate[index] == previousstate[index]) {
      if ((pressed[index] == LOW) && (currentstate[index] == LOW)) {
        // just pressed
        justpressed[index] = 1;
      }
      else if ((pressed[index] == HIGH) && (currentstate[index] == HIGH)) {
        justreleased[index] = 1; // just released
      }
      pressed[index] = !currentstate[index];  //remember, digital HIGH means NOT pressed
    }
    previousstate[index] = currentstate[index]; //keep a running tally of the buttons
  }
}
 
int thisSwitch_justPressed() {
  int thisSwitch = 255;
  check_switches();  //check the switches &amp; get the current state
  for (int i = 0; i < NUMBUTTONS; i++) {
    current_keystate[i]=justpressed[i];
    if (current_keystate[i] != previous_keystate[i]) {
      if (current_keystate[i]) thisSwitch=i;
    }
    previous_keystate[i]=current_keystate[i];
  }  
  return thisSwitch;
}


