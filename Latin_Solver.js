"use strict";

//IIFE for closure
(function() {
    
    /*fields*/
    var canvas, ctx;
    var editing = true;
    var gridSize = 4, maxLetter = 'C', numValues = 3, cellSize = 50, gridPadding = 125;
	//puzzle = stores the puzzle grid and added letters
	//constraints = stores possible values in a byte
	//options = stores number of possible values as an integer
    var	puzzle = [], options = [], numOptions = [], visited = [];
	var maxOptionsByte = 7;
	var currX = -1, currY = -1;
	var letterArr = ['A','B','C','D','E','F','G','H'];
	//solutions = stores all possible solutions
    var solutions = [];
	var controls,result;
	
    /*puzzle grid*/
    //Function name: resizeGrid()
    //(Re)creates 2d arrarys for the puzzle space and the option storage data structures
    //Author: Brian Sandon
    function resizeGrid(){
        puzzle = [];
		options = [];
		numOptions = [];
        visited = [];
		for(var i = 0; i < gridSize; i++){
			var pRow = [];
			var cRow = [];
			var oRow = [];
            var vRow = [];
			for(var j = 0; j < gridSize; j++){
				pRow.push(" ");
				cRow.push(0);
				oRow.push(0);
                vRow.push(false);
			}
			puzzle.push(pRow);
			options.push(cRow);
			numOptions.push(oRow);
            visited.push(vRow);
		}
    }
    
    //Function name: drawGrid(puzzleCpy)
    //Draws the puzzle to the screen
    //Parameters:
    //  puzzleCpy - the copy of the puzzle to be drawn.
    //Author: Brian Sandon
    function drawGrid(puzzleCpy){
        ctx.save();
		
        //clear screen and canvas border
		ctx.strokeStyle = "lightgrey";
		ctx.lineWidth = 2;
		ctx.fillStyle = "white";
		ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
		ctx.strokeRect(0,0,ctx.canvas.width,ctx.canvas.height);
		
		ctx.strokeStyle = "black";
		
		ctx.translate(gridPadding,gridPadding);
		
        //Draw current location.
		if(currX >= 0 && currY >= 0){
			ctx.fillStyle = "lightgreen";
			ctx.fillRect(currX*cellSize,currY*cellSize,cellSize,cellSize);
		}
		
		var gridDimensions = gridSize*cellSize;
		var lineOffset = 0;
		
        //Grid border
		ctx.strokeRect(0,0,gridDimensions,gridDimensions);
        //Draws the vertical and horizontal lines.
		for(var i = 0; i < gridSize;i++){
			
			lineOffset = cellSize*i;
			
			//horizontal lines
			ctx.beginPath();
			ctx.moveTo(0,lineOffset);
			ctx.lineTo(gridDimensions,lineOffset);
			ctx.stroke();
			
			//vertical lines
			ctx.beginPath();
			ctx.moveTo(lineOffset,0);
			ctx.lineTo(lineOffset,gridDimensions);
			ctx.stroke();
			ctx.closePath();
		}
		
		ctx.font = "36pt Arial Black";
		ctx.fillStyle = "black";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		
        //Adds the characters.
		for(var i = 0; i < gridSize;i++){
			for(var j = 0; j < gridSize;j++){
				if(puzzleCpy[i][j] != " "){
					ctx.fillText(puzzleCpy[i][j],(i+0.5)*cellSize,(j+0.5)*cellSize);
				}
			}
		}
		
		ctx.restore();
    }
	
	// Function name: getMouse()
	// returns mouse position in local coordinate system of element
	// Author: Tony Jefferson
	// Last update: 3/1/2014
    // (Reused from Rich Media I demos)
	function getMouse(e){
		var mouse = {}
		mouse.x = e.pageX - e.target.offsetLeft;
		mouse.y = e.pageY - e.target.offsetTop;
		return mouse;
	}
    

    /*Control functions*/
    //Function name: setGridSize()
    //Selection event that sets the dimensions of the puzzle.
    //Author: Brian Sandon
    function setGridSize(e){
        var prevSize = gridSize;
        gridSize = e.target.value;
        
        if (prevSize !== gridSize) {
            resizeGrid();
        }
        
        gridPadding = (ctx.canvas.width-(gridSize*cellSize))/2
		
		drawGrid(puzzle);
    }
    
    //Function name: setMaxLetter()
    //Selection event that sets the range of letters used in the puzzle.
    //Author: Brian Sandon
    function setMaxLetter(e){
        numValues = e.target.value;
        maxLetter = letterArr[numValues-1];
		maxOptionsByte = (1<<(numValues))-1;
    }
	
	//Function name: selectCell()
    //Mouse event that designates the current squere when in editing mode.
    //Author: Brian Sandon
	function selectCell(e){
		if(editing){
			var mouse = getMouse(e);
			if(mouse.x < gridPadding || mouse.x > (gridPadding + gridSize*cellSize) || mouse.y < gridPadding || mouse.y > (gridPadding + gridSize*cellSize)){
				currX = -1;
				currY = -1;
			} else{
				currX = Math.floor((mouse.x - gridPadding)/cellSize);
				currY = Math.floor((mouse.y - gridPadding)/cellSize);
			}
			drawGrid(puzzle);
		}
	}
	
	//Function name: setCellValue()
    //Sets the value of the currently selected cell to the given keypress. Clears the cell if if you click backspace.
    //Author: Brian Sandon
	function setCellValue(e){
		if(editing && currX > -1 && currY > -1){
			if(e.key == "Backspace"){
				puzzle[currX][currY] = " ";
			}else{
				puzzle[currX][currY] = e.key.toUpperCase();
			}
			drawGrid(puzzle);
		}
	}
    
	/*Validity checkers*/
    //Function name: letterInRange(letter)
    //Checks if the given letter is in the valid range for this puzzle.
    //Parameters:
    //  letter - the letter to be checked
    //Author: Brian Sandon
	function letterInRange(letter){
		if(letter == " "){
			return true;
		}
		return (letterArr.slice(0,numValues).indexOf(letter) > -1);
	}
	
    //Function name: checkConstraints(letter,row,col,puzzleCpy)
    //Checks if there are no other instances of the given letter in the given row or column.
    //Returns false if there is a repeat letter.
    //Parameters:
    //  letter - the letter to be checked
    //  row - the row the letter is or will be placed in
    //  col - the column the letter is or will be placed in
    //  puzzleCpy - the copy of the puzzle to be checked
    //Author: Brian Sandon
	function checkConstraints(letter,row,col,puzzleCpy){
		if(letter == " "){
			return true;
		}
		for(var i = 0; i < gridSize; i++){
			if(i != col && puzzleCpy[row][i] == letter){
				return false;
			}
			if(i != row && puzzleCpy[i][col] == letter){
				return false;
			}
		}
		return true;
	}
	
    //Function name: updateConstraints
    //Removes the option for cells in shared rows and columns to have the corrisponding letter.
    //Parameters:
    //  letter - the letter to be used in updating the constaints
    //  row - the row to be updated
    //  col - the col to be updated
    //  optionsCpy - a copy of the options array updated by this function
    //  numOptionsCpy - a copy of the numOptions array updated by this function
    //Author: Brian Sandon
	function updateConstraints(letter,row,col,optionsCpy,numOptionsCpy){
		if(letter == " "){
			return;
		}
		var charVal = 1<<letterArr.indexOf(letter);
        
        optionsCpy[row][col] = charVal;
        numOptionsCpy[row][col] = 0;
		
		for(var i = 0; i < gridSize; i++){
			if(i != col && (optionsCpy[row][i]&charVal)){
				optionsCpy[row][i] &= ~(charVal);
				numOptionsCpy[row][i]--;
			}
			if(i != row && (optionsCpy[i][col]&charVal)){
				optionsCpy[i][col] &= ~(charVal);
				numOptionsCpy[i][col]--;
			}
		}
	}
    
    //Function name: validSolution(puzzleCpy)
    //Checks the validity of this solution.
    //Returns true if the given puzzle has the required characters in every row and column.
    //This function assumes that checkConstraints has already been performed on all values added to the puzzle.
    //Parameters:
    //  puzzleCpy - the puzzle to be checked
    //Author: Brian Sandon
    function validSolution(puzzleCpy){
        var rowValues = 0;
        var colValues = 0;
        for(var i = 0; i < gridSize; i++){
            rowValues = 0;
            colValues = 0;
            
            for(var j = 0; j < gridSize; j++){
                var letterInd1 = letterArr.indexOf(puzzleCpy[i][j])
                if(letterInd1 > -1){
                    rowValues ^= 1<<letterInd1;
                }
                var letterInd2 = letterArr.indexOf(puzzleCpy[j][i])
                if(letterInd2 > -1){
                    colValues ^= 1<<letterInd2;
                }
            }
            
            if(rowValues < maxOptionsByte || colValues < maxOptionsByte){
                return false;
            }
        }
        return true;
    }
    
    //Function name: checkDuplicateSolution(puzzleCpy)
    //Checks the solution list and returns the index of the solution identical to the one given (if there is one)
    //Returns the index if a duplicate is present. If there are no duplicates it returns -1
    //Parameters:
    //  puzzleCpy - the puzzle to be checked
    //Author: Brian Sandon
    function findDuplicateSolution(puzzleCpy){
        var match = true;
        for(var i = 0; i < solutions.length;i++){
            var solution = solutions[i].solution;
            match = true;
            for(var j = 0; j < gridSize; j++){
                for(var k = 0; k < gridSize;k++){
                    if(puzzleCpy[j][k] != solution[j][k]){
                        match = false;
                        break;
                    }
                }
                if(!match){
                    break;
                }
            }
            if(match){
                return i;
            }
        }
        return -1;
        
    }
	
	/*Solution process*/
    //Function name: runSolve()
    //Disables editing
    //Checks for improperly created puzzles and already solved puzzles
    //Prepares the program to solve the puzzle
    //Calls the first batch of recursive functions
    //Displays results.
    //Author: Brian Sandon
	function runSolve(){
        //console.log("solver started");
        
		setControlsDisabled(true);
		solutions = [];
		editing = false;
		currX = -1;
		currY = -1;
        
        /*
        Program runs to quickly to display this. You can uncomment it if you are looking through brakepoints and you want to see the program in action.
        */
        //drawGrid(puzzle);
        
        var occupiedSpaces = [];
		
		//Checks the validity of the "givens"
		if(numValues > gridSize){
			console.log("range error 1");
			result.style.color = "red";
			result.innerHTML = "The range of values does not fit within the grid constraints.";
			setControlsDisabled(false);
			editing = true;
			return;
		}
		for(var i = 0; i < gridSize; i++){
			for(var j = 0; j < gridSize; j++){
				if(!letterInRange(puzzle[i][j])){
					console.log("range error 2");
					result.style.color = "red";
					var error = "The value " + puzzle[i][j] + " is not in the range of values.";
					result.innerHTML = error;
					setControlsDisabled(false);
					editing = true;
					return;
				}
                options[i][j] = maxOptionsByte;
                numOptions[i][j] = numValues;
                
                //var loc = new location(i,j);
                var loc = {};
                loc.x = i;
                loc.y = j;
                Object.seal(loc);
                
                occupiedSpaces.push(loc);
			}
		}
		
        //Checks if there are conflicting starting values
        var tempX,tempY;
		for(var i = 0; i < occupiedSpaces.length; i++){
            tempX = occupiedSpaces[i].x;
            tempY = occupiedSpaces[i].y;
            
            if(!checkConstraints(puzzle[tempX][tempY],tempX,tempY,puzzle)){
                result.style.color = "red";
			    result.innerHTML = "Conflicting starting values.";
			    setControlsDisabled(false);
			    editing = true;
			    return;
            }
            updateConstraints(puzzle[tempX][tempY],tempX,tempY,options,numOptions);
        }
        
        //checks if the problem is already solved
        if(validSolution(puzzle)){
            result.style.color = "DarkGoldenRod";
            result.innerHTML =  "The puzzle is already solved.";
            document.querySelector("#reset").disabled = false;
            return;
        }
        
        result.style.color = "black";
        result.innerHTML =  "Solving...";
        
        //calls potential stating points starting with the locations with the least possibilities.
        var cellsQueue = getQueue(puzzle,numOptions,visited);
        var nextLoc;
        while(!cellsQueue.isEmpty()){
            nextLoc =  cellsQueue.dequeue();
            
            var puzzleCpy = JSON.parse(JSON.stringify(puzzle));
            var optionsCpy = JSON.parse(JSON.stringify(options));
            var numOptionsCpy = JSON.parse(JSON.stringify(numOptions));
            var visitedCpy = JSON.parse(JSON.stringify(visited));
            solveStep(nextLoc,puzzleCpy,optionsCpy,numOptionsCpy,visitedCpy,0);
        }
        
        //Checks the number of solutions found.
        //Only displays the solution if there is a unique solution
        if(solutions.length < 1){
            result.style.color = "red";
            result.innerHTML = "No solutions found.";
        } else if(solutions.length > 1){
            result.style.color = "DarkGoldenRod";
            result.innerHTML =  solutions.length + " solutions found.";
            console.log("Solutions:");
            console.dir(solutions);
        } else{
            result.style.color = "green";
            result.innerHTML =  "One solution found. Difficulty: " + solutions[0].difficulty;
            puzzle = solutions[0].solution;
        }
        currX = -1;
        currY = -1;
        drawGrid(puzzle);
        
        document.querySelector("#reset").disabled = false;
        //console.log("solver finished");
	}
    
    //Function name: solveStep(loc,puzzleCpy,optionsCpy,numOptionsCpy)
    //Recursively solves for all possibile values for the current location.
    //Parameters:
    //  loc - the current location
    //  puzzleCpy - the copy of puzzle used by this step
    //  optionsCpy - the copy of options used by this step
    //  numOptionsCpy - the cpy of options used by this step
    //  difficulty - stores the "difficulty" needed to reach that solution, in this case the number of times the computer needs to choose between multiple values
    //Author: Brian Sandon
    function solveStep(loc,puzzleCpy,optionsCpy,numOptionsCpy,visitedCpy,difficulty){
        var result = false;
        //console.dir(loc);
        
        currX = loc.x;
        currY = loc.y;
        
        visitedCpy[currX][currY] = true;
        
        var currOptions = optionsCpy[currX][currY];
        
        //drawGrid(puzzleCpy);
        
        difficulty += numOptionsCpy[currX][currY] - 1;
        /*
        if(numValues == gridSize){
            if(numOptionsCpy[currX][currY] > 1){
                difficulty += numOptionsCpy[currX][currY] - 1;
            }
        } else{
            if(numOptionsCpy[currX][currY] >= 1){
                difficulty += numOptionsCpy[currX][currY]-0;
            }
        }
        */
        
        for(var i = 0; i < numValues;i++){
            if(currOptions&(1<<i)){
                if(!checkConstraints(letterArr[i],currX,currY,puzzleCpy)){
                    continue;
                }
                var puzzleCpy2 = JSON.parse(JSON.stringify(puzzleCpy));
                var optionsCpy2 = JSON.parse(JSON.stringify(optionsCpy));
                var numOptionsCpy2 = JSON.parse(JSON.stringify(numOptionsCpy));
                var currentResult = setValueStep(letterArr[i],loc,puzzleCpy2,optionsCpy2,numOptionsCpy2,visitedCpy,difficulty);
                if(currentResult){
                    result = true;
                }
            }
        }
        
        var queueCpy = getQueue(puzzleCpy,numOptionsCpy,visitedCpy);
        //console.dir(queueCpy.toArray());
        //console.dir(loc);
        //console.dir(letter);
        while(!queueCpy.isEmpty()){
           //console.dir(queueCpy.toArray());
           var nextLoc = queueCpy.dequeue();
           if(loc.x == nextLoc.x && loc.y == nextLoc.y){
                continue;
           }else{
                var difficultyCpy = difficulty;
                var visitedCpy2 = JSON.parse(JSON.stringify(visitedCpy));
                return solveStep(nextLoc,puzzleCpy,optionsCpy,numOptionsCpy,visitedCpy2,difficultyCpy);
           }
        }
        
        //console.log("End loc step");
        return result;
    }
    
    //Function name: setValueStep(letter,loc,puzzleCpy,optionsCpy,numOptionsCpy)
    //Sets the current location to a given value and calls solveStep for the next location
    //Parameters:
    //  letter - the letter to be set at the current location
    //  loc - the current location
    //  puzzleCpy - the copy of puzzle used by this step
    //  optionsCpy - the copy of options used by this step
    //  numOptionsCpy - the cpy of options used by this step
    //  difficulty - stores the "difficulty" needed to reach that solution, in this case the number of times the computer needs to choose between multiple values
    //Author: Brian Sandon
    function setValueStep(letter,loc,puzzleCpy,optionsCpy,numOptionsCpy,visitedCpy,difficulty){
        puzzleCpy[currX][currY] = letter;
        //drawGrid(puzzleCpy);
        
        updateConstraints(letter,currX,currY,optionsCpy,numOptionsCpy);
        
        if(validSolution(puzzleCpy)){
            var duplicate = findDuplicateSolution(puzzleCpy);
            if(duplicate == -1){
                var answer = {};
                answer.solution = puzzleCpy;
                answer.difficulty = difficulty;
                Object.seal(answer)
                
                solutions.push(answer);
            }else{
                if(solutions[duplicate].difficulty > difficulty){
                    solutions[duplicate].difficulty = difficulty;
                }
            }
            return true;
        }
        
        var queueCpy = getQueue(puzzleCpy,numOptionsCpy,visitedCpy);
        //console.dir(queueCpy.toArray());
        //console.dir(loc);
        //console.dir(letter);
        while(!queueCpy.isEmpty()){
           //console.dir(queueCpy.toArray());
           var nextLoc = queueCpy.dequeue();
           if(loc.x == nextLoc.x && loc.y == nextLoc.y){
                continue;
           }else{
                var difficultyCpy = difficulty;
                var visitedCpy2 = JSON.parse(JSON.stringify(visitedCpy));
                return solveStep(nextLoc,puzzleCpy,optionsCpy,numOptionsCpy,visitedCpy2,difficultyCpy);
           }
        }
        //console.dir(queueCpy.toArray());
        //console.log("End value step");
        return false;
    }
	
	/*misc. methods*/
    //Function name: compareLocations(locA,locB)
    //Compares the number of options at two locations.
    //Returns negative if the first location has more options than the first, poositive if the first location has less than the second,
    //and 0 if the locations have an equal number of options.
    //Parameter:
    //  locA - the first location to be compared
    //  locB - the second location to be compared
    //Author: Brian Sandon
    function compareLocations(locA,locB){
        var priorityA = options[locA.x][locA.y];
        var priorityB = options[locB.x][locB.y];
        return (priorityB-priorityA);
    }
    
    //Function name: setControlsDisabled(disabled)
    //disables/enables the controls for the puzzle solver
    //Parameters:
    //  disabled - true to disable the controls, false to enable the controls
    //Author: Brian Sandon
	function setControlsDisabled(disabled){
		for(var i = 0; i < controls.length; i++){
			controls[i].disabled = disabled;
		}
	}
	
    //Function name: getQueue(puzzleCpy,numOptionsCpy,visitedCpy)
    //Builds and returns the priorityQueue of locations for the current puzzle
    //  puzzleCpy - the copy of puzzle used to build the queue
    //  optionsCpy - the copy of numOptions usedto build the queue
    //Author: Brian Sandon
    function getQueue(puzzleCpy,numOptionsCpy,visitedCpy){
        var newQueue = buckets.PriorityQueue(compareLocations);
        
        //If there is only one letter in a place that must fit a letter, only add items that can have one value.
        //var numOnes = countOnes(puzzleCpy,numOptionsCpy);
        //var onesOnly = (gridSize == numValues && numOnes > 0) || (numOnes > gridSize);
        
        for(var i = 0; i < gridSize; i++){
			for(var j = 0; j < gridSize; j++){
                /*if((numOptionsCpy[i][j] != 1 && onesOnly)){
                    continue;
                }*/
                if(numOptionsCpy[i][j] > 0 && puzzleCpy[i][j] == " " && !(visitedCpy[i][j])){
                    
                    //var loc = new location(i,j);
                    var loc = {};
                    loc.x = i;
                    loc.y = j;
                    Object.seal(loc);
                    
                    newQueue.add(loc);
                }
			}
		}
        /*if(onesOnly){
            console.log(newQueue.toArray());
        }*/
        return newQueue;
    }
    
    /*function countOnes(puzzleCpy,numOptionsCpy){
        var numOnes = 0;
        for(var i = 0; i < gridSize; i++){
			for(var j = 0; j < gridSize; j++){
                if(numOptionsCpy[i][j] == 1){
                    numOnes++;
                }
			}
		}
    }*/
    
    //Function name: clearGrid()
    //Erases the puzzle grid.
    //Author: Brian Sandon
    function clearGrid(){
		for(var i = 0; i < gridSize;i++){
			for(var j = 0; j < gridSize;j++){
				puzzle[i][j] = " ";
			}
		}
        
		drawGrid(puzzle);
    }
    
    //Function name: reset();
    //Enables controls and editing, deletes solutions, and resets the results section.
    //Author: Brian Sandon
    function reset(){
		editing = true;
        setControlsDisabled(false);
        
		solutions = [];
		result.style.color = "black"
		result.innerHTML = "N/A";
		drawGrid(puzzle);
    }
    
    /*Init method*/
    //Function name: init()
    //Initializes the program and sets up the controls
    //Author: Brian Sandon
    function init(){
		document.querySelector("#settings").style.border = "1px solid blue";
        
        canvas = document.querySelector("#canvas");
        ctx = canvas.getContext("2d");
        
		//html elements
		controls = document.querySelectorAll("#settings *");
		result = document.querySelector("#result");
		
        //events
        document.querySelector("#sizeSelector").onchange = setGridSize;
        document.querySelector("#rangeSelector").onchange = setMaxLetter;
		
		document.querySelector("#solve").onclick = runSolve;
        document.querySelector("#clear").onclick = clearGrid;
		document.querySelector("#reset").onclick = reset;
		
		canvas.onmousedown = selectCell;
		document.onkeydown = setCellValue;
		
		resizeGrid();
		drawGrid(puzzle);
    }
    
	window.onload = init;
} ());
