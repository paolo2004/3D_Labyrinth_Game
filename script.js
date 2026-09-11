//world variables
var deg = Math.PI/180;

const WORLD_SIZE = 2000;
const HALF_WORLD = WORLD_SIZE / 2;
const ROOM_HEIGHT = 260;
const WALL_THICKNESS = 28;
const ITEM_SIZE = 50;
const EXIT_SIZE = 80;
//a trap covers this share of a cell, so there is always floor left to squeeze past
const TRAP_CELL_RATIO = 0.45;

//the player always spawns in the first cell of the grid
const SPAWN_CELL = [1, 1];

var startX = 0;
var startY = 0;
var startZ = 0;
var startRX = 0;
var startRY = 180;

function player(x, y, z, rx, ry){
    this.x = x;
    this.y = y;
    this.z = z;
    this.rx = rx;
    this.ry = ry;
}

//the room around the labyrinth: four outer walls, a floor and a ceiling
var map = [
    // BACK / FRONT
    [0, 0, -HALF_WORLD, 0, 0, 0,
        WORLD_SIZE, ROOM_HEIGHT, "#172554", 1],

    [0, 0, HALF_WORLD, 0, 180, 0,
        WORLD_SIZE, ROOM_HEIGHT, "#172554", 1],
    // SIDES
    [HALF_WORLD, 0, 0, 0, 90, 0,
        WORLD_SIZE, ROOM_HEIGHT, "#164e63", 1],
    [-HALF_WORLD, 0, 0, 0, -90, 0,
        WORLD_SIZE, ROOM_HEIGHT, "#164e63", 1],
    // FLOOR
    [0, ROOM_HEIGHT / 2, 0, 90, 0, 0,
        WORLD_SIZE, WORLD_SIZE, "#050b18", 1],
    // CEILING
    [0, -ROOM_HEIGHT / 2, 0, 90, 0, 0,
        WORLD_SIZE, WORLD_SIZE, "#01030d", 1]
];

/*
    Every level owns one fixed labyrinth. The same grid is rebuilt on every
    restart, so a level can be learned by heart - only the items are reshuffled.

    Grid format, (2N+1) x (2N+1) characters for an N x N labyrinth:
        even row / even column -> corner post
        even row / odd  column -> horizontal wall slot
        odd  row / even column -> vertical wall slot
        odd  row / odd  column -> walkable cell
    A "#" means the slot is solid, a space means it is open. Every grid below
    was checked with a flood fill: all cells are reachable from the spawn.
*/
const DIFFICULTIES = {
    easy: {
        label: "Easy",
        blurb: "Wide corridors and many loops. Almost no dead ends.",
        lives: 5,
        keys: 3,
        coins: 5,
        doubleKeys: 4,
        traps: 2,
        firstExtraLife: 10,
        extraLifeStep: 5,
        maze: [
            "#############",
            "#   #       #",
            "# # # # # # #",
            "#   #   # # #",
            "# ### ### # #",
            "# #     #   #",
            "# # # # ### #",
            "#   # #   # #",
            "### ##### # #",
            "#   #   #   #",
            "# ### # ### #",
            "#     #     #",
            "#############"
        ]
    },

    medium: {
        label: "Medium",
        blurb: "Narrower lanes, a handful of dead ends to waste your time.",
        lives: 3,
        keys: 3,
        coins: 3,
        doubleKeys: 3,
        traps: 4,
        firstExtraLife: 15,
        extraLifeStep: 6,
        maze: [
            "#################",
            "#   #           #",
            "# # # # ####### #",
            "# # # # #       #",
            "# # ### ### #####",
            "# #   #   #     #",
            "# ### ### ##### #",
            "#     #   #     #",
            "# ##### ### # ###",
            "# #   # #   #   #",
            "# # # # # ##### #",
            "#   # #   #     #",
            "##### ##### ### #",
            "#   #     # #   #",
            "# # ##### # # ###",
            "# #         #   #",
            "#################"
        ]
    },

    hard: {
        label: "Difficult",
        blurb: "A true labyrinth: tight corridors, 13 dead ends, no loops.",
        lives: 2,
        keys: 4,
        coins: 2,
        doubleKeys: 2,
        traps: 7,
        firstExtraLife: 20,
        extraLifeStep: 8,
        maze: [
            "#####################",
            "# #     #   #       #",
            "# ### ### # # ##### #",
            "#   #     #   #     #",
            "### # ######### #####",
            "#   # #       #     #",
            "# ### # ##### ##### #",
            "#   # # #       #   #",
            "### # # ####### # ###",
            "#   #   #     # #   #",
            "# ### ### ### ##### #",
            "#   # #   #   #     #",
            "### ### ### ### ### #",
            "# # #   # # #   #   #",
            "# # # ### # ### # ###",
            "# #   #   #     #   #",
            "# ####### ######### #",
            "#           #       #",
            "# ### ####### #######",
            "#   #               #",
            "#####################"
        ]
    }
};

var currentDifficulty = "medium";

function level() {
    return DIFFICULTIES[currentDifficulty];
}

function requiredKeys() {
    return level().keys;
}

//distance between two grid slots, which is also half a cell
function mazeStep(maze) {
    return WORLD_SIZE / (maze.length - 1);
}

function gridToWorld(index, maze) {
    return -HALF_WORLD + index * mazeStep(maze);
}

function mazeCells(maze) {
    return (maze.length - 1) / 2;
}

//the exit always sits in the cell diagonally opposite the spawn
function exitCell(maze) {
    return [maze.length - 2, maze.length - 2];
}

function applyDifficulty(name) {
    if (!DIFFICULTIES[name]) {
        return;
    }

    currentDifficulty = name;

    let maze = level().maze;
    startX = gridToWorld(SPAWN_CELL[1], maze);
    startZ = gridToWorld(SPAWN_CELL[0], maze);
}

var wallColors = [
    "#1e3a5f",
    "#164e63",
    "#23395d",
    "#2b3f56"
];

//derived from the grid position instead of Math.random, so every wall keeps
//its colour each time the level is rebuilt
function wallColorFor(row, column) {
    return wallColors[(row * 5 + column * 3) % wallColors.length];
}

function wallSegment(x, z, length, vertical, color) {
    return [
        x, 0, z,
        0, vertical ? 90 : 0, 0,
        //reach into the corner posts so the joints look closed
        length + WALL_THICKNESS,
        ROOM_HEIGHT,
        color,
        1
    ];
}

function buildMazeWalls(maze) {
    let segments = [];
    let last = maze.length - 1;
    let cellSize = mazeStep(maze) * 2;

    //the border is skipped, the room box already closes the labyrinth off
    for (let row = 1; row < last; row++) {
        for (let column = 1; column < last; column++) {
            if (maze[row][column] != "#") {
                continue;
            }

            let horizontal = row % 2 == 0 && column % 2 == 1;
            let vertical = row % 2 == 1 && column % 2 == 0;

            //corner posts and cells carry no wall plane of their own
            if (!horizontal && !vertical) {
                continue;
            }

            segments.push(wallSegment(
                gridToWorld(column, maze),
                gridToWorld(row, maze),
                cellSize,
                vertical,
                wallColorFor(row, column)
            ));
        }
    }

    return segments;
}

//only walkable cells are offered, so an item can never end up inside a wall
function buildItemSlots(maze, blockedCells) {
    let slots = [];
    let last = maze.length - 1;

    for (let row = 1; row < last; row += 2) {
        for (let column = 1; column < last; column += 2) {
            if (maze[row][column] == "#") {
                continue;
            }

            let blocked = blockedCells.some(function(cell){
                return cell[0] == row && cell[1] == column;
            });

            if (!blocked) {
                slots.push([gridToWorld(column, maze), gridToWorld(row, maze)]);
            }
        }
    }

    return slots;
}

function itemAt(x, z, image, size){
    let itemSize = size || ITEM_SIZE;

    return [
        x, 30, z,
        0, 0, 0,
        itemSize, itemSize,
        image, 1
    ];
}

function trapAt(x, z, size){
    return [
        x, 95, z,
        90, 0, 0,
        size, size,
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

function createRandomTraps(amount, availableSlots, size){
    let newTraps = [];
    let maxTraps = Math.min(amount, availableSlots.length);

    for (let i = 0; i < maxTraps; i++){
        let slotIndex = Math.floor(Math.random() * availableSlots.length);
        let slot = availableSlots.splice(slotIndex, 1)[0];

        newTraps.push(trapAt(slot[0], slot[1], size));
    }

    return newTraps;
}

var walls = map.slice();

var coins = [];

var doubleCoins = [];

var win = [ ];

var keys = [];

var traps = [];

//the labyrinth is fixed, only the items below it are placed anew
function generateWorld() {
    let current = level();
    let maze = current.maze;
    let exit = exitCell(maze);

    walls = map.concat(buildMazeWalls(maze));

    let availableItemSlots = buildItemSlots(maze, [SPAWN_CELL, exit]);

    coins = createRandomItems(current.coins, "pattern/coin.png", availableItemSlots);
    keys = createRandomItems(current.keys, "pattern/key.png", availableItemSlots);
    doubleCoins = createRandomItems(current.doubleKeys, "pattern/double_key.png", availableItemSlots);
    traps = createRandomTraps(current.traps, availableItemSlots,
                              mazeStep(maze) * 2 * TRAP_CELL_RATIO);

    //the exit keeps its corner so the way out can be memorised
    win = [itemAt(gridToWorld(exit[1], maze), gridToWorld(exit[0], maze),
                  "pattern/win.png", EXIT_SIZE)];
}

function renderWorld() {
    createSquare(walls, "wall");
    createSquare(coins, "coin");
    createSquare(keys, "key");
    createSquare(doubleCoins, "doubleCoin");
    createSquare(win, "win");
    createSquare(traps, "trap");
}

applyDifficulty(currentDifficulty);

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
var doubleKeySound = new Audio("sound/double_key.wav");
var winSound = new Audio("sound/win.wav");
var trapSound = new Audio("sound/trap.wav");

//movement rules (lives, keys and traps come from the chosen difficulty)
const PLAYER_SIZE = 40;
const POWER_MULTIPLIER = 3;
const VERTICAL_SPEED = 2;
const VERTICAL_LIMIT = ROOM_HEIGHT / 2 - 20;

var canlock = false;
var TimerGame;
var gameWon = false;
var gameLost = false;
var gameActive = false;
var lives = level().lives;
var points = 0;
var keysCollected = 0;
var nextLifePoints = level().firstExtraLife;
var lifeMessageFadeTimer;
var lifeMessageHideTimer;


//returns true if the key is a game control, so the browser default can be blocked
function setMovementKeyState(event, value) {
    let key = event.key.toLowerCase();

    if (key == "arrowleft")  { pressLeft = value;    return true; }
    if (key == "arrowright") { pressRight = value;   return true; }
    if (key == "arrowup")    { pressForward = value; return true; }
    if (key == "arrowdown")  { pressBack = value;    return true; }
    if (key == " ")          { pressUp = value;      return true; }
    if (key == "b")          { pressDown = value;    return true; }
    if (key == "p")          { pressPower = value;   return true; }
    if (key == "r")          { released = value;     return true; }

    return false;
}

function clearMovementKeys() {
    pressLeft = 0;
    pressRight = 0;
    pressForward = 0;
    pressBack = 0;
    pressUp = 0;
    pressDown = 0;
    pressPower = 0;
    released = 0;
}

document.addEventListener("keydown", (event)=>{
    //arrows and space would scroll the page, but only block that during play
    if (setMovementKeyState(event, 1) && gameActive) {
        event.preventDefault();
    }

    if (event.key.toLowerCase() == "m") {
        openMainMenu();
    }
})

document.addEventListener("keyup", (event)=>{
    if (setMovementKeyState(event, 0) && gameActive) {
        event.preventDefault();
    }
})

//if the mouse is pressed
container.onclick = function(){ 
    if (canlock) {
        container.requestPointerLock();
    }
} 

document.addEventListener("pointerlockchange", (event) =>{
    //lock = !lock;
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

function resetGame(){
    let current = level();

    resetPlayer();
    clearMovementKeys();
    hideLifeMessage();
    gameWon = false;
    gameLost = false;
    lives = current.lives;
    points = 0;
    keysCollected = 0;
    nextLifePoints = current.firstExtraLife;
    updateStatus();
}

//gates movement and shows the crosshair only while a round is running
function setPlaying(active){
    gameActive = active;

    if (active) {
        container.classList.add("playing");
    }
    else {
        container.classList.remove("playing");
    }
}

function updateStatus(){
    document.getElementById("levelStatus").textContent = level().label;
    document.getElementById("lifeStatus").textContent = lives;
    document.getElementById("pointStatus").textContent = points;
    document.getElementById("keyStatus").textContent = keysCollected + " / " + requiredKeys();
    document.getElementById("nextLifeStatus").textContent = nextLifePoints + " pts";
}

function isColliding(x, z) {
    let playerSize = PLAYER_SIZE;

    for (let i = 0; i < walls.length; i++) {
        let wall = walls[i];

        if (wall[3] == 90) {
            continue;
        }

        if (isHorizontalWall(wall) && isHorizontalWallCollision(x, z, wall, playerSize)) return true;
        if (isVerticalWall(wall) && isVerticalWallCollision(x, z, wall, playerSize)) return true;
    }

    return false;
}

function isHorizontalWall(wall) {
    return wall[4] == 0 || wall[4] == 180;
}

function isVerticalWall(wall) {
    return wall[4] == 90 || wall[4] == -90;
}

function isHorizontalWallCollision(x, z, wall, playerSize) {
    return x > wall[0] - wall[6] / 2 - playerSize &&
        x < wall[0] + wall[6] / 2 + playerSize &&
        z > wall[2] - playerSize &&
        z < wall[2] + playerSize;
}

function isVerticalWallCollision(x, z, wall, playerSize) {
    return x > wall[0] - playerSize &&
        x < wall[0] + playerSize &&
        z > wall[2] - wall[6] / 2 - playerSize &&
        z < wall[2] + wall[6] / 2 + playerSize;
}

function update(){
    movePlayer(calculateMovement());
    rotatePlayer();

    if (released == 1)
    {
        resetPlayer();
    }

    updateWorldTransform();
}

function calculateMovement() {
    let speedMultiplier = pressPower ? POWER_MULTIPLIER : 1;

    return {
        dx: ((pressRight - pressLeft) * Math.cos(pawn.ry * deg) -
            (pressForward - pressBack) * Math.sin(pawn.ry * deg)) * speedMultiplier,
        //y grows downwards, so moving up means a negative dy
        dy: (pressDown - pressUp) * VERTICAL_SPEED * speedMultiplier,
        dz: (-(pressRight - pressLeft) * Math.sin(pawn.ry * deg) -
            (pressForward - pressBack) * Math.cos(pawn.ry * deg)) * speedMultiplier
    };
}

function movePlayer(movement) {
    let nextX = pawn.x + movement.dx;
    let nextY = pawn.y + movement.dy;
    let nextZ = pawn.z + movement.dz;

    if (!isColliding(nextX, pawn.z)) pawn.x = nextX;
    if (!isColliding(pawn.x, nextZ)) pawn.z = nextZ;

    //keep the player between ceiling and floor so walls cannot be flown over
    pawn.y = Math.max(-VERTICAL_LIMIT, Math.min(VERTICAL_LIMIT, nextY));
}

function rotatePlayer() {
    if (lock) {
        pawn.rx += mouseY * 0.5;
        pawn.ry -= mouseX * 0.5;
        pawn.rx = Math.max(-90, Math.min(90, pawn.rx));
    }

    mouseX = 0;
    mouseY = 0;
}

function updateWorldTransform() {
    world.style.transform = "translateZ(600px)" +
        "rotateX(" + (-pawn.rx) + "deg)" +
        "rotateY(" + (-pawn.ry) + "deg)" +
        "translate3d(" + (-pawn.x) + "px," + (-pawn.y) + "px," + (-pawn.z) + "px)";
}

function createSquare(squares, string){
     for (let i = 0; i < squares.length; i++){

        //create rectangle and styles
       let newElement = document.createElement("div");
       newElement.className = "square " + string;
       //the two flat planes of the room: y below zero is the ceiling
       if (string == "wall" && squares[i][3] == 90){
        newElement.classList.add(squares[i][1] < 0 ? "ceiling" : "floor")
       }
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
       newElement.style.transform = "translate3d(" + 
                                    (squares[i][0] - squares[i][6] / 2) + "px," +
                                    (squares[i][1] - squares[i][7] / 2) + "px," +
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

function hideLifeMessage(){
    let lifeMessage = document.getElementById("lifeMessage");

    clearTimeout(lifeMessageFadeTimer);
    clearTimeout(lifeMessageHideTimer);

    if (!lifeMessage) {
        return;
    }

    lifeMessage.style.display = "none";
    lifeMessage.style.opacity = "0";
    lifeMessage.textContent = "";
}

//restarts the clip on every pickup and swallows the autoplay rejection
function playSound(sound){
    if (!sound) {
        return;
    }

    sound.currentTime = 0;
    let playing = sound.play();

    if (playing && playing.catch) {
        playing.catch(function(){});
    }
}

function distanceToObject(object) {
    return Math.sqrt(
        Math.pow(pawn.x - object[0], 2) +
        Math.pow(pawn.y - object[1], 2) +
        Math.pow(pawn.z - object[2], 2)
    );
}

//traps lie flat on the floor, so their height must not water down the check
function groundDistanceToObject(object) {
    return Math.sqrt(
        Math.pow(pawn.x - object[0], 2) +
        Math.pow(pawn.z - object[2], 2)
    );
}

/*
    Floating items are picked up from anywhere inside a sphere the size of the
    sprite. A trap only bites where its red square actually lies, which leaves
    room to squeeze past it even in the narrow corridors of the hard level.
*/
function isWithinReach(squares, index, string) {
    let object = squares[index];

    if (string == "trap") {
        return groundDistanceToObject(object) < object[6] / 2;
    }

    return distanceToObject(object) < object[6];
}

function removeCollectedObject(string, index, object) {
    let element = document.getElementById(string + index);

    if (element) {
        element.style.display = "none";
    }

    object[0] = 100000;
}

function addPointsFor(string) {
    let pointValues = {
        key: 1,
        doubleCoin: 2,
        coin: 3
    };

    points += pointValues[string] || 0;
}

function handleWin() {
    gameWon = true;
    canlock = false;
    setPlaying(false);
    document.exitPointerLock();
    hideLifeMessage();
    showResultMessage("You escaped the labyrinth!", "#facc15");
}

function handleTrap() {
    lives--;
    updateStatus();

    if (lives <= 0) {
        gameLost = true;
        canlock = false;
        setPlaying(false);
        document.exitPointerLock();
        hideLifeMessage();
        showResultMessage("You lost the game!", "#f87171");
    }
    else {
        showLifeMessage("You lost one life!", "#f87171");
    }
}

function checkForExtraLife() {
    let gainedLives = 0;

    while (points >= nextLifePoints) {
        lives++;
        nextLifePoints += level().extraLifeStep;
        gainedLives++;
    }

    if (gainedLives == 1) {
        showLifeMessage("You gained one life!", "#34d399");
    }
    else if (gainedLives > 1) {
        showLifeMessage("You gained " + gainedLives + " lives!", "#34d399");
    }
}

function interact(squares, string, objectSound){
    if (gameWon || gameLost) {
        return;
    }

    for (let i = 0; i < squares.length; i++){
        if (isWithinReach(squares, i, string)) {
            //the locked exit must stay in the world, so check before collecting
            if (string == "win" && keysCollected < requiredKeys()) {
                showLifeMessage("Exit locked! Find all " + requiredKeys() + " keys.", "#7dd3fc");
                return;
            }

            playSound(objectSound);
            removeCollectedObject(string, i, squares[i]);

            if (string == "win") {
                handleWin();
                return;
            }
            else if (string == "trap") {
                handleTrap();
                return;
            }
            if ( string == "key") {
                keysCollected++;
            }
            addPointsFor(string);
            checkForExtraLife();

            updateStatus();
        }
    }
}

function rotateItems(squares, string){
    for (let i = 0; i < squares.length; i++){
        let element = document.getElementById(string + i);

        if (element) {
            element.style.transform =
                "translate3d(" + (squares[i][0] - squares[i][6] / 2) + "px," +
                                 (squares[i][1] - squares[i][7] / 2) + "px," +
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

    //gameActive is false while a menu is open, so the player cannot move behind it
    if (gameActive && !gameWon && !gameLost) {
        update();

        interact(coins, "coin", coinSound);
        interact(keys, "key", keySound);
        interact(doubleCoins, "doubleCoin", doubleKeySound);
        interact(traps, "trap", trapSound);
        interact(win, "win", winSound);
    }
    rotateItems(coins, "coin");
    rotateItems(keys, "key");
    rotateItems(win, "win");
    rotateItems(doubleCoins, "doubleCoin");
}

updateStatus();
