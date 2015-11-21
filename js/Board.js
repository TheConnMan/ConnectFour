function Board(objectData) {
	this.board = objectData ? this.convertBoard(objectData) : [];
}

Board.prototype.clone = function() {
	var newBoard = new Board();
	newBoard.board = this.copyArray(this.board);
	return newBoard;
};

Board.prototype.convertBoard = function(data) {
	return d3.range(6).map(function(r) {
		return d3.range(7).map(function(c) {
			return data.filter(function(d) {
				return d.id === (5 - r) * 7 + c;
			})[0].val;
		});
	});
};

Board.prototype.isValidMove = function(move) {
	return this.board[0][move] === 0;
};

Board.prototype.getRow = function(move) {
	var r = 5;
	while (this.board[r][move] !== 0) {
		r--;
	}
	return r;
};

Board.prototype.checkWin = function(row, column) {
	return this.checkVert(row, column) || this.checkHor(row, column) || this.checkDiagUpRight(row, column) || this.checkDiagDownRight(row, column);
};

Board.prototype.checkVert = function(row, col) {
	if (row > 2) {
		return false;
	}
	return this.board[row + 1][col] === this.board[row][col] && this.board[row + 2][col] === this.board[row][col] && this.board[row + 3][col] === this.board[row][col];
};

Board.prototype.checkHor = function(row, col) {
	var count = 0;
	var i = Math.max(0, col - 3);
	while (i < 7) {
		count = this.board[row][i] === this.board[row][col] ? count + 1 : 0;
		if (count === 4) {
			return true;
		}
		i++;
	}
	return false;
};

Board.prototype.checkDiagUpRight = function(row, col) {
	var delta = Math.max(row - Math.min(row + 4, 5), Math.max(col - 4, 0) - col);
	var count = 0;
	while (row - delta >= 0 && col + delta <= 6) {
		count = this.board[row - delta][col + delta] === this.board[row][col] ? count + 1 : 0;
		if (count === 4) {
			return true;
		}
		delta++;
	}
	return false;
};

Board.prototype.checkDiagDownRight = function(row, col) {
	var delta = Math.max(Math.max(row - 4, 0) - row, Math.max(col - 4, 0) - col);
	var count = 0;
	while (row + delta <= 5 && col + delta <= 6) {
		count = this.board[row + delta][col + delta] === this.board[row][col] ? count + 1 : 0;
		if (count === 4) {
			return true;
		}
		delta++;
	}
	return false;
};

Board.prototype.copyArray = function(dataArray) {
	return dataArray.map(function(d) {
		return d.slice();
	});
};
