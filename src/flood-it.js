
/*Pomodoro*/

const timer = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
  sessions: 0,
};

let interval;

const buttonSound = new Audio('audio/waterdrop.mp3');
const mainButton = document.getElementById('js-btn');
mainButton.addEventListener('click', () => {
  buttonSound.play();
  const { action } = mainButton.dataset;
  if (action === 'start' || action == null) {
    startTimer();
  } else {
    stopTimer();
  }
});

const modeButtons = document.querySelector('#js-mode-buttons');
//modeButtons.addEventListener('click', handleMode);

function getRemainingTime(endTime) {
  const currentTime = Date.parse(new Date());
  const difference = endTime - currentTime;

  const total = Number.parseInt(difference / 1000, 10);
  const minutes = Number.parseInt((total / 60) % 60, 10);
  const seconds = Number.parseInt(total % 60, 10);

  return {
    total,
    minutes,
    seconds,
  };
}

function startTimer() {
  let { total } = timer.remainingTime;
  const endTime = Date.parse(new Date()) + total * 1000;

	if (timer.mode === 'pomodoro') {
 	 	timer.sessions++;
	}
	
  mainButton.dataset.action = 'stop';
  mainButton.textContent = 'stop';
  mainButton.classList.add('active');

  interval = setInterval(function() {
    timer.remainingTime = getRemainingTime(endTime);
    updateClock();

    total = timer.remainingTime.total;
    if (total <= 0) {
      clearInterval(interval);
		let go = true;
      switch (timer.mode) {
        case 'pomodoro':
        	 makeGrid()
          if (timer.sessions % timer.longBreakInterval === 0) {
            switchMode('longBreak');
          } else {
            switchMode('shortBreak');
          }
          break;
        default:
        	 go = false;
          //switchMode('pomodoro');
      }

      if (Notification.permission === 'granted') {
        const text =
          timer.mode === 'pomodoro' ? 'Get back to work!' : 'Take a break!';
        new Notification(text);
      }

      document.querySelector(`[data-sound="${timer.mode}"]`).play();

      if(go) startTimer();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(interval);

  mainButton.dataset.action = 'start';
  mainButton.textContent = 'start';
  mainButton.classList.remove('active');
}

function updateClock() {
  const { remainingTime } = timer;
  const minutes = `${remainingTime.minutes}`.padStart(2, '0');
  const seconds = `${remainingTime.seconds}`.padStart(2, '0');

  const min = document.getElementById('js-minutes');
  const sec = document.getElementById('js-seconds');
  min.textContent = minutes;
  sec.textContent = seconds;

  const text =
    timer.mode === 'pomodoro' ? 'Get back to work!' : 'Take a break!';
  document.title = `${minutes}:${seconds} — ${text}`;


  const progressb = document.getElementById('progessb');
  progressb.style.width = 100*(timer[timer.mode] * 60 - timer.remainingTime.total)/(timer[timer.mode] * 60 ) +'%'
}

function switchMode(mode) {
	//alert('Now '+mode)
	

	
  timer.mode = mode;
  timer.remainingTime = {
    total: timer[mode] * 60,
    minutes: timer[mode],
    seconds: 0,
  };

  document
    .querySelectorAll('button[data-mode]')
    .forEach(e => e.classList.remove('active'));
  document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
  document.body.style.backgroundColor = `var(--${mode})`;


	updateClock();	

}

function handleMode(event) {
  const { mode } = event.target.dataset;

  if (!mode) return;

  switchMode(mode);
  stopTimer();
}

document.addEventListener('DOMContentLoaded', () => {
  if ('Notification' in window) {
    if (
      Notification.permission !== 'granted' &&
      Notification.permission !== 'denied'
    ) {
      Notification.requestPermission().then(function(permission) {
        if (permission === 'granted') {
          new Notification(
            'Awesome! You will be notified at the start of each session'
          );
        }
      });
    }
  }
	mainButton.dataset = 'start'
  switchMode('pomodoro');
});

/*Flood it*/

var size = 14;    //the size of the grid
var turn;
var grid = [];    //internal grid
var original = [];
var cells = [];   //grid of jquery objects
var seen = [];    //marks seen positions during flooding
var computingMode = false;
var computerSolution;
var solverMode = false;
var solved = false;
var solveLabel;
var colours = [];



/**
 * Messages
 */
var successMsg = "You bested the computer!";
var failMsg = "You failed to beat the computer. :(";

/**
 * Clears seen grid
 */
function clearSeen() {
  for(var i = 0; i < size; i++)
    for(var j = 0; j < size; j++)
      seen[i][j] = false;
}

/**
 * Starts a new game
 */
function makeGrid() {

  solved = false;
  
  //initialize grids
  for(var i = 0; i < size; i++) {
    grid[i] = [];
    original[i] = [];
    cells[i] = [];
    seen[i] = [];
  }

  //populate table
  var $table = document.querySelector('#grid'), $tr, $td, rand;

    $table.innerHTML = '';

  for(var i = 0; i < size; i++) {
    $tr = document.createElement('tr');
    for(var j = 0; j < size; j++) {
      rand =  Math.floor(Math.random() * colours.length);
      $td = document.createElement('td');
      $td.className += " cell";
      $td.style.backgroundColor = '#' + colours[rand];
      $td.setAttribute('value', rand);
      $td.style.height = Math.floor(420/size)+"px";
      $td.style.width = Math.floor(420/size)+"px";
      $td.onclick=function(e) {
      	console.log(rand);
			flood(Number(e.target.getAttribute('value')));
		};
      $tr.appendChild($td);
      cells[i][j] = $td;
      grid[i][j] = rand;
      original[i][j] = rand;
    }
    $table.appendChild($tr);
  } 
  computerSolution = computerSolve();
  updateTurn(0);
}

/**
 * Makes the colour changing palette
 */
function makeControls() {
  var $palette = document.querySelector('#palette');

     $palette.innerHTML = '';

  for(var i = 0; i < colours.length; i++) {
    var $button = document.createElement('button');
    $button.className += " palette-colour";
    $button.setAttribute('value', i);
    $button.style.backgroundColor = '#' + colours[i];
    $palette.appendChild($button);
  }

  document.querySelectorAll('.palette-colour').forEach(el => el.onclick=function() {
    flood(Number(el.getAttribute('value')));
  });
}

/**
 * Updates the turn text
 */
function updateTurn(n) {
  turn = n;
  document.querySelector('#counter').innerHTML = n; 
  if(n === 0) {
    document.querySelector('#solve-btn').style.display = "inline-block";
  }
}

/**
 * Resets the game
 */
function reset() {  
  for(var i = 0; i < size; i++) {
    for(var j = 0; j < size; j++) {
      grid[i][j] = original[i][j];
      if(!computingMode)
        cells[i][j].style.backgroundColor = '#' + colours[grid[i][j]];
    }
  }
  updateTurn(0);
}

/**
 * Refreshes the board with a new color
 */
function refresh() {  
  for(var i = 0; i < size; i++)
    for(var j = 0; j < size; j++) {
      cells[i][j].backgroundColor = '#' + colours[grid[i][j]];
    }
}

function countConnected(i, j, c) {
  if(i < 0 || j < 0 || i >= size || j >= size || seen[i][j] || grid[i][j] != c) {
    return 0;
  }
  seen[i][j] = true;
  return countConnected(i, j - 1, c) +
    countConnected(i, j + 1, c) +
    countConnected(i - 1, j, c) +
    countConnected(i + 1, j, c) + 1;
}

/**
 * Recursive flooding helper function.
 * Returns the number of cells of the flooded colour connected to (0, 0)
 * at the end of flooding.
 */
function _flood(i, j, original, replace) {
  if(i < 0 || j < 0 || i >= size || j >= size || seen[i][j]) {
    return 0;
  }
  seen[i][j] = true;
  if (grid[i][j] === original) {
    grid[i][j] = replace;
    if(!computingMode) {
      cells[i][j].style.backgroundColor = '#' + colours[replace];
    }
    return 1 + _flood(i, j + 1, original, replace) +
      _flood(i, j - 1, original, replace) +
      _flood(i + 1, j, original, replace) +
      _flood(i - 1, j, original, replace);
  } else if (grid[i][j] === replace) {
    // Unmark this cell for countConnected.
    seen[i][j] = false;
    return countConnected(i, j, replace);
  }
  return 0;
}

/**
 * Floods the grid with a certain colour
 */
function flood(c) {
  if(grid[0][0] == c) {
    return false;
  }
  clearSeen();
  // Check if number of cells flooded is equal to size of grid.
  var countFlooded = _flood(0, 0, grid[0][0], c);
  var checkSolved = countFlooded === size * size;
  updateTurn(++turn);

  if (!computingMode && !solverMode) {
    if(!solved && checkSolved) {
      if(turn <= computerSolution) {
        alert(successMsg);
        alert("Now work another session to play again");
        switchMode('pomodoro');
        stopTimer()
        startTimer();
      } else {
        alert("Puzzle cleared in " + turn + " moves!");
      }
      solved = true;
      document.querySelector('#solve-btn').style.display="none";
    } else if(computerSolution === turn) {
      alert(failMsg);
    }
  }
  return checkSolved;
}

/**
 * Solver functions
 */

var list = [];
var computerSolution = -1;

function _inspect(i, j) { 
  if(i < 0 || j < 0 || i >= size || j >= size || seen[i][j]) {
    return;
  }
  if(grid[i][j] === grid[0][0]) {
    seen[i][j] = true;
    _inspect(i, j - 1);
    _inspect(i, j + 1);
    _inspect(i - 1, j);
    _inspect(i + 1, j);
  } else {
    list[grid[i][j]] += countConnected(i, j, grid[i][j]);
  }
}

function inspect() {
  clearSeen();
  for(var i = 0; i < colours.length; i++) {
    list[i] = 0;
  }
  _inspect(0, 0);
  var max = 0;
  for(var i = 0; i < colours.length; i++) {
    if(list[i] > list[max]){
      max = i;
    }
  }
  return max;
}

function floodMax() {
  var c = inspect();
  return flood(c);
}

function computerSolve() {
  computingMode = true;
  var computerSolution = 1;
  while(!floodMax()) {
    computerSolution++;
  }
  document.querySelector('#computer-solution').innerHTML = computerSolution;
  reset();
  computingMode = false;
  return computerSolution;
}

/**
 * Solves the puzzle for the user
 */
function solve() {
  var $solve_button = document.querySelector('#solve-btn');
  var robot = setInterval(function() {
    solverMode = true;
    if(floodMax()) {
      clearInterval(robot);
      $solve_button.innerHTML=solveLabel;
    }
    solverMode = false;
  }, 500);
  $solve_button.innerHTML='Stop!';
  //$solve_button.unbind()
  
  var new_element = $solve_button.cloneNode(true);
	$solve_button.parentNode.replaceChild(new_element, $solve_button);
  $solve_button = new_element;
  
  $solve_button.onclick=function() {
    clearInterval(robot);
    $solve_button.innerHTML = solveLabel
    $solve_button.onclick=solve;
  };
}

document.addEventListener("DOMContentLoaded", function(event) { 


  //$('[data-toggle="popover"]').popover();
  //$('[data-toggle="tooltip"]').tooltip();

  colours = ["556270", "4ECDC4", "C7F464", "FF6B6B", "C44D58", "FFA661"];
  //makeGrid();
  makeControls();
  solveLabel = document.querySelector('#solve-btn').innerHTML;
  document.querySelector('#solve-btn').onclick=solve;
  //document.querySelector('#new-game-btn').onclick=makeGrid;
  document.querySelector('#reset-btn').onclick=reset;

 

});

