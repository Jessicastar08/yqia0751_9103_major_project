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

// ---- 夜空图（目标颜色，用来从橙→蓝渐变）----
let nightSkyImg;

// ---- 天色渐变相关（和粒子那段同一个思路）----
let skyColorRate = 0; // 0 = 白天原色，1 = 完全夜空色

// couple 数值
let coupleStartX_raw = 380;  // 起点 X
let coupleStartY_raw = 520;  // 起点 Y

let coupleEndX_raw = 1600;  // 终点 X
let coupleEndY_raw = 1460;  // 终点 Y

// 实际在当前画布上绘制用的坐标
let coupleStartX, coupleStartY;
let coupleEndX, coupleEndY;

// 动画参数
let coupleProgress = 0;
// How long the couple takes to walk from start to end
// Walking speed control, at 60 FPS, 480 frames = 8 seconds. 
let coupleDuration = 360;  
let coupleStartScale = 0.6; // 远处的大小
let coupleEndScale   = 1.8; // 靠近时的大小


// Preload all the assets
function preload() {

  baseImg = loadImage('assets/BG2.png');  

  layerImgs[0] = loadImage('assets/red.png');
  layerImgs[1] = loadImage('assets/blue.png');
  layerImgs[2] = loadImage('assets/green.png');
  layerImgs[3] = loadImage('assets/bridge.png');
  layerImgs[4] = loadImage('assets/scream.png');
  layerImgs[5] = loadImage('assets/couple.png');

  nightSkyImg = loadImage('assets/night sky.png');
}

function setup() {
  // Make canvas the size of the browser window
  createCanvas(windowWidth, windowHeight);
  imgDrwPrps.aspect = baseImg.width / baseImg.height; 

  calculateImageDrawProps();

  // 把夜空图缩放到和 red.png 一样大，方便按网格取色
  nightSkyImg.resize(layerImgs[0].width, layerImgs[0].height);

  // For each layer image, create its segments
  for (let i = 0; i < 6; i++) {
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

  // 根据当前图片尺寸，更新 couple 的起点终点坐标
  updateCouplePositions();
}

function draw() {
   background(0);

   // 这一圈内部的帧数（0 ~ coupleDuration-1）
   let loopFrame  = frameCount % coupleDuration;
  // 情侣在当前这圈里的进度：0 → 1
   let progressInLoop = loopFrame / coupleDuration;

  // 更新情侣位置
  coupleProgress = progressInLoop;

  // ★ 当前是第几圈（0,1,2,3,…）
  let loopIndex = floor(frameCount / coupleDuration);

   // 用情侣的进度控制颜色：
  // t = 0   → skyColorRate = 0   （橙）
  // t = 1   → skyColorRate = 1   （最蓝）
  // 下一圈重新开始时，coupleProgress 又变 0 → skyColorRate 也回到 0（橙）
  let t = progressInLoop;

  if (loopIndex % 2 === 0) {
    // 第 0、2、4...圈：白天 → 夜晚
    skyColorRate = t;
  } else {
    // 第 1、3、5...圈：夜晚 → 白天
    skyColorRate = 1 - t;
  }
  // First draw the full base image
   image(
    baseImg,
    imgDrwPrps.xOffset,
    imgDrwPrps.yOffset,
    imgDrwPrps.width,
    imgDrwPrps.height
  );

    // Then draw all segment layers with animation
    for (let i = 0; i < layerSegments.length; i++) {
     if (i === 5) continue; // 5 是 couple 图层，先跳过

     const segArray = layerSegments[i];
      for (const segment of segArray) {
        segment.animate();
        segment.draw();
      }
    }

    drawCoupleImage();
}
  
function updateCouplePositions() {

  // 计算图片在真实画布中的缩放比例
  let scaleX = imgDrwPrps.width  / baseImg.width;
  let scaleY = imgDrwPrps.height / baseImg.height;

  // 用 raw 像素坐标，在缩放后重新定位
  coupleStartX = imgDrwPrps.xOffset + coupleStartX_raw * scaleX;
  coupleStartY = imgDrwPrps.yOffset + coupleStartY_raw * scaleY;

  coupleEndX   = imgDrwPrps.xOffset + coupleEndX_raw * scaleX;
  coupleEndY   = imgDrwPrps.yOffset + coupleEndY_raw * scaleY;
}


function drawCoupleImage() {
  // 位置插值
  let x = lerp(coupleStartX, coupleEndX, coupleProgress);
  let y = lerp(coupleStartY, coupleEndY, coupleProgress);

  // 大小插值（远处小，走近变大）
  let s = lerp(coupleStartScale, coupleEndScale, coupleProgress);

  push();
  translate(x, y);
  scale(s);
  imageMode(CENTER);
  image(layerImgs[5], 0, 0, layerImgs[5].width, layerImgs[5].height);
  imageMode(CORNER); // 防止影响别的地方
  pop();
}

function windowResized() {
  // Resize the canvas to the new window size
  resizeCanvas(windowWidth, windowHeight);

  calculateImageDrawProps();
    if (nightSkyImg && layerImgs[0]) {
    nightSkyImg.resize(layerImgs[0].width, layerImgs[0].height);
  }
  
  for (const segArray of layerSegments) {
    for (const segment of segArray) {
      segment.calculateSegDrawProps();
    }
  }

  updateCouplePositions();
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
  else {
  
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
    this.dayColour = color(srcImgSegColourInPrm);
    this.srcImgSegColour = this.dayColour;
    this.baseAlpha = alpha(this.dayColour);  // ⭐ 记住透明度
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
    this.currentX = this.drawXPos;
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
      // 天空：有波浪 + 颜色渐变
      let wavelength = 24.0;
      let k = TWO_PI / wavelength;    
      let speed = 0.8;   
      let amplitude = this.drawHeight * 0.7;  

      let phase = k * this.rowPosition - speed * t;
      let waveOffsetY = sin(phase) * amplitude;

      this.currentX = this.drawXPos;
      this.currentY = this.drawYPos + waveOffsetY;

      let segW = layerImgs[0].width  / numSegments;
  let segH = layerImgs[0].height / numSegments;
  let sampleX = (this.rowPosition + 0.5) * segW;
  let sampleY = (this.columnPosition + 0.5) * segH;

  // 从 nightSkyImg 取对应位置的颜色
  let nightCol = nightSkyImg.get(sampleX, sampleY);

  let startCol  = this.dayColour;  // red.png 的原本橙色
  // 目标色：night sky 的 RGB + 原来的 alpha
  let targetCol = color(
    red(nightCol),
    green(nightCol),
    blue(nightCol),
    this.baseAlpha
  );

  // 按 skyColorRate 在两张图之间渐变
  this.srcImgSegColour = lerpColor(startCol, targetCol, skyColorRate);

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

  if (this.layerIndex === 4) {
      let amp = this.drawWidth * 0.40;
      let t = millis() * 0.0025;

  // 用 sin/cos 做平滑抖动 
      let offsetX = sin(t + this.rowPosition * 0.35) * amp;

      let offsetY = cos(t * 1.8 + this.rowPosition * 0.2) * amp;

      this.currentX = this.drawXPos + offsetX;
      this.currentY = this.drawYPos + offsetY;

    return; // 不执行其他层
  }
}

  // Draws out small line in the centre of each segment, using the correct angle and the animated position.
  draw() {
    if (this.baseAlpha === 0) return;

    if (this.layerIndex === 0) {
    strokeWeight(8);   // ⭐ 你想要的粗细（6 或 8 或 10）
    } else {
    strokeWeight(3);   // 其他层保持原来粗细
    }

    stroke(this.srcImgSegColour);

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