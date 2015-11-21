function AI(options, game) {
	var defaults = {
		win: 1,
		lose: -1,
		tie: 0,
		multiplier: 0.25,
		depth: 4
	};
	this.options = $.extend({}, defaults, options);
	this.game = game;
}

AI.prototype.move = function(board) {
	var moves = this.calculateMove(board);
	this.game.updateAI(moves);
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
		r: board.getRow(c),
		c: c
	};
};

AI.prototype.calculateMove = function(board) {
	var next = this.winNextTurn(board, true);
	var block = this.winNextTurn(board, false);
	if (next !== -1) {
		return d3.range(7).map(function(d) {
			return d === next ? 1 : 0;
		});
	}
	if (block !== -1) {
		return d3.range(7).map(function(d) {
			return d === block ? 1 : 0;
		});
	}
	return this.recursiveMoves(board, 0, false);
};

AI.prototype.winNextTurn = function(board, isAIsTurn) {
	for (var col = 0; col < 7; col++) {
		if (board.isValidMove(col)) {
			var temp = board.clone();
			var row = temp.getRow(col);
			temp.board[row][col] = isAIsTurn ? -1 : 1;
			if (temp.checkWin(row, col)) {
				return col;
			}
		}
	}
	return -1;
};

AI.prototype.recursiveMoves = function(board, currentDepth, isAIsTurn) {
	var me = this;
	return d3.range(7).map(function(col) {
		if (board.isValidMove(col)) {
			var temp = board.clone();
			var row = temp.getRow(col);
			temp.board[row][col] = -1;
			return me.recursiveCheck(temp, currentDepth, isAIsTurn);
		} else {
			return null;
		}
	});
};

AI.prototype.recursiveCheck = function(board, currentDepth, isAIsTurn) {
	var me = this;
	return d3.sum(d3.range(7).map(function(col) {
		if (board.isValidMove(col)) {
			var temp = board.clone();
			var row = temp.getRow(col);
			temp.board[row][col] = isAIsTurn ? -1 : 1;
			if (temp.checkWin(row, col)) {
				return isAIsTurn ? me.options.win : me.options.lose;
			} else {
				if (currentDepth === me.options.depth) {
					return me.options.tie;
				} else {
					return me.recursiveCheck(temp, currentDepth + 1, !isAIsTurn);
				}
			}
		} else {
			return 0;
		}
	})) * me.options.multiplier;
};
