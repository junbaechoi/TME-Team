// Classifier Variable
let classifier;
// Model URL

let imageModelURL = 'https://teachablemachine.withgoogle.com/models/j-DqOHLVe/';  

// Video
let video;
let input;
let flippedVideo;
// To store the classification
let label = "";

//----------------- Saying words gesture ----------------------
let xspacing = 27; // Distance between each horizontal location
let w; // Width of entire wave
let theta = 0.0; // Start angle at 0
let amplitude = 40.0; // Height of wave
let period = 600.0; // How many pixels before the wave repeats
let dx; // Value for incrementing x
let yvalues; // Using an array to store height values for the wave
let sentence = "I Love Coding";
let sentenceArray = [];
let m = 0
//---------------------------------------------------------------


// Load the model first
function preload() {
  // classifier = ml5.imageClassifier(imageModelURL + 'model.json');
  classifier = ml5.imageClassifier('tm-my-image-model/model.json');

}

function setup() {
  let cnv = createCanvas(800, 600);
  cnv.parent("canvas");
  // Create the video
  video = createCapture(VIDEO);
  video.size(800, 600);
  video.hide();

  input = createInput();
  input.size(width);
  input.parent("myquestion");

  flippedVideo = ml5.flipImage(video);

 
  //----------------- Saying Words gesture ---------------
 w = width + 1000;
 dx = (TWO_PI / period) * xspacing;
 yvalues = new Array(floor(w / xspacing));
 //-------------------------------------------------------
 

  // Start classifying
  classifyVideo();
}

function draw() {
  background(0);
  // Draw the video
  image(flippedVideo, 0, 0);

  if (label == "words") {
    sentence = input.value()
    sentenceArray = sentence.split("");
    calcWave();
    renderWave();

  } else if (label == "ok"){
    fill(0, 255, 0);
    textSize(80);
    textAlign(CENTER);
    text("OK!", width / 2, 90);
  } else if (label == "no"){
    fill(255, 0, 0);
    textSize(80);
    textAlign(CENTER);
    text("NO...", width / 2 + 20, 90);
  } else if (label == "raise"){
    fill(255, 255, 0);
    textSize(60);
    textAlign(CENTER);
    textStyle(BOLD);
    text("I have something to say", width / 2, 70);
  } 
  
  // Draw the label
  // fill(255);
  // textSize(16);
  // textAlign(CENTER);
  // text(label, width / 2, height - 4);
}

// Get a prediction for the current video frame
function classifyVideo() {
  flippedVideo = ml5.flipImage(video)
  classifier.classify(flippedVideo, gotResult);
  flippedVideo.remove();

}

// When we get a result
function gotResult(error, results) {
  // If there is an error
  if (error) {
    console.error(error);
    return;
  }

  // The results are in an array ordered by confidence.
  // console.log(results[0]);
  label = results[0].label;
  // Classifiy again!
  classifyVideo();
}


//----------------- Saying Words gestures -----------------------
function calcWave() {
  // Increment theta (try different values for
  // 'angular velocity' here)
  theta += 0.10;

  // For every x value, calculate a y value with sine function
  let x = theta;
  for (let i = 0; i < yvalues.length; i++) {
    yvalues[i] = cos(x) * amplitude;
    x += dx;
  }
  if (m > width){
    m = -sentenceArray.length * xspacing;
  } else {
    m += 3;
  }
}

function renderWave() {
  noStroke();
  fill(255);
  // A simple way to draw the wave with an ellipse at each location
  for (let x = 0; x < sentenceArray.length; x++) {
    //ellipse(x * xspacing, height / 2 + yvalues[x], 16, 16);
    textSize(50);
    textFont('Helvetica');
    textStyle(BOLD);
    fill(random(255), random(255), random(255));
    text(sentenceArray[x],x * xspacing+m, height / 2 + yvalues[x]);
  }
}
//----------------------------------------------------------------