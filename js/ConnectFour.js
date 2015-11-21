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
	var game = new Game(options);

	if (user) {
		game.initUser();
	} else {
		game.initAIvAI();
	}
}
