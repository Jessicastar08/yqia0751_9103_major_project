let baseImg; 

let layerImgs = []; 

let layerSegments = [];

let layerAngles = [-10, 0, 90, 0, 90,90];

let numSegments = 90;

let imgDrwPrps = {aspect: 0, width: 0, height: 0, xOffset: 0, yOffset: 0};

let canvasAspectRatio = 0;

function preload() {

  baseImg = loadImage('assets/Edvard_Munch_The_Scream (3).jpeg');  

  layerImgs[0] = loadImage('assets/red.png');
  layerImgs[1] = loadImage('assets/blue.png');
  layerImgs[2] = loadImage('assets/green.png');
  layerImgs[3] = loadImage('assets/bridge.png');
  layerImgs[4] = loadImage('assets/scream.png');
  layerImgs[5] = loadImage('assets/couple.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imgDrwPrps.aspect = baseImg.width / baseImg.height; 
  calculateImageDrawProps();
  for (let i = 0; i < layerImgs.length; i++) {
    let segArray = [];                         
    createSegmentsFromImage(layerImgs[i], segArray, i);
    layerSegments.push(segArray);              
  }

  for (const segArray of layerSegments) {
    for (const segment of segArray) {
      segment.calculateSegDrawProps();
    }
  }
}

function draw() {
   background(0);


  image(
    baseImg,
    imgDrwPrps.xOffset,
    imgDrwPrps.yOffset,
    imgDrwPrps.width,
    imgDrwPrps.height
  );

  
 
    for (const segArray of layerSegments) {
    for (const segment of segArray) {
      segment.update();
      segment.draw();
    }
  }
} 


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateImageDrawProps();
  for (const segArray of layerSegments) {
    for (const segment of segArray) {
      segment.calculateSegDrawProps();
    }
  }
}

function createSegmentsFromImage(srcImg, targetArray, layerIndex) {
  let segmentWidth = srcImg.width / numSegments;
  let segmentHeight = srcImg.height / numSegments;

  let positionInColumn = 0;
  for (let segYPos = 0; segYPos < srcImg.height; segYPos += segmentHeight) {
    let positionInRow = 0;
    for (let segXPos = 0; segXPos < srcImg.width; segXPos += segmentWidth) {

      let segmentColour = srcImg.get(
        segXPos + segmentWidth / 2,
        segYPos + segmentHeight / 2
      );

      let angleForThisLayer = layerAngles[layerIndex];

      let segment = new ImageSegment(
        positionInColumn,
        positionInRow,
        segmentColour,
        angleForThisLayer,
        layerIndex 
      );

      
      targetArray.push(segment);

      positionInRow++;
    }
    positionInColumn++;
  }
}

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

class ImageSegment {

  constructor(
    columnPositionInPrm,
    rowPostionInPrm,
    srcImgSegColourInPrm,
    angleInPrm,
    layerIndexInPrm  
  ) {
    this.columnPosition = columnPositionInPrm;
    this.rowPostion = rowPostionInPrm;
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

  calculateSegDrawProps() {
    this.drawWidth = imgDrwPrps.width / numSegments;
    this.drawHeight = imgDrwPrps.height / numSegments;
    
    
    this.drawXPos = this.rowPostion * this.drawWidth + imgDrwPrps.xOffset;
    this.drawYPos = this.columnPosition * this.drawHeight + imgDrwPrps.yOffset;

    this.currentY = this.drawYPos;
  }

  update() {
  let t = millis() / 1000.0;

  this.currentX = this.drawXPos;
  this.currentY = this.drawYPos;


    if (this.layerIndex === 0) {
  
      let wavelength = 24.0;
      let k = TWO_PI / wavelength;    

      let speed = 0.8;                 
      let amplitude = this.drawHeight * 0.7;  


      let phase = k * this.rowPostion - speed * t;

      let waveOffsetY = sin(phase) * amplitude;

      this.currentX = this.drawXPos;
      this.currentY = this.drawYPos + waveOffsetY;
      return; 
    }


  if (this.layerIndex === 2) {
    let speed = 2.5;              
    let amplitude = this.drawHeight;

    let waveOffset = sin(
      t * speed + this.rowPostion * 0.3 + this.phase
    ) * amplitude;

    this.currentY = this.drawYPos + waveOffset;
  }


  if (this.layerIndex === 1) {
    let speed = 3.0;
    let amplitude = this.drawWidth;

    let waveOffset = sin(
      t * speed + this.columnPosition * 0.3 + this.phase
    ) * amplitude;

    this.currentX = this.drawXPos + waveOffset;
    this.currentY = this.drawYPos;
  }

  
}

    draw() {
    stroke(this.srcImgSegColour);
    strokeWeight(3);

    let cx = this.currentX + this.drawWidth / 2;
    let cy = this.currentY + this.drawHeight / 2;

    let halfLen = min(this.drawWidth, this.drawHeight) * 0.5;
    let rad = this.angle * PI / 180;

    let dx = cos(rad) * halfLen;
    let dy = sin(rad) * halfLen;

    let x1 = cx - dx;
    let y1 = cy - dy;
    let x2 = cx + dx;
    let y2 = cy + dy;

    line(x1, y1, x2, y2);
  }
}