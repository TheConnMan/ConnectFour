var game;

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
	});
});

function connectFour(id, user, options) {
	game = new Game(options);

	if (user) {
		game.initUser();
	} else {
		game.initAIvAI();
	}
}

function computerMoveAI(b, win, lose, tie, mult, depth) {
	var next = winNextTurn(b, true),
		block = winNextTurn(b, false),
		moves;
	if (next !== -1) {
		moves = d3.range(7).map(function(d) {
			return d === next ? 1 : 0;
		});
	} else if (block !== -1) {
		moves = d3.range(7).map(function(d) {
			return d === block ? 1 : 0;
		});
	} else {
		moves = recursiveMoves(b, win, lose, tie, mult, depth, 0, false);
	}
	updateAI(moves);
	var top = moves.map(function(d, i) {
		return {
			i: i,
			d: d
		};
	}).filter(function(d) {
		return d.d === d3.max(moves);
	});
	var c = top[Math.floor(Math.random() * top.length)].i;
	return {
		r: b.getRow(c, b),
		c: c
	};
}

function updateAI(moves) {
	var e = d3.extent(moves);
	game.aiScale.domain([e[0], (e[0] + e[1]) / 2, e[1]]);
	game.aiRectangles.transition().duration(game.options.delay).style('fill', function(d) {
		return moves[d.i] !== null ? game.aiScale(moves[d.i]) : 'black';
	});
	game.aiText.text(function(d) {
		return moves[d.i] !== null ? Math.floor(moves[d.i] * 100) / 100 : 0;
	});
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
		if (b.isValidMove(c)) {
			var temp = b.clone(),
				r = temp.getRow(c);
			temp.board[r][c] = isComp ? -1 : 1;
			if (temp.checkWin(r, c, isComp ? -1 : 1)) {
				result = c;
			}
		}
	});
	return result;
}

function recursiveMoves(b, win, lose, tie, mult, depth, cur, isComp) {
	return d3.range(7).map(function(c) {
		if (b.isValidMove(c)) {
			var temp = b.clone(),
				r = temp.getRow(c);
			temp.board[r][c] = -1;
			return recursiveCheck(temp, win, lose, tie, mult, depth, cur, isComp);
		} else {
			return null;
		}
	});
}

function recursiveCheck(b, win, lose, tie, mult, depth, cur, isComp) {
	return d3.sum(d3.range(7).map(function(c) {
		if (b.isValidMove(c)) {
			var temp = b.clone(),
				r = temp.getRow(c);
			temp.board[r][c] = isComp ? -1 : 1;
			if (temp.checkWin(r, c)) {
				return isComp ? win : lose;
			} else {
				if (cur === depth) {
					return tie;
				} else {
					return recursiveCheck(temp, win, lose, tie, mult, depth, cur + 1, !isComp);
				}
			}
		} else {
			return 0;
		}
	})) * mult;
}
