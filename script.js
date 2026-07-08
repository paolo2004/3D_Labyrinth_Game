//world variables
var deg = Math.PI/180;
var startX = 0;
var startY = 0;
var startZ = -900;
var startRX = 0;
var startRY = 180;

function player(x, y, z, rx, ry){
    this.x = x;
    this.y = y;
    this.z = z;
    this.rx = rx;
    this.ry = ry;
}

var map = [
    // OUTER BOUNDARY
    [0, 0, -1000, 0, 0, 0, 2000, 200, '#6e8291', 1],
    [0, 0, 1000, 0, 180, 0, 2000, 200, 'pattern/back.png', 1],
    [1000, 0, 0, 0, 90, 0, 2000, 200, 'pattern/right.jpeg', 1],
    [-1000, 0, 0, 0, -90, 0, 2000, 200, '#76abc1', 1],
    [0, 100, 0, 90, 0, 0, 2000, 2000, 'gifs/floor.gif', 1]
];

var images = [
    [200,200,'pattern/back1.png'], // [width, height, image source]
    [200,200,'pattern/back2.png'], 
    [200,200,'pattern/back3.png'],
    [500, 200, 'gifs/wall1.gif'],
    [360, 200, 'gifs/wall2.gif'],
    [400, 200, 'gifs/wall3.gif'],
    [300, 200, 'gifs/wall4.gif']
];

var wallSlots = [
    [-750, -700], [-500, -700], [-250, -700], [0, -700], [250, -700], [500, -700], [750, -700],
    [-750, -450], [-500, -450], [-250, -450], [0, -450], [250, -450], [500, -450], [750, -450],
    [-750, -200], [-500, -200], [-250, -200], [0, -200], [250, -200], [500, -200], [750, -200],
    [-750, 50], [-500, 50], [-250, 50], [0, 50], [250, 50], [500, 50], [750, 50],
    [-750, 300], [-500, 300], [-250, 300], [0, 300], [250, 300], [500, 300], [750, 300],
    [-750, 550], [-500, 550], [-250, 550], [0, 550], [250, 550], [500, 550], [750, 550],
    [-750, 800], [-500, 800], [-250, 800], [0, 800], [250, 800], [500, 800], [750, 800],
    [-875, -575], [875, -575], [-875, -75], [875, -75], [-875, 425], [875, 425], [-875, 800], [875, 800]
];

var itemSlots = [
    [-900, -850], [-450, -850], [450, -850], [900, -850],
    [-600, -500], [200, -500], [600, -500],
    [-900, -150], [-450, -150], [450, -150], [900, -150],
    [-600, 150], [0, 150], [600, 150],
    [-900, 450], [-450, 450], [450, 450], [900, 450],
    [-600, 750], [0, 750], [600, 750]
];

function wallFromImage(x, z, image, vertical){
    return [
        x, 0, z,
        0, vertical ? 90 : 0, 0,
        image[0], image[1],
        image[2], 1
    ];
}

function createRandomInnerWalls(amount){
    let innerWalls = [];
    let availableSlots = wallSlots.slice();
    let maxWalls = Math.min(amount, availableSlots.length);

    for (let i = 0; i < maxWalls; i++){
        let slotIndex = Math.floor(Math.random() * availableSlots.length);
        let slot = availableSlots.splice(slotIndex, 1)[0];
        let image = images[Math.floor(Math.random() * images.length)];
        let vertical = i % 2 == 0;

        innerWalls.push(wallFromImage(slot[0], slot[1], image, vertical));
    }

    return innerWalls;
}

function itemAt(x, z, image){
    return [
        x, 30, z,
        0, 0, 0,
        50, 50,
        image, 1
    ];
}

function trapAt(x, z){
    return [
        x, 95, z,
        90, 0, 0,
        120, 120,
        '#D0021B', 0.8
    ];
}

function createRandomItems(amount, image, availableSlots){
    let items = [];
    let maxItems = Math.min(amount, availableSlots.length);

    for (let i = 0; i < maxItems; i++){
        let slotIndex = Math.floor(Math.random() * availableSlots.length);
        let slot = availableSlots.splice(slotIndex, 1)[0];

        items.push(itemAt(slot[0], slot[1], image));
    }

    return items;
}

function createRandomTraps(amount, availableSlots){
    let newTraps = [];
    let maxTraps = Math.min(amount, availableSlots.length);

    for (let i = 0; i < maxTraps; i++){
        let slotIndex = Math.floor(Math.random() * availableSlots.length);
        let slot = availableSlots.splice(slotIndex, 1)[0];

        newTraps.push(trapAt(slot[0], slot[1]));
    }

    return newTraps;
}

var innerWalls = [];
var walls = map.concat(innerWalls);

var coins = [];

var doubleCoins = [];   

var win = [ ];

var keys = [];

var traps = [];

var originalCoins = JSON.parse(JSON.stringify(coins));
var originalWin = JSON.parse(JSON.stringify(win));
var originalKeys = JSON.parse(JSON.stringify(keys));
var originalTraps = JSON.parse(JSON.stringify(traps));



//Variables for movement
var pressLeft = 0;
var pressRight = 0;
var pressForward = 0;
var pressBack = 0;
var pressUp = 0;
var pressDown = 0;
var pressPower = 0;
var released = 0;
var mouseX = 0;
var mouseY = 0;
var lock = false;
var itemRotation = 0;
var container = document.getElementById("container");

var coinSound = new Audio("sound/coin.wav");
var keySound = new Audio("sound/key.wav");
var winSound = new Audio("sound/win.wav");
var trapSound = new Audio("sound/trap.wav");
var canlock = false;
var TimerGame;
var gameWon = false;
var gameLost = false;
var lives = 2;
var points = 0;
var nextLifePoints = 6;
var lifeMessageFadeTimer;
var lifeMessageHideTimer;


//if the key is pressed
document.addEventListener("keydown", (event)=>{

    if (event.key == "ArrowLeft"){
       pressLeft = 1; 
    }
    if (event.key == "ArrowRight"){
       pressRight = 1; 
    }
    if (event.key == "ArrowUp"){
       pressForward = 1; 
    }
    if (event.key == "ArrowDown"){
       pressBack = 1; 
    }
    if(event.keyCode == 32){
        pressUp = -1;
    } 
    if(event.key == "p"){
        pressPower = 1;
    }
    if (event.key == "r"){
        released = 1;
    }
    if (event.key == "b"){
        pressDown = - 1;
    }
    if (event.key == "m"){
        document.getElementById("menu1").style.display = "block";
    }
})

//if the key is released
document.addEventListener("keyup", (event)=>{
    if (event.key == "ArrowLeft"){
       pressLeft = 0; 
    }
    if (event.key == "ArrowRight"){
       pressRight = 0; 
    }
    if (event.key == "ArrowUp"){
       pressForward = 0;         
    }
    if (event.key == "ArrowDown"){
       pressBack = 0; 
    }
    if(event.keyCode == 32){
        pressUp = 0;
    }
    if (event.key == "p"){
        pressPower = 0;
    }
    if (event.key == "r"){
        released = 0;
    }
    if (event.key == "b"){
        pressDown = 0;
    }
    
})

//if the mouse is pressed
container.onclick = function(){
    
    if (canlock) {
        container.requestPointerLock();
    }
} 

document.addEventListener("pointerlockchange", (event) =>{
    lock = document.pointerLockElement === container;
})

//mouse movement listener 
document.addEventListener("mousemove", (event)=>{
    mouseX = event.movementX;
    mouseY = event.movementY;
})

var pawn = new player(startX,startY,startZ,startRX,startRY);
var world = document.getElementById("world");

function resetPlayer(){
    pawn.x = startX;
    pawn.y = startY;
    pawn.z = startZ;
    pawn.rx = startRX;
    pawn.ry = startRY;
}

function resetSquares(squares, originalSquares, string){
    for (let i = 0; i < originalSquares.length; i++){
        squares[i] = originalSquares[i].slice();

        let element = document.getElementById(string + i);
        if (element) {
            element.style.display = "block";
        }
    }
}

/***function resetGame(){
    resetPlayer();
    resetSquares(coins, originalCoins, "coin");
    resetSquares(win, originalWin, "win");
    resetSquares(walls, map, "wall");
    resetSquares(keys, originalKeys, "key");
    resetSquares(traps, originalTraps, "trap");
    gameWon = false;
}***/

function resetGame(){
    resetPlayer();
    gameWon = false;
    gameLost = false;
    lives = 2;
    points = 0;
    nextLifePoints = 6;
    updateStatus();
}

function updateStatus(){
    document.getElementById("lifeStatus").textContent = lives;
    document.getElementById("pointStatus").textContent = points;
    document.getElementById("nextLifeStatus").textContent = nextLifePoints + " pts";
}

function isColliding(x, z) {
    let playerSize = 40;

    for (let i = 0; i < walls.length; i++) {
        let wall = walls[i];

        if (wall[3] == 90) {
            continue;
        }

        let wallX = wall[0];
        let wallZ = wall[2];
        let wallRY = wall[4];
        let wallLength = wall[6];

        // horizontal wall, along X axis
        if (wallRY == 0 || wallRY == 180) {
            if (
                x > wallX - wallLength / 2 - playerSize &&
                x < wallX + wallLength / 2 + playerSize &&
                z > wallZ - playerSize &&
                z < wallZ + playerSize
            ) {
                return true;
            }
        }

        // vertical wall, along Z axis
        if (wallRY == 90 || wallRY == -90) {
            if (
                x > wallX - playerSize &&
                x < wallX + playerSize &&
                z > wallZ - wallLength / 2 - playerSize &&
                z < wallZ + wallLength / 2 + playerSize
            ) {
                return true;
            }
        }
    }

    return false;
}

function update(){
    //count movement
    let speedMultiplier = pressPower ? 5: 1; 
    let dx = ((pressRight - pressLeft) * Math.cos(pawn.ry * deg) -
                (pressForward - pressBack) * Math.sin(pawn.ry * deg))* speedMultiplier;
    let dz = (-(pressRight - pressLeft) * Math.sin(pawn.ry * deg) -
                (pressForward - pressBack) * Math.cos(pawn.ry * deg))* speedMultiplier;
    let dy = (pressUp - pressDown) * speedMultiplier;
    let drx = mouseY;
    let dry = - mouseX;
    mouseX = mouseY = 0; 

    // add movement to the coordinates
    let nextX = pawn.x + dx;
    let nextY = pawn.y + dy;
    let nextZ = pawn.z + dz;

    if (!isColliding(nextX, pawn.z)) {
        pawn.x = nextX;
    }

    if (!isColliding(pawn.x, nextZ)) {
        pawn.z = nextZ;
    }

    pawn.y = nextY;

    if (lock) {
        pawn.rx = pawn.rx+ drx;
        pawn.ry = pawn.ry + dry;

        if (pawn.rx > 90) {
            pawn.rx = 90;
        }
        if (pawn.rx < -90) {
            pawn.rx = -90;
        }
    }

    if (released == 1)
    {
        resetPlayer();
    }

   //change coordinates of the world
	world.style.transform ="translateZ(600px)" + "rotateX(" + (-pawn.rx) + "deg)" + 
                            "rotateY(" + (-pawn.ry) + "deg)" +  
                            "translate3d(" + (-pawn.x) + "px," + (-pawn.y) + "px," + (-pawn.z) + "px)";
}

function createSquare(squares, string){
     for (let i = 0; i < squares.length; i++){

        //create rectangle and styles
       let newElement = document.createElement("div");
       newElement.className = "square";
       newElement.id = string + i;
       newElement.style.width = squares[i][6] + "px";
       newElement.style.height = squares[i][7] + "px";
       if (squares[i][8].startsWith("#")) {
            newElement.style.backgroundColor = squares[i][8];
        } else {
            newElement.style.backgroundImage = "url('" + squares[i][8] + "')";
            newElement.style.backgroundSize = "100% 100%";
            newElement.style.backgroundPosition = "center";
            newElement.style.backgroundRepeat = "no-repeat";
        }
       newElement.style.opacity = squares[i][9];
       newElement.style.transform = "translate3d(" + (600 - squares[i][6]/2 + squares[i][0]) + "px," + 
                                    (400 - squares[i][7]/2 + squares[i][1]) + "px," +   
                                    (squares[i][2]) + "px)" +
                                    "rotateX(" + squares[i][3] + "deg)" +
                                    "rotateY(" + squares[i][4] + "deg)" +
                                    "rotateZ(" + squares[i][5] + "deg)";
        world.appendChild(newElement);
    }

}

function showResultMessage(message, color){
    let resultMessage = document.getElementById("resultMessage");
    let resultTitle = document.getElementById("resultTitle");

    resultTitle.textContent = message;
    resultMessage.style.color = color;
    resultMessage.style.borderColor = color;
    resultMessage.style.display = "block";
}

function showLifeMessage(message, color){
    let lifeMessage = document.getElementById("lifeMessage");

    if (!lifeMessage) {
        return;
    }

    clearTimeout(lifeMessageFadeTimer);
    clearTimeout(lifeMessageHideTimer);

    lifeMessage.textContent = message;
    lifeMessage.style.color = color;
    lifeMessage.style.borderColor = color;
    lifeMessage.style.display = "block";
    lifeMessage.style.opacity = "1";

    lifeMessageFadeTimer = setTimeout(function(){
        lifeMessage.style.opacity = "0";
    }, 1800);

    lifeMessageHideTimer = setTimeout(function(){
        lifeMessage.style.display = "none";
        lifeMessage.textContent = "";
    }, 2200);
}

function interact(squares, string, objectSound){
    if (gameWon || gameLost) {
        return;
    }

    for (let i = 0; i < squares.length; i++){
        let dis = Math.sqrt(Math.pow((pawn.x - squares[i][0]), 2) + 
                  Math.pow((pawn.y - squares[i][1]), 2) + 
                  Math.pow((pawn.z - squares[i][2]), 2));
        let is = (squares[i][6]) ;
        if (dis < is) {
            objectSound.play();

            if (string == "win") {
                gameWon = true;
                canlock = false;
                document.exitPointerLock();
                showResultMessage("You won the game!", "#facc15");
                return;
            }
            else if (string == "trap") {
                lives--;
                updateStatus();

                document.getElementById(string + i).style.display = "none";
                squares[i][0] = 100000;
                if (lives <= 0) {
                    gameLost = true;
                    canlock = false;
                    document.exitPointerLock();
                    showResultMessage("You lost the game!", "#f87171");
                }
                else {
                    showLifeMessage("You lost one life!", "#f87171");
                }
                return;
            }
            if (string == "key") {
                points = points + 1;
            }

            if (string == "doubleCoin") {
                points = points + 2;
            }

            if (string == "coin") {
                points = points + 3;
            }

            if (points >= nextLifePoints) {
                lives = lives + 1;
                nextLifePoints = nextLifePoints + 6;
                showLifeMessage("You gained one life!", "#10b981");
            }

            updateStatus();

            document.getElementById(string + i).style.display = "none";
            squares[i][0] = 100000;
        }
    }
}

function rotateItems(squares, string){
    for (let i = 0; i < squares.length; i++){
        let element = document.getElementById(string + i);

        if (element) {
            element.style.transform =
                "translate3d(" + (600 - squares[i][6]/2 + squares[i][0]) + "px," +
                                  (400 - squares[i][7]/2 + squares[i][1]) + "px," +
                                  squares[i][2] + "px)" +
                "rotateX(" + squares[i][3] + "deg)" +
                "rotateY(" + itemRotation + "deg)" +
                "rotateZ(" + squares[i][5] + "deg)";
        }
    }
}

function clearWorld(){
    world.innerHTML = "";
}
function repeat(){
    itemRotation += 1;
    update();

    if (gameWon || gameLost) {
        return;
    }

    interact(coins, "coin", coinSound);
    if (gameWon || gameLost) return;
    interact(keys, "key", keySound);
    if (gameWon || gameLost) return;
    interact(win, "win", winSound);
    if (gameWon || gameLost) return;
    interact(traps, "trap", trapSound);
    if (gameWon || gameLost) return;
    interact(doubleCoins, "doubleCoin", coinSound);
    rotateItems(coins, "coin");
    rotateItems(keys, "key");
    rotateItems(win, "win");
    rotateItems(doubleCoins, "doubleCoin");
}
