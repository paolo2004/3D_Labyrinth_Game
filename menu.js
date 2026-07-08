//create variable for the menu

var menu1 = document.getElementById("menu1");
var menu2 = document.getElementById("menu2");
var button1 = document.getElementById("button1");
var button2 = document.getElementById("button2");
var button3 = document.getElementById("button3");
var gameStarted = false;
var playAgainButton = document.getElementById("playAgainButton");
var quitButton = document.getElementById("quitButton");

function startNewGame(){
    menu1.style.display = "none";
    menu2.style.display = "none";
    document.getElementById("resultMessage").style.display = "none";
    clearWorld();

    let amountOfWalls = 30 + Math.floor(Math.random() * 21);
    innerWalls = createRandomInnerWalls(amountOfWalls);
    walls = map.concat(innerWalls);

    let availableItemSlots = itemSlots.slice();
    coins = createRandomItems(3, "pattern/coin.png", availableItemSlots);
    keys = createRandomItems(3, "pattern/key.png", availableItemSlots);
    doubleCoins = createRandomItems(3, "pattern/double_key.png", availableItemSlots);
    win = createRandomItems(1, "pattern/win.png", availableItemSlots);
    traps = createRandomTraps(2, availableItemSlots);

    resetGame();
    canlock = true;

    createSquare(walls, "wall");
    createSquare(coins, "coin");
    createSquare(keys, "key");
    createSquare(doubleCoins, "doubleCoin");
    createSquare(win, "win");
    createSquare(traps, "trap");

    if (!gameStarted) {
        TimerGame = setInterval(repeat, 10);
        gameStarted = true;
    }
}


//create Navigation for the menu
button1.addEventListener("click", function() {
    startNewGame();
});

button2.addEventListener("click", function() {
    menu1.style.display = "none";
    menu2.style.display = "block";
});

button3.addEventListener("click", function() {
    menu2.style.display = "none";
    menu1.style.display = "block";
});

playAgainButton.addEventListener("click", function() {
    startNewGame();
});

quitButton.addEventListener("click", function() {
   document.getElementById("resultMessage").style.display = "none";
   menu1.style.display = "block";
});

