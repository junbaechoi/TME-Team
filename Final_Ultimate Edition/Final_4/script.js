var streams = [];
var fadeInterval = 1.6;
var symbolSize = 14;
//tony=======================================================================================================
var tonys = [];
var flow;
var path;
//yuxuan=====================================================================================================
var gif_loadImg, gif_createImg;

var particles = [];
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
  gif_loadImg = loadImage('003 popo cat.gif');
  gif_createImg = createImg('003 popo cat.gif');
  //gif_loadImg = loadImage("003 popo cat.gif");
  //gif_createImg = createImg("003 popo cat.gif");

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
//--------------------------------------------------------TW
  var x = 0;
  for (var i = 0; i <= width / symbolSize; i++) {
    var stream = new Stream();
    stream.generateSymbols(x, random(-2000, 0));
    streams.push(stream);
    x += symbolSize
  }

  textFont('Consolas');
  textSize(symbolSize);
//--------------------------------------------------------TW
 
  //----------------- Saying Words gesture ---------------
 w = width + 1000;
 dx = (TWO_PI / period) * xspacing;
 yvalues = new Array(floor(w / xspacing));
 //-------------------------------------------------------
 

  // Start classifying
  classifyVideo();
  //tony===========================================================================================
  tonys = (new Array(150)).fill(0).map(d => new Tony(random(width), random(height)));
    flow = new FlowField(250);
    path = new Path();
}
function Tony(x, y) {
  this.acc = createVector(0, 0);
  this.vel = createVector(0, 0);
  this.pos = createVector(x, y);
  this.mass = random(1, 4);
  this.maxSpeed = 4;
  this.maxForce = 0.2;
  this.theta;
  this.wandertheta = 0;
}

Tony.prototype.seek = function(target) {
  var desired = p5.Vector.sub(target, this.pos);

  var d = desired.mag();
  if (d < 100) {
      var m = map(d, 0, 100, 0, this.maxSpeed);
      desired.setMag(m);
  } else {
      desired.setMag(this.maxSpeed);
  }

  var steering = p5.Vector.sub(desired, this.vel);
  steering.limit(this.maxForce);

  this.applyForce(steering);
};

Tony.prototype.wander = function() {
  var wanderR = 25;
  var wanderD = 80;
  var change = 0.3;
  this.wandertheta += random(-change, change);

  // Now we have to calculate the new position to steer towards on the wander circle
  var circleloc = this.vel.copy();
  circleloc.setMag(wanderD);
  circleloc.add(this.pos);

  var h = this.vel.heading();

  // var circleOffSet = createVector(
  //     wanderR * Math.cos(this.wandertheta + h),
  //     wanderR * Math.sin(this.wandertheta + h)
  // );
  var target = p5.Vector.add(circleloc, circleOffSet);
  this.seek(target);
};

Tony.prototype.stepAside = function(target) {
  var desired = p5.Vector.sub(target, this.pos);
  var d = desired.mag();

  if (d < 200) {
      var m = map(d, 0, 200, 200, 0);
      desired.setMag(m);
  } else {
      desired.setMag(0);
  }
  this.seek(p5.Vector.sub(this.pos, desired));
};

Tony.prototype.flee = function(target, distance) {
  var predict = this.vel.copy();
  predict.setMag(distance);
  var predictLoc = p5.Vector.add(this.pos, predict);

  var desired = p5.Vector.sub(target, this.pos);
  var d = desired.magSq();

  if (d < distance * distance) {
      desired.limit(this.maxSpeed);
      desired.mult(-1);

      var steering = p5.Vector.sub(desired, this.vel);
      steering.limit(map(d, 0, distance * distance, this.maxForce * 4, 0));

      this.applyForce(steering);
  }
};

Tony.prototype.separate = function(tonys) {
  var desiredSeparation = 20,
      sum = createVector(0, 0),
      count = 0;

  for (var a in tonys) {
      a = tonys[a];
      var d = p5.Vector.dist(this.pos, a.pos);
      if (d > 0 && d < desiredSeparation) {
          var diff = p5.Vector.sub(this.pos, a.pos);
          diff.normalize();

          sum.add(diff);
          count++;
      }
  }

  if (count > 0) {
      sum.div(count);
      sum.setMag(this.maxSpeed);

      var steer = p5.Vector.sub(sum, this.vel);
      steer.limit(this.maxForce * 2);
      this.applyForce(steer);
  }

};

Tony.prototype.followField = function(field) {
  var desired = field.lookup(this.pos);
  desired.mult(this.maxSpeed);

  var steer = p5.Vector.sub(desired, this.vel);
  steer.limit(this.maxForce);
  this.applyForce(steer);
};

Tony.prototype.getNormalPt = function(a, b, predictLoc) {
  var ap = p5.Vector.sub(predictLoc, a);
  var ab = p5.Vector.sub(b, a);
  ab.normalize();
  ab.mult(ap.dot(ab));
  return p5.Vector.add(a, ab);
};

Tony.prototype.followPath = function(path) {
  var predict = this.vel.copy();
  predict.setMag(50);
  var predictLoc = p5.Vector.add(this.pos, predict);

  var target = null;
  var maxi = Infinity;
  for (var i = 0; i < path.pts.length - 1; i++) {
      var a = path.pts[i].copy();
      var b = path.pts[i + 1].copy();
      var normalPt = this.getNormalPt(a, b, predictLoc);

      if (lineLineIntersect(
              a, b,
              this.pos, p5.Vector.add(this.pos, p5.Vector.sub(normalPt, this.pos).mult(500))
          )) {
          var distance = p5.Vector.dist(predictLoc, normalPt);
          if (distance < maxi) {
              maxi = distance;
              target = p5.Vector.add(normalPt, p5.Vector.sub(b, a).setMag(50));
          }
      }
  }
  if (target !== null) {
      // fill(255);
      // ellipse(target.x,target.y,5,5);
      this.seek(target);
  } else {
      this.applyForce(createVector(0.01, 0));
  }
};

Tony.prototype.warp = function() {
  if (this.pos.x < 0 || this.pos.x > width) {
      this.pos.x = (width + this.pos.x) % width;
  }
  if (this.pos.y < 0 || this.pos.y > height) {
      this.pos.y = (height + this.pos.y) % height;
  }
};

Tony.prototype.border = function() {
  // Stay within walls
  var desired = this.vel.copy();
  var margin = 50;

  noFill();
  noStroke();
  rect(margin, margin, width - 2 * margin, height - 2 * margin);

  if (this.pos.x < margin) {
      desired.x = this.maxSpeed;
  } else if (this.pos.x > width - margin) {
      desired.x = -this.maxSpeed;
  }

  if (this.pos.y < margin) {
      desired.y = this.maxSpeed;
  } else if (this.pos.y > height - margin) {
      desired.y = -this.maxSpeed;
  }

  if (desired.x != this.vel.x || desired.y != this.vel.y) {
      desired.setMag(this.maxSpeed);

      var steer = p5.Vector.sub(desired, this.vel);
      steer.limit(this.maxForce * 4);
      this.applyForce(steer);
  }
};

Tony.prototype.applyForce = function(force) {
  var f = force.copy();
  f.div(this.mass);
  this.acc.add(f);
};

Tony.prototype.update = function() {
  this.vel.add(this.acc);
  this.vel.limit(this.maxSpeed);
  this.pos.add(this.vel);

  // this.vel.mult(.99);

  // reset acceleration
  this.acc.set(0, 0);
};

Tony.prototype.display = function() {
  if (this.vel.mag() > 0) this.theta = this.vel.heading();

  push();
  translate(this.pos.x, this.pos.y);
  rotate(this.theta);
  noStroke();
  fill('#FB3550');
  triangle(-10, -5, -10, 5, 10, 0);
  pop();
};


function FlowField(r) {
  this.resolution = r;
  this.cols = Math.ceil(width / r);
  this.rows = Math.ceil(height / r);
  this.init(0);
}

FlowField.prototype.init = function(t) {
  this.field = [];
  var xoff = 0;
  for (var i = 0; i < this.cols; i++) {
      var yoff = 0;
      var tmp = [];
      for (var j = 0; j < this.rows; j++) {
          var theta = map(noise(xoff, yoff, t), 0, 1, 0, 2 * TWO_PI);
          // var theta = int(random(4))*PI/2;
          tmp.push(createVector(Math.cos(theta), Math.sin(theta)));
          yoff += 0.05;
      }
      this.field.push(tmp);
      xoff += 0.05;
  }
};

FlowField.prototype.lookup = function(pos) {
  var column = Math.floor(constrain(pos.x / this.resolution, 0, this.cols - 1));
  var row = Math.floor(constrain(pos.y / this.resolution, 0, this.rows - 1));
  return this.field[column][row].copy();
};


function Path() {
  this.radius = 20;
  this.pts = [];
  this.pts.push(createVector(0,600))
  //this.pts.push(createVector(0,0))
  this.pts.push(createVector(400,300))
  this.pts.push(createVector(800,600))
  //this.pts.push(createVector(0,600))
  


  
  this.pts.push(createVector(800,0))
  //this.pts.push(createVector(600,800))
  this.pts.push(createVector(400,300))
  this.pts.push(createVector(0,0))

  // for (var i = 0; i <= 8; i++) {
  //     this.pts.push(
  //         createVector(
  //             width / 2 + cos(TWO_PI / 8 * i) * width / 3,
  //             height / 2 + sin(TWO_PI / 8 * i) * width / 3
  //         )
  //     );
  // }
}

Path.prototype.display = function() {
  strokeWeight(0);
  stroke(0, 100);
  strokeJoin(ROUND);
  noFill();
  beginShape();
  for (var i in this.pts) {
      vertex(this.pts[i].x, this.pts[i].y);
  }
  endShape();
  strokeWeight(1);
};


function lineLineIntersect(p1, p2, p3, p4) {
  var over = false;
  var a1 = p2.y - p1.y;
  var b1 = p1.x - p2.x;
  var c1 = a1 * p1.x + b1 * p1.y;

  var a2 = p4.y - p3.y;
  var b2 = p3.x - p4.x;
  var c2 = a2 * p3.x + b2 * p3.y;

  var det = a1 * b2 - a2 * b1;
  if (det == 0) {
      // Lines are parallel
  } else {
      var x = (b2 * c1 - b1 * c2) / det;
      var y = (a1 * c2 - a2 * c1) / det;
      if (x > min(p1.x, p2.x) && x < max(p1.x, p2.x) &&
          x > min(p3.x, p4.x) && x < max(p3.x, p4.x) &&
          y > min(p1.y, p2.y) && y < max(p1.y, p2.y) &&
          y > min(p3.y, p4.y) && y < max(p3.y, p4.y)) {
          over = true;
      }
  }
  return over;
}

function Symbol(x, y, speed, first, opacity) {
  this.x = x;
  this.y = y;
  this.value;

  this.speed = speed;
  this.first = first;
  this.opacity = opacity;

  this.switchInterval = round(random(2, 25));

  this.setToRandomSymbol = function() {
    var charType = round(random(0, 5));
    if (frameCount % this.switchInterval == 0) {
      if (charType > 1) {
        // set it to Katakana
        this.value = String.fromCharCode(
          0x30A0 + floor(random(0, 97))
        );
      } else {
        // set it to numeric
        this.value = floor(random(0,10));
      }
    }
  }

  this.rain = function() {
    this.y = (this.y >= height) ? 0 : this.y += this.speed;
  }

}

function Stream() {
  this.symbols = [];
  this.totalSymbols = round(random(5, 35));
  this.speed = random(5, 22);

  this.generateSymbols = function(x, y) {
    var opacity = 255;
    var first = round(random(0, 4)) == 1;
    for (var i =0; i <= this.totalSymbols; i++) {
      symbol = new Symbol(
        x,
        y,
        this.speed,
        first,
        opacity
      );
      symbol.setToRandomSymbol();
      this.symbols.push(symbol);
      opacity -= (255 / this.totalSymbols) / fadeInterval;
      y -= symbolSize;
      first = false;
    }
  }

  this.render = function() {
    this.symbols.forEach(function(symbol) {
      if (symbol.first) {
        fill(140, 255, 170, symbol.opacity);
      } else {
        fill(0, 255, 70, symbol.opacity);
      }
      text(symbol.value, symbol.x, symbol.y);
      symbol.rain();
      symbol.setToRandomSymbol();
    });
  }
}
//yuxuan======================================================================================================

function Particle(_loc) {

  var loc = _loc.copy();
  var vel = createVector(random(5, 1), random(-6, 1.5));
  var acc = createVector(0, 0.0001);
  var lifespan = 160;
  var h = random(360);
  var sz = random(25, 50);
  


  // Method to update location
  this.update = function() {
      vel.add(acc);
      loc.add(vel);
      lifespan -= 0.8;
  }

  // Method to display
  this.paint = function() {
      stroke(h, 90, 90, lifespan);
      strokeWeight(2);
      fill(h, 10, 90, lifespan);
      ellipse(loc.x, loc.y, sz, sz);
  }

  // Is the particle still useful?
  this.isDead = function() {
      if (lifespan < 0.0) {
          return true;
      } else {
          return false;
      }
  }
}
this.showGif = function () {
  gif_createImg.show();
  gif_createImg.position(160, 690);
};
this.hideGif = function () {
  gif_createImg.hide();
};
function draw() {
  background(0);
  // Draw the video
  hideGif();
  image(flippedVideo, 0, 0);

  if (label == "words") {
    hideGif();
    sentence = input.value()
    sentenceArray = sentence.split("");
    calcWave();
    renderWave();

  } else if (label == 'ok') {
    hideGif();
    textSize(symbolSize);
    streams.forEach(function (stream) {
      stream.render();
    });
  } else if (label == "no"){
    hideGif();
    fill(255, 0, 0);
    textSize(80);
    textAlign(CENTER);
    text("NO", width / 2 + 20, 90);
    
    path.display();

    flow.init(frameCount / 200);

    var target = createVector(mouseX, mouseY);

    tonys.forEach(tony => {
        // tony.flee(target, 150);
        // tony.followField(flow);
        tony.followPath(path);
        tony.separate(tonys);
        tony.warp();
        tony.update();
        tony.display();
    });
  } else if (label == "raise"){
    showGif();
    fill(255, 255, 0);
    textSize(60);
    textAlign(CENTER);
    textStyle(BOLD);
    text("I have something to say", width / 2, 70);
    //gif_createImg.position(160, 690);
    //image(gif_loadImg, 150, 380)

    particles.push(new Particle(createVector(width / 2, 400)));

    for (var i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].paint();
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }
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
//--------------------------------------------------------TW

//--------------------------------------------------------TW


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