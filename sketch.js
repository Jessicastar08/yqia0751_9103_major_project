// Base image
let baseImg; 

// Array of layer images
let layerImgs = []; 
let layerSegments = [];

// Angles for each layer's line
let layerAngles = [-10, 0, 90, 0, 90,90];
let numSegments = 90;

// Store the scaled size and position of the image so it always fits the canvas properly
let imgDrwPrps = {aspect: 0, width: 0, height: 0, xOffset: 0, yOffset: 0};
let canvasAspectRatio = 0;

// Preload all the assets
function preload() {

  baseImg = loadImage('assets/Edvard_Munch_The_Scream.jpeg');  

  layerImgs[0] = loadImage('assets/firesky.png');
  layerImgs[1] = loadImage('assets/bluesky.png');
  layerImgs[2] = loadImage('assets/greensky.png');
  layerImgs[3] = loadImage('assets/bridge.png');
  layerImgs[4] = loadImage('assets/screamer.png');
  layerImgs[5] = loadImage('assets/couple.png');
}

function setup() {
  // Make canvas the size of the browser window
  createCanvas(windowWidth, windowHeight);
  imgDrwPrps.aspect = baseImg.width / baseImg.height; 

  calculateImageDrawProps();
  // For each layer image, create its segments
  for (let i = 0; i < layerImgs.length; i++) {
    let segArray = [];                         
    createSegmentsFromImage(layerImgs[i], segArray, i);
    layerSegments.push(segArray);              
  }

  // Compute where each segment should be drawn
  for (const segArray of layerSegments) {
    for (const segment of segArray) {
      segment.calculateSegDrawProps();
    }
  }
}

function draw() {
   background(0);

  // First draw the full base image
   image(
    baseImg,
    imgDrwPrps.xOffset,
    imgDrwPrps.yOffset,
    imgDrwPrps.width,
    imgDrwPrps.height
  );

    // Then draw all segment layers with animation
    for (const segArray of layerSegments) {
      for (const segment of segArray) {
        segment.animate();
      segment.draw();
      }
    }
} 

function windowResized() {
  // Resize the canvas to the new window size
  resizeCanvas(windowWidth, windowHeight);

  calculateImageDrawProps();
  for (const segArray of layerSegments) {
    for (const segment of segArray) {
      segment.calculateSegDrawProps();
    }
  }
}

// Split an image into many segments
function createSegmentsFromImage(srcImg, targetArray, layerIndex) {
  let segmentWidth = srcImg.width / numSegments;
  let segmentHeight = srcImg.height / numSegments;

  // We use nested loops to scan the image:
  let positionInColumn = 0;
  for (let segYPos = 0; segYPos < srcImg.height; segYPos += segmentHeight) {
    let positionInRow = 0;
    for (let segXPos = 0; segXPos < srcImg.width; segXPos += segmentWidth) {

      // Pick the colour at the center of this grid
      let segmentColour = srcImg.get(
        segXPos + segmentWidth / 2,
        segYPos + segmentHeight / 2
      );

      // Choose the line angle for this layer based on layerIndex
      let angleForThisLayer = layerAngles[layerIndex];

      let segment = new ImageSegment(
        positionInColumn,
        positionInRow,
        segmentColour,
        angleForThisLayer,
        layerIndex 
      );

      // Push this segment into the target array for this layer
      targetArray.push(segment);

      // Move to the next column in this row
      positionInRow++;
    }
    // Move to the next row after finishing this row
    positionInColumn++;
  }
}

// calculates how image should be scaled and positioned on the canvas
function calculateImageDrawProps() {
  
  canvasAspectRatio = width / height;
  
  if (imgDrwPrps.aspect > canvasAspectRatio) {
    
    imgDrwPrps.width = width;
   
    imgDrwPrps.height = width / imgDrwPrps.aspect;
    imgDrwPrps.yOffset = (height - imgDrwPrps.height) / 2;
    imgDrwPrps.xOffset = 0;
  } else if (imgDrwPrps.aspect < canvasAspectRatio) {
   
    imgDrwPrps.height = height;
  
    imgDrwPrps.width = height * imgDrwPrps.aspect;
    imgDrwPrps.xOffset = (width - imgDrwPrps.width) / 2;
    imgDrwPrps.yOffset = 0;
  }
  else if (imgDrwPrps.aspect == canvasAspectRatio) {
  
    imgDrwPrps.width = width;
    imgDrwPrps.height = height;
    imgDrwPrps.xOffset = 0;
    imgDrwPrps.yOffset = 0;
  }
}

// This constructor stores the grid position, colour, angle, and layer information
class ImageSegment {

  constructor(
    columnPositionInPrm,
    rowPositionInPrm,
    srcImgSegColourInPrm,
    angleInPrm,
    layerIndexInPrm  
  ) {
    this.columnPosition = columnPositionInPrm;
    this.rowPosition = rowPositionInPrm;
    this.srcImgSegColour = srcImgSegColourInPrm;
    this.angle = angleInPrm;
    this.layerIndex = layerIndexInPrm;

    this.drawXPos = 0;
    this.drawYPos = 0;
    this.drawWidth = 0;
    this.drawHeight = 0;
    this.currentY = 0;
    this.phase = random(TWO_PI);
  }

  // This function figures out each segment’s size and where it should go on the canvas
  calculateSegDrawProps() {
    this.drawWidth = imgDrwPrps.width / numSegments;
    this.drawHeight = imgDrwPrps.height / numSegments;
    
    
    this.drawXPos = this.rowPosition * this.drawWidth + imgDrwPrps.xOffset;
    this.drawYPos = this.columnPosition * this.drawHeight + imgDrwPrps.yOffset;

    // Called once during setup or when the window is resized
    this.currentY = this.drawYPos;
  }

  animate() {

  // We noticed that different computers draw frames at different speeds, so we use real time (millis) to keep the animation moving at a consistent speed on all devices
  let t = millis() / 1000.0;

  // Start each frame from the original position
  this.currentX = this.drawXPos;
  this.currentY = this.drawYPos;

  // Layer 0 moves up and down like a smooth wave so the sunset sky looks alive instead of flat
    if (this.layerIndex === 0) {
  
      // Controls how wide each wave is
      let wavelength = 24.0;
      let k = TWO_PI / wavelength;    

      // How fast it is moving
      let speed = 0.8;   

      // How high the wave moves up/down
      let amplitude = this.drawHeight * 0.7;  
      let phase = k * this.rowPosition - speed * t;
      let waveOffsetY = sin(phase) * amplitude;

      // X stays still, Y moves up and down
      this.currentX = this.drawXPos;
      this.currentY = this.drawYPos + waveOffsetY;
      return; 
    }

  // Layer 2 move up and down using vertical lines
  if (this.layerIndex === 2) {
    // how fast the segments move
    let speed = 2.5;   
    // how far the vertical line moves       
    let amplitude = this.drawHeight;

    // Makes the whole layer move continuously over time
    let waveOffset = sin(
      t * speed + this.rowPosition * 0.3 + this.phase
    ) * amplitude;

    // Only the Y moves，X stays fixed
    this.currentY = this.drawYPos + waveOffset;
  }

  // Layer 1 moves left and right like flowing water
  if (this.layerIndex === 1) {
    // how fast the segments move
    let speed = 3.0;
    // how far the horizontal line moves 
    let amplitude = this.drawWidth;

    let waveOffset = sin(
      t * speed + this.columnPosition * 0.3 + this.phase
    ) * amplitude;

    // Only X moves, Y stays fixed
    this.currentX = this.drawXPos + waveOffset;
    this.currentY = this.drawYPos;
  }
}

  // Draws out small line in the centre of each segment, using the correct angle and the animated position.
  draw() {
    stroke(this.srcImgSegColour);
    strokeWeight(3);

    // Find the centre of the segment
    let cx = this.currentX + this.drawWidth / 2;
    let cy = this.currentY + this.drawHeight / 2;

    // Decide how long the line should be
    let halfLen = min(this.drawWidth, this.drawHeight) * 0.5;
    let rad = this.angle * PI / 180;

    // Calculate direction
    let dx = cos(rad) * halfLen;
    let dy = sin(rad) * halfLen;

    // Calculate two endpoints of the line
    let x1 = cx - dx;
    let y1 = cy - dy;
    let x2 = cx + dx;
    let y2 = cy + dy;

    // Draw the line
    line(x1, y1, x2, y2);
  }
}