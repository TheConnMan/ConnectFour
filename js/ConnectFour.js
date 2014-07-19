var transitioning = false, pad = 5, delay = 300;

$(function() {
	connectFour('#game')
});

function connectFour(id) {
	var w = $(id).width(), done = false;
	var boardW = 600, boardH = 600, r = 30;
	var margin = {top: 50, left: Math.max(w - boardW, 0) / 2, right: Math.max(w - boardW, 0) / 2, bottom: 50};
	var svg = d3.select(id).append('svg').attr('width', w).attr('height', boardH + margin.top + margin.bottom);
	
	var scale = d3.scale.quantize().domain([-1, 0, 1]).range(['red', 'none', 'steelblue']);
	
	var cData = d3.range(42).map(function(d) {
		return {r: r, x: (.5 + d % 7) * boardW / 7, y: boardH - (Math.floor(d / 7) + 1) * boardH / 7, id: d, val: 0};
	});
	
	var slots = svg.selectAll('.slots').data(cData).enter().append('circle').attr('class', 'slots')
		.attr('r', function(d) { return d.r; }).attr('cx', function(d) { return d.x + margin.left; })
		.attr('cy', function(d) { return d.y + margin.top; }).on('click', function(d) { console.log(d); });
	
	var sData = {r: r, pos: 0};
	
	var selector = svg.append('circle').attr('class', 'selector').attr('r', sData.r)
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
					var comp = computerMove(b);
					b[comp.r][comp.c] = -1;
					updateBoard(comp.r * 7 + comp.c, -1);
					if (checkWin(b, comp.r, comp.c, -1)) {
						gameEnd(false);
					}
				}, 300)
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
}

function computerMove(b) {
	var c = Math.floor(Math.random() * 7);
	if (validMove(c, b)) {
		return {r: 5 - getRow(c, b), c: c};
	} else {
		return computerMove(b);
	}
}

function checkWin(b, r, c, val) {
	return checkVert(b, r, c, val) || checkHor(b, r, c, val) || checkDiagUpRight(b, r, c, val) || checkDiagDownRight(b, r, c, val);
}

function checkVert(b, r, c, val) {
	if (r > 2) {
		return false;
	} else {
		return b[r + 1][c] == val && b[r + 2][c] == val && b[r + 3][c] == val;
	}
}

function checkHor(b, r, c, val) {
	var count = 0;
	var i = Math.max(0, c - 3);
	while (i < 7) {
		count = b[r][i] == val ? count + 1 : 0;
		if (count == 4) {
			console.log('Hor')
			return true;
		} else {
			i++;
		}
	}
	return false;
}

function checkDiagUpRight(b, r, c, val) {
	var delta = Math.max(r - Math.min(r + 4, 5), Math.max(c - 4, 0) - c);
	var count = 0;
	while (r - delta >= 0 && c + delta <= 6) {
		count = b[r - delta][c + delta] == val ? count + 1 : 0;
		if (count == 4) {
			console.log('UpRight')
			return true;
		} else {
			delta++;
		}
	}
	return false;
}

function checkDiagDownRight(b, r, c, val) {
	var delta = Math.max(Math.max(r - 4, 0) - r, Math.max(c - 4, 0) - c);
	var count = 0;
	while (r + delta <= 5 && c + delta <= 6) {
		count = b[r + delta][c + delta] == val ? count + 1 : 0;
		if (count == 4) {
			console.log('DownRight')
			return true;
		} else {
			delta++;
		}
	}
	return false;
}

function convertBoard(data) {
	return d3.range(6).map(function(r) {
		return d3.range(7).map(function(c) {
			return data.filter(function(d) { return d.id == (5 - r) * 7 + c; })[0].val;
		})
	});
}

function validMove(move, board) {
	return board[0][move] == 0;
}

function getRow(move, board) {
	var r = 5;
	while (board[r][move] != 0) {
		r--;
	}
	return r;
}

function toString(a) {
	return a.map(function(d) { return d.join(','); }).join('\n');
}