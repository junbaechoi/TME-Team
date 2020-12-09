// Classifier Variable
let classifier;
// Model URL
let imageModelURL = 'https://teachablemachine.withgoogle.com/models/fN7eaHqzB/';


// Video
let video;
let input;
let flippedVideo;
// To store the classification
let label = "";

// Load the model first
function preload() {
  classifier = ml5.imageClassifier(imageModelURL + 'model.json');
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
  // Start classifying
  classifyVideo();
}

function draw() {
  background(0);
  // Draw the video
  image(flippedVideo, 0, 0);

  if (label == "words") {
    fill(255);
    textSize(40);
    textAlign(LEFT);
    text(input.value(), width / 4, height / 2);
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
  fill(255);
  textSize(16);
  textAlign(CENTER);
  text(label, width / 2, height - 4);
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