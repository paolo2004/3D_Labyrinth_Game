//create variable for the menu

var menu1 = document.getElementById("menu1");
var legend = document.getElementById("legend");
var menu2 = document.getElementById("menu2");
var button2 = document.getElementById("button2");
var button3 = document.getElementById("button3");
var difficultyList = document.getElementById("difficultyList");
var difficultyTable = document.getElementById("difficultyTable");
var gameStarted = false;
var playAgainButton = document.getElementById("playAgainButton");
var quitButton = document.getElementById("quitButton");

function startNewGame(){
    hideMenus();
    legend.style.display = "none";
    clearWorld();
    generateWorld();
    resetGame();
    canlock = true;
    setPlaying(true);
    renderWorld();
    startGameTimer();
}

function hideMenus() {
    menu1.classList.remove("open");
    menu2.classList.remove("open");
    document.getElementById("resultMessage").style.display = "none";
}

//used by the M key and by the main menu button, so both leave the game in the
//same state
function openMainMenu() {
    document.exitPointerLock();
    canlock = false;
    setPlaying(false);
    clearMovementKeys();
    hideLifeMessage();
    document.getElementById("resultMessage").style.display = "none";
    menu2.classList.remove("open");
    menu1.classList.add("open");
    legend.style.display = "block";
    markCurrentDifficulty();
}

function startGameTimer() {
    if (!gameStarted) {
        TimerGame = setInterval(repeat, 10);
        gameStarted = true;
    }
}

/*
    The menu and the instruction table are both built from DIFFICULTIES, so the
    numbers on screen can never drift away from the ones the game plays with.
*/
function difficultySummary(setting) {
    let cells = mazeCells(setting.maze);

    return cells + " x " + cells + " maze · " +
        setting.lives + " lives · " +
        setting.keys + " keys · " +
        setting.traps + " traps";
}

function createDifficultyButton(name) {
    let setting = DIFFICULTIES[name];

    let button = document.createElement("button");
    button.type = "button";
    button.className = "difficulty";
    button.dataset.difficulty = name;

    let title = document.createElement("span");
    title.className = "difficulty-name";
    title.textContent = setting.label;

    let blurb = document.createElement("span");
    blurb.className = "difficulty-blurb";
    blurb.textContent = setting.blurb;

    let stats = document.createElement("span");
    stats.className = "difficulty-stats";
    stats.textContent = difficultySummary(setting);

    button.appendChild(title);
    button.appendChild(blurb);
    button.appendChild(stats);

    button.addEventListener("click", function(){
        applyDifficulty(name);
        startNewGame();
    });

    return button;
}

function buildDifficultyMenu() {
    difficultyList.innerHTML = "";

    Object.keys(DIFFICULTIES).forEach(function(name){
        difficultyList.appendChild(createDifficultyButton(name));
    });
}

function markCurrentDifficulty() {
    let buttons = difficultyList.querySelectorAll(".difficulty");

    for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].dataset.difficulty == currentDifficulty) {
            buttons[i].classList.add("current");
        }
        else {
            buttons[i].classList.remove("current");
        }
    }
}

function buildDifficultyTable() {
    let rows = [["Level", "Labyrinth", "Lives", "Keys", "Traps", "Extra lives"]];

    Object.keys(DIFFICULTIES).forEach(function(name){
        let setting = DIFFICULTIES[name];
        let cells = mazeCells(setting.maze);

        rows.push([
            setting.label,
            cells + " x " + cells,
            setting.lives,
            setting.keys,
            setting.traps,
            "at " + setting.firstExtraLife + " pts, then every " + setting.extraLifeStep
        ]);
    });

    let table = document.createElement("table");

    rows.forEach(function(row, rowIndex){
        let tableRow = document.createElement("tr");

        row.forEach(function(value){
            let cell = document.createElement(rowIndex == 0 ? "th" : "td");
            cell.textContent = value;
            tableRow.appendChild(cell);
        });

        table.appendChild(tableRow);
    });

    difficultyTable.innerHTML = "";
    difficultyTable.appendChild(table);
}

//create Navigation for the menu
button2.addEventListener("click", function() {
    menu1.classList.remove("open");
    menu2.classList.add("open");
});

button3.addEventListener("click", function() {
    menu2.classList.remove("open");
    menu1.classList.add("open");
});

playAgainButton.addEventListener("click", function() {
    startNewGame();
});

quitButton.addEventListener("click", function() {
    openMainMenu();
});

buildDifficultyMenu();
buildDifficultyTable();
markCurrentDifficulty();
