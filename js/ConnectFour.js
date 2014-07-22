var transitioning = false, pad = 5, delay = 300, started = false;

$(function() {
	connectFour('#game', true);
	$('#aivai').change(function() {
		if ($('#aivai').is(':checked')) {
			$('#second').show();
			connectFour('#game', false);
		} else {
			$('#second').hide();
			connectFour('#game', true);
		}
	})
});

function connectFour(id, user) {
	var w = $(id).width(), done = false;
	var boardW = 600, boardH = 600, r = 35;
	var margin = {top: 50, left: Math.max(w - boardW, 0) / 2, right: Math.max(w - boardW, 0) / 2, bottom: 50};
	d3.select(id).selectAll('svg').remove();
	var svg = d3.select(id).append('svg').attr('width', w).attr('height', boardH + margin.top + margin.bottom);
	
	var scale = d3.scale.quantize().domain([-1, 0, 1]).range(['red', 'none', 'steelblue']);
	
	var cData = d3.range(42).map(function(d) {
		return {r: r, x: (.5 + d % 7) * boardW / 7, y: boardH - (Math.floor(d / 7) + 1) * boardH / 7, id: d, val: 0};
	});
	
	var slots = svg.selectAll('.slots').data(cData).enter().append('circle').attr('class', 'slots')
		.attr('r', function(d) { return d.r; }).attr('cx', function(d) { return d.x + margin.left; })
		.attr('cy', function(d) { return d.y + margin.top; });
	
	var sData = {r: r, pos: 0};
	
	var aiScale = d3.scale.linear().range(['red', '#BBB', 'green']);
	
	var aiData = d3.range(7).map(function(d) {
		return {w: r * 2, h: r, x: (.5 + d) * boardW / 7 - r, y: boardH * 6 / 7 + r + 5, i: d};
	});
	
	var ai = svg.selectAll('.ai').data(aiData).enter().append('rect').attr('width', function(d) { return d.w; })
		.attr('height', function(d) { return d.h; }).attr('transform', function(d) { return 'translate(' + (margin.left + d.x) + ',' + (margin.top + d.y) + ')'; })
		.style('fill', '#BBB');
	
	var aiText = svg.selectAll('.aiText').data(aiData).enter().append('text').attr('class', 'aiText')
		.attr('transform', function(d) { return 'translate(' + (margin.left + d.x + d.w / 2) + ',' + (margin.top + d.y + d.h / 2 + 7.5) + ')'; })
		.text('0');
	
	if (user) {
		var selector = svg.append('circle').attr('class', 'slots selector').attr('r', sData.r)
			.attr('cx', margin.left + (.5 + sData.pos) * boardW / 7).attr('cy', margin.top)
			.style('fill', 'steelblue');
		$(document).keydown(function(e) {
		    if (e.keyCode == 37) { 
		       moveSelector(-1);
		       return false;
		    } else if (e.keyCode == 39) { 
		       moveSelector(1);
		       return false;
		    } else if (e.keyCode == 32) { 
		       select();
		       return false;
		    }
		});
		
		function moveSelector(move) {
			sData.pos = (sData.pos + move + 7) % 7;
			selector.transition().duration(delay).attr('cx', margin.left + (.5 + sData.pos) * boardW / 7);
		}
	} else {
		d3.select('#start').on('click', function() {
			var b = convertBoard(cData);
			aiPlay(b, d3.sum(b, function(r) { return d3.sum(r); }) == 0)
		});
	}
	
	function aiPlay(b, first) {
		var val = first ? 1 : -1;
		var comp = first ? computerMoveAI(b, $('#win').val(), $('#lose').val(), $('#tie').val(), $('#mult').val(), $('#depth').val()) : computerMoveAI(b, $('#win2').val(), $('#lose2').val(), $('#tie2').val(), $('#mult2').val(), $('#depth2').val());
		b[comp.r][comp.c] = val;
		updateBoard((5 - comp.r) * 7 + comp.c, val);
		if (checkWin(b, comp.r, comp.c, val)) {
			done = true;
		} else if ($('#auto').is(':checked')) {
			setTimeout(function() {
				aiPlay(b, !first)
			}, delay)
		}
	}
	
	function select() {
		var b = convertBoard(slots.data());
		if (validMove(sData.pos, b) && !done) {
			var r = getRow(sData.pos, b);
			b[r][sData.pos] = 1;
			updateBoard((5 - r) * 7 + sData.pos, 1);
			if (checkWin(b, r, sData.pos, 1)) {
				gameEnd(true);
			} else {
				setTimeout(function() {
					var comp = computerMoveAI(b, $('#win').val(), $('#lose').val(), $('#tie').val(), $('#mult').val(), $('#depth').val());
					b[comp.r][comp.c] = -1;
					updateBoard((5 - comp.r) * 7 + comp.c, -1);
					if (checkWin(b, comp.r, comp.c, -1)) {
						gameEnd(false);
					}
				}, delay)
			}
		} else {
			console.log('Invalid')
		}
	}
	
	function updateBoard(id, val) {
		cData.filter(function(d) { return d.id == id; })[0].val = val;
		slots.data(cData).transition().duration(delay).style('fill', function(d) { return scale(d.val); })
	}

	function gameEnd(win) {
		done = true;
		$('#modalContent').html('<h2>You ' + (win ? 'Won' : 'Lost') + '!</h2>');
		$('#gameEnd').reveal({
		     animation: 'fadeAndPop',
		     animationspeed: 300,
		     closeonbackgroundclick: true,
		     dismissmodalclass: 'close'
		});
	}

	function computerMoveAI(b, win, lose, tie, mult, depth) {
		var next = winNextTurn(b, true), block = winNextTurn(b, false), moves;
		if (next != -1) {
			moves = d3.range(7).map(function(d) { return d == next ? 1 : 0});
		} else if (block != -1) {
			moves = d3.range(7).map(function(d) { return d == block ? 1 : 0});
		} else {
			moves = recursiveMoves(b, win, lose, tie, mult, depth, 0, false);
		}
		updateAI(moves);
		var top = moves.map(function(d, i) { return {i: i, d: d}; }).filter(function(d) { return d.d == d3.max(moves); });
		var c = top[Math.floor(Math.random() * top.length)].i;
		return {r: getRow(c, b), c: c};
	}
	
	function updateAI(moves) {
		var e = d3.extent(moves)
		aiScale.domain([e[0], (e[0] + e[1]) / 2, e[1]]);
		ai.transition().duration(delay).style('fill', function(d) { return aiScale(moves[d.i]); });
		aiText.text(function(d) { return Math.floor(moves[d.i] * 100) / 100; })
	}
}

function computerMoveBasic(b) {
	var c = Math.floor(Math.random() * 7);
	if (validMove(c, b)) {
		return {r: getRow(c, b), c: c};
	} else {
		return computerMove(b);
	}
}

/**
 * Checks if any move will win next turn.
 * @param b - Board
 * @param isComp - Boolean if the current user is the computer
 * @returns {Number} - Returns winning column if there is one, else -1
 */
function winNextTurn(b, isComp) {
	var result = -1;
	d3.range(7).forEach(function(c) {
		if (validMove(c, b)) {
			var temp = copyArray(b), r = getRow(c, temp);
			temp[r][c] = isComp ? -1 : 1;
			if (checkWin(temp, r, c, isComp ? -1 : 1)) {
				result = c;
			}
		}
	});
	return result;
}

function recursiveMoves(b, win, lose, tie, mult, depth, cur, isComp) {
	return d3.range(7).map(function(c) {
		if (validMove(c, b)) {
			var temp = copyArray(b), r = getRow(c, temp);
			temp[r][c] = -1;
			return recursiveCheck(temp, win, lose, tie, mult, depth, cur, isComp);
		} else {
			return -1000;
		}
	});
}

function recursiveCheck(b, win, lose, tie, mult, depth, cur, isComp) {
	return d3.sum(d3.range(7).map(function(c) {
		if (validMove(c, b)) {
			var temp = copyArray(b), r = getRow(c, temp);
			temp[r][c] = isComp ? -1 : 1;
			if (checkWin(temp, r, c)) {
				return isComp ? win : lose;
			} else {
				if (cur == depth) {
					return tie;
				} else {
					return recursiveCheck(temp, win, lose, tie, mult, depth, cur + 1, !isComp)
				}
			}
		} else {
			return 0;
		}
	})) * mult;
}

/**
 * Checks if the latest move won the game.
 * @param b - Board
 * @param r - Last move row
 * @param c - Last move column
 * @returns {Boolean}
 */
function checkWin(b, r, c) {
	return checkVert(b, r, c) || checkHor(b, r, c) || checkDiagUpRight(b, r, c) || checkDiagDownRight(b, r, c);
}

/**
 * Checks to see if the latest move has won vertically
 * @param b - Board
 * @param r - Last move row
 * @param c - Last move column
 * @returns {Boolean}
 */
function checkVert(b, r, c) {
	if (r > 2) {
		return false;
	} else {
		return b[r + 1][c] == b[r][c] && b[r + 2][c] == b[r][c] && b[r + 3][c] == b[r][c];
	}
}

/**
 * Checks to see if the latest move has won horizontally
 * @param b - Board
 * @param r - Last move row
 * @param c - Last move column
 * @returns {Boolean}
 */
function checkHor(b, r, c) {
	var count = 0;
	var i = Math.max(0, c - 3);
	while (i < 7) {
		count = b[r][i] == b[r][c] ? count + 1 : 0;
		if (count == 4) {
			//console.log('Hor')
			return true;
		} else {
			i++;
		}
	}
	return false;
}

/**
 * Checks to see if the latest move has won diagonally up and to the right
 * @param b - Board
 * @param r - Last move row
 * @param c - Last move column
 * @returns {Boolean}
 */
function checkDiagUpRight(b, r, c) {
	var delta = Math.max(r - Math.min(r + 4, 5), Math.max(c - 4, 0) - c);
	var count = 0;
	while (r - delta >= 0 && c + delta <= 6) {
		count = b[r - delta][c + delta] == b[r][c] ? count + 1 : 0;
		if (count == 4) {
			//console.log('UpRight')
			return true;
		} else {
			delta++;
		}
	}
	return false;
}

/**
 * Checks to see if the latest move has won diagonally down and to the right
 * @param b - Board
 * @param r - Last move row
 * @param c - Last move column
 * @returns {Boolean}
 */
function checkDiagDownRight(b, r, c) {
	var delta = Math.max(Math.max(r - 4, 0) - r, Math.max(c - 4, 0) - c);
	var count = 0;
	while (r + delta <= 5 && c + delta <= 6) {
		count = b[r + delta][c + delta] == b[r][c] ? count + 1 : 0;
		if (count == 4) {
			//console.log('DownRight')
			return true;
		} else {
			delta++;
		}
	}
	return false;
}

/**
 * Converts the UI board into a 2d array
 * @param data - Data from D3 UI
 * @returns {Array}
 */
function convertBoard(data) {
	return d3.range(6).map(function(r) {
		return d3.range(7).map(function(c) {
			return data.filter(function(d) { return d.id == (5 - r) * 7 + c; })[0].val;
		})
	});
}

/**
 * Checks if a move is valid
 * @param move - Proposed column
 * @param board - Board
 * @returns {Boolean}
 */
function validMove(move, board) {
	return board[0][move] == 0;
}

/**
 * Gets the row a valid move will drop to.
 * @param move - Column piece is dropped
 * @param board - Board
 * @returns {Number}
 */
function getRow(move, board) {
	var r = 5;
	while (board[r][move] != 0) {
		r--;
	}
	return r;
}

/**
 * Deep copies a 2d array.
 * @param a - Array to be copied
 * @returns {Array}
 */
function copyArray(a) {
	return a.map(function(d) { return d.slice(); });
}

/**
 * Outputs a 2d representation of the board into a string.
 * @param a - Board
 * @returns
 */
function toString(a) {
	return a.map(function(d) { return d.join(','); }).join('\n');
}
