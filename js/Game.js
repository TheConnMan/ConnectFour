function Game(options) {
	var defaults = {
		selector: '#game',
		board: {
			width: 600,
			height: 600,
			radius: 35
		},
		margin: {
			top: 50,
			bottom: 50
		},
		delay: 300
	};
	this.options = $.extend({}, defaults, options);
	this.divWidth = $(this.options.selector).width();
	this.options.margin.left = this.options.margin.right = Math.max(this.divWidth - this.options.board.width, 0) / 2;
	this.done = false;
	this.initializeSvg();
	this.initializeData();
	this.initializeAIViz();
	this.initializeAI();
	var me = this;
	$('input').change(function() {
		me.initializeAI();
	});
}

Game.prototype.initializeSvg = function() {
	d3.select(this.options.selector).selectAll('svg').remove();
	this.svg = d3.select(this.options.selector).append('svg').attr('width', this.divWidth).attr('height', this.options.board.height + this.options.margin.top + this.options.margin.bottom);
	this.scale = d3.scale.quantize().domain([-1, 0, 1]).range(['red', 'white', 'steelblue']);
	this.aiScale = d3.scale.linear().range(['red', '#BBB', 'green']);
};

Game.prototype.initializeData = function() {
	var me = this;
	this.cData = d3.range(42).map(function(d) {
		return {
			r: me.options.board.radius,
			x: (0.5 + d % 7) * me.options.board.width / 7,
			y: me.options.board.height - (Math.floor(d / 7) + 1) * me.options.board.height / 7,
			id: d,
			val: 0
		};
	});
	this.slots = this.svg.selectAll('.slots').data(me.cData).enter().append('circle').attr('class', 'slots')
		.attr('r', function(d) {
			return d.r;
		}).attr('cx', function(d) {
			return d.x + me.options.margin.left;
		})
		.attr('cy', function(d) {
			return d.y + me.options.margin.top;
		});
	this.sData = {
		r: me.options.board.radius,
		pos: 0
	};
	this.aiData = d3.range(7).map(function(d) {
		return {
			w: me.options.board.radius * 2,
			h: me.options.board.radius,
			x: (0.5 + d) * me.options.board.width / 7 - me.options.board.radius,
			y: me.options.board.height * 6 / 7 + me.options.board.radius + 5,
			i: d
		};
	});
};

Game.prototype.initializeAIViz = function() {
	var me = this;
	this.aiRectangles = me.svg.selectAll('.ai').data(me.aiData).enter().append('rect').attr('width', function(d) {
			return d.w;
		})
		.attr('height', function(d) {
			return d.h;
		}).attr('transform', function(d) {
			return 'translate(' + (me.options.margin.left + d.x) + ',' + (me.options.margin.top + d.y) + ')';
		})
		.style('fill', '#BBB');
	this.aiText = me.svg.selectAll('.aiText').data(me.aiData).enter().append('text').attr('class', 'aiText')
		.attr('transform', function(d) {
			return 'translate(' + (me.options.margin.left + d.x + d.w / 2) + ',' + (me.options.margin.top + d.y + d.h / 2 + 7.5) + ')';
		})
		.text('0');
};

Game.prototype.initializeAI = function() {
	var aiOptions = {
		win: parseInt($('#win').val()),
		lose: parseInt($('#lose').val()),
		tie: parseInt($('#tie').val()),
		multiplier: parseInt($('#mult').val()) / 10,
		depth: parseInt($('#depth').val())
	};
	this.ai = new AI(aiOptions, this);
};

Game.prototype.initUser = function() {
	var me = this;
	this.selector = me.svg.append('circle').attr('class', 'slots selector').attr('r', me.sData.r)
		.attr('cx', me.options.margin.left + (0.5 + me.sData.pos) * me.options.board.width / 7).attr('cy', me.options.margin.top)
		.style('fill', 'steelblue');
	$(document).keydown(function(e) {
		if (e.keyCode === 37) {
			me.moveSelector(-1);
			return false;
		} else if (e.keyCode === 39) {
			me.moveSelector(1);
			return false;
		} else if (e.keyCode === 32) {
			me.select();
			return false;
		}
	});
};

Game.prototype.moveSelector = function(move) {
	var me = this;
	me.sData.pos = (me.sData.pos + move + 7) % 7;
	me.selector.transition().duration(me.options.delay).attr('cx', me.options.margin.left + (0.5 + me.sData.pos) * me.options.board.width / 7);
};

Game.prototype.select = function() {
	var me = this;
	var board = new Board(me.slots.data());
	if (board.isValidMove(me.sData.pos) && !me.done) {
		var row = board.getRow(me.sData.pos);
		board.board[row][me.sData.pos] = 1;
		me.updateBoard((5 - row) * 7 + me.sData.pos, 1);
		if (board.checkWin(row, me.sData.pos, 1)) {
			me.gameEnd(true);
		} else {
			setTimeout(function() {
				var comp = me.ai.move(board);
				board.board[comp.r][comp.c] = -1;
				me.updateBoard((5 - comp.r) * 7 + comp.c, -1);
				if (board.checkWin(comp.r, comp.c, -1)) {
					me.gameEnd(false);
				}
			}, me.options.delay);
		}
	}
};

Game.prototype.initAIvAI = function() {
	var me = this;
	d3.select('#start').on('click', function() {
		me.board = new Board(me.cData);
		me.aiPlay(true);
	});
};

Game.prototype.aiPlay = function(isFirst) {
	var aiOptions = isFirst ? {
		win: parseInt($('#win').val()),
		lose: parseInt($('#lose').val()),
		tie: parseInt($('#tie').val()),
		multiplier: parseInt($('#mult').val()) / 10,
		depth: parseInt($('#depth').val())
	} : {
		win: parseInt($('#win2').val()),
		lose: parseInt($('#lose2').val()),
		tie: parseInt($('#tie2').val()),
		multiplier: parseInt($('#mult2').val()) / 10,
		depth: parseInt($('#depth2').val())
	};
	var ai = new AI(aiOptions, this);
	var me = this;
	var val = isFirst ? 1 : -1;
	var comp = ai.move(me.board);
	me.board.board[comp.r][comp.c] = val;
	me.updateBoard((5 - comp.r) * 7 + comp.c, val);
	if (me.board.checkWin(comp.r, comp.c, val)) {
		me.done = true;
	} else if ($('#auto').is(':checked')) {
		setTimeout(function() {
			me.aiPlay(!isFirst);
		}, me.options.delay);
	}
};

Game.prototype.updateBoard = function(id, value) {
	var me = this;
	this.cData.filter(function(d) {
		return d.id === id;
	})[0].val = value;
	this.slots.data(me.cData).transition().duration(me.options.delay).style('fill', function(d) {
		return me.scale(d.val);
	});
};

Game.prototype.updateAI = function(moves) {
	var me = this;
	var e = d3.extent(moves);
	me.aiScale.domain([e[0], (e[0] + e[1]) / 2, e[1]]);
	me.aiRectangles.transition().duration(me.options.delay).style('fill', function(d) {
		return moves[d.i] !== null ? me.aiScale(moves[d.i]) : 'black';
	});
	me.aiText.text(function(d) {
		return moves[d.i] !== null ? Math.floor(moves[d.i] * 100) / 100 : 0;
	});
};

Game.prototype.gameEnd = function(userWin) {
	this.done = true;
	$('#modalContent').html('<h2>You ' + (userWin ? 'Won' : 'Lost') + '!</h2>');
	$('#gameEnd').reveal({
		animation: 'fadeAndPop',
		animationspeed: 300,
		closeonbackgroundclick: true,
		dismissmodalclass: 'close'
	});
};
