_ = require('./underscore');

process.stdin.resume();
process.stdin.on('data', function(data){
	var input = JSON.parse(data);
	var output = JSON.stringify(ai_func(input));
	process.stdout.write(output);
	process.exit();
});

function ai_func(game){
	if(game.history.length == 0){
		return {
			announce: {
				dice_face: 2,
				count: game.dice_per_player * game.player_count - 1
			}
		};
	}
	return {
		announce: {
			dice_face: _.last(game.history).announce.dice_face,
			count: (_.last(game.history).announce.count + 1)
		}
	};
}
