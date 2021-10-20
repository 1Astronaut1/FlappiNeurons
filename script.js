var cvs = document.getElementById("canvas");
var ctx = cvs.getContext("2d");

var bird = new Image();
var bg = new Image();
var fg = new Image();
var pipeUp = new Image();
var pipeBottom = new Image();

function sigmoid(x) {
   return 1/(1+Math.pow(Math.E,-x));
}
function randomFloat(min, max) {
   let rand = min + Math.random() * (max + 1 - min);
   return Math.floor(rand) + Math.random();
 }
 function randomInt(min, max) {
   let rand = min + Math.random() * (max + 1 - min);
   return Math.floor(rand);
 }
function makeAI(layers, minWeight, maxWeight)
{
   let a = [];
   for (let i = 0; i < layers.length-1; i++) {
      let b = [];
      for (let o = 0; o < layers[i]; o++) {
         let c = [];
         for (let p = 0; p < layers[i+1]; p++) {
            c.push(randomFloat(minWeight, maxWeight));
         }
         b.push(c);
      }
      a.push(b);
   }
   return a;
}
function randomizeAI(weights)
{
   for (let i = 0; i < weights.length; i++) {
      for (let o = 0; o < weights[i].length; o++) {
         for (let p = 0; p < weights[i][o].length; p++) {
            if(Math.random() >= 0.5)
            {
               weights[i][o][p] += randomFloat(-3, 3);
            }
            else
            {
               weights[i][o][p] -= randomFloat(-3, 3);
            }
         }
      }
   }
   return weights;
}
function startAI(weights, layer_num, num, input)
{
   if(layer_num != 0)
   {
      let summ = 0;
      for (let i = 0; i < weights[layer_num-1].length; i++) {
         summ += startAI(weights, [layer_num-1], i, input)*weights[layer_num-1][i][num];
      }
      return sigmoid(summ);
   }
   else 
   {
      return sigmoid(input[num]);
   }
}
AIlist = [];
for (let i = 0; i < 20; i++) {
   AIlist.push(makeAI([3,4,4,1], -10, 10));
}
if (localStorage.AI)
{
   if(localStorage.AI.length > 0)
   {
      for (let i = 0; i < 10; i++) {
         AIlist[i] = randomizeAI(JSON.parse(localStorage.AI));
      } 
      AIlist[0] = JSON.parse(localStorage.AI);
   }
}

document.querySelector("#clear").addEventListener('click', clear);

function clear() {
   localStorage.AI = "";
   location.reload();
}

bird.src = "img/bird.png";
bg.src = "img/bg.png";
fg.src = "img/fg.png";
pipeUp.src = "img/pipeUp.png";
pipeBottom.src = "img/pipeBottom.png";

// Звуковые файлы
var fly = new Audio();
var score_audio = new Audio();

fly.src = "audio/fly.mp3";
score_audio.src = "audio/score.mp3";

var gap = 100;

// Создание блоков
var pipe = [];

pipe[0] = {
 x : cvs.width,
 y : 0
}
var score = 0;
var grav = 0.2;
var game = true;
class Bird
{
   constructor()
   {
   this.xPos = 10;
   this.yPos = 150;
   this.ySpeed = -1;
   this.IsDie = false;
   this.time = 0;
   }
}
let birdList = [];
for (let i = 0; i < 20; i++) {
   birdList.push(new Bird);
}
function setTime()
{
   for (let i = 0; i < birdList.length; i++) {
      if(!birdList[i].IsDie)
      {
         birdList[i].time += 1;
      }
   }
}
function draw() {
   if(game)
   {
   setTime();
   ctx.drawImage(bg, 0, 0);
   for(var i = 0; i < pipe.length; i++) {
   ctx.drawImage(pipeUp, pipe[i].x, pipe[i].y);
   ctx.drawImage(pipeBottom, pipe[i].x, pipe[i].y + pipeUp.height + gap);

   pipe[i].x -= 2;

   if(pipe[i].x == 80) {
      pipe.push({
      x : cvs.width,
      y : Math.floor(Math.random() * pipeUp.height) - pipeUp.height
   });
   if (pipe.length > 3)
   {
      pipe.splice(0, 1);
   }
   }
   game = false;
   for (let o = 0; o < birdList.length; o++) {
      if(birdList[o].xPos + bird.width >= pipe[i].x
      && birdList[o].xPos <= pipe[i].x + pipeUp.width
      && (birdList[o].yPos <= pipe[i].y + pipeUp.height
      || birdList[o].yPos + bird.height >= pipe[i].y + pipeUp.height + gap) || birdList[o].yPos + bird.height >= cvs.height - fg.height) 
      {
         birdList[o].IsDie = true;
      }
      if(!birdList[o].IsDie)
      {
         game = true;
      }
   }
   if (!game)
   {
      let BestTime = 0;
      let BestAI = undefined;
      for (let i = 0; i < AIlist.length; i++) {
         if(birdList[i].time >= BestTime)
         {
            BestTime = birdList[i].time;
            BestAI = AIlist[i];
         }
      }
      localStorage.AI = JSON.stringify(BestAI);
      location.reload();
   }
   if(pipe[i].x == 0) {
      score++;
      score_audio.play();
   }
}
for (let o = 0; o < birdList.length; o++) {
   ctx.drawImage(fg, 0, cvs.height - fg.height);
   if (!birdList[o].IsDie)
   {
      let NearestPipe = 0;
      for (let i = 0; i < pipe.length; i++) {
         if (birdList[o].xPos > (pipe[NearestPipe].x + pipeUp.width) && pipe[i].x > pipe[NearestPipe].x)
         {
            NearestPipe = i;
         }
      }
      ctx.drawImage(bird, birdList[o].xPos, birdList[o].yPos);
      if(startAI(AIlist[o], AIlist[o].length-1, 0, [(-birdList[o].yPos + pipe[NearestPipe].y + pipeUp.height),(-birdList[o].yPos - bird.height + pipe[NearestPipe].y + pipeUp.height + gap), -birdList[o].xPos + (pipe[NearestPipe].x + pipeUp.width)]) >= 0.5)
      {
         birdList[o].ySpeed = -4;
      }
      else
      {
         birdList[o].ySpeed += grav;
      }
      birdList[o].yPos += birdList[o].ySpeed;
   }
   }
 ctx.fillStyle = "#FFF";
 ctx.font = "24px Verdana";
 ctx.fillText("Счет: " + score, 10, cvs.height - 20);

 requestAnimationFrame(draw);
}
}
pipeBottom.onload = draw;
