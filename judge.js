var EventEmitter = require('events').EventEmitter;
var _ = require('./underscore');
var spawn = require('child_process').spawn;

var current_player_index = 0;
var loser_player_index = 0;
var dice_per_player = parseInt(process.argv[2]);
var aid = 1;
var history = [];
var round = 0;
var end_count = 0;

function generate_hand(){
	return _.map(_.range(dice_per_player), function(d){
		return Math.floor(Math.random() * 6 + 1);
	}).sort();
}

var players = _.chain(process.argv)
	.rest(3)
	.map(function(prg){
		var player = {};
		player.name = prg + "_" + (aid++);
		if(prg.match(/\.js$/)){
			player.cmd = "node";
		}else if(prg.match(/\.pl$/)){
			player.cmd = "perl";
		}else if(prg.match(/\.py$/)){
			player.cmd = "python";
		}else if(prg.match(/\.rb$/)){
			player.cmd = "ruby";
		}else{
			player.cmd = "type";
		}
		player.cmd_args = [prg];
		player.hand = generate_hand();
		return player;
	})
	.value();

console.log(players);
//process.stdout.write(JSON.stringify(players));

var game = new EventEmitter();
game.on('start', function(){
	console.log('game start');
	game.emit('one_turn');
});
game.on('one_turn', function(){
	round++;
	var cp = players[current_player_index];
	//console.log('one_turn: ' + cp.name);
	var player_process = spawn(cp.cmd, cp.cmd_args);
	var child_input = {};
	child_input.game_finished = false;
	child_input.player_count = players.length;
	child_input.dice_per_player = dice_per_player;
	child_input.my_hand = cp.hand;
	child_input.my_name = cp.name;
	child_input.history = history;
	player_process.stdin.write(JSON.stringify(child_input));
	player_process.stdin.end();
	player_process.stdout.on('data', function(data){
		var cp = players[current_player_index];
		var player_move = JSON.parse(data);
		player_move.name = cp.name;
		console.log(player_move);
		history.push(player_move);
		var result = check_finish();
		if(result){
			console.log("loser: " + players[loser_player_index].name);
			send_result();
		}else{
			current_player_index++;
			if(current_player_index >= players.length){
				current_player_index = 0;
			}
			game.emit('one_turn');
		}
	});
});
game.emit('start');

function send_result(){
	_.each(players, function(cp){
		var child_input = {};
		var player_process = spawn(cp.cmd, cp.cmd_args);
		child_input.game_finished = true;
		child_input.player_count = players.length;
		child_input.dice_per_player = dice_per_player;
		child_input.loser_name = players[loser_player_index].name;
		child_input.all_hands = get_all_hands();
		child_input.my_hand = cp.hand;
		child_input.my_name = cp.name;
		child_input.history = history;
		player_process.stdin.write(JSON.stringify(child_input));
		player_process.stdin.end();
		player_process.stdout.on('end', function(){
			end_count++;
			//console.log("got end response");
			if(end_count >= players.length){
				console.log("game end");
				process.exit();
			}
		});
	});
}

function get_all_hands(){
	var all_hands = {};
	_.each(players, function(cp){
		all_hands[cp.name] = cp.hand;
	});
	return all_hands;
}

function check_finish(){
	if(_.last(history).challenge){
		var one_used = _.chain(history)
			.initial()
			.map(function(h){
				return h.announce.dice_face;
			})
			.any(function(face){return face == 1;})
			.value();
		var target_announce = _.chain(history)
			.last(2)
			.first()
			.value()
			.announce;
		var all_count = _.chain(players)
			.map(function(p){return p.hand})
			.flatten()
			.filter(function(face){
				if(target_announce.dice_face == face){
					return true;
				}else if(!one_used && (face == 1)){
					return true;
				}else{
					return false;
				}
			}).size().value();
		if(target_announce.count > all_count){
			loser_player_index = current_player_index - 1;
			if(loser_player_index < 0){
				loser_player_index = players.length - 1;
			}
			return 'win';
		}else{
			loser_player_index = current_player_index;
			return 'lose';
		}
	}else if(_.last(history).announce.count > players.length * dice_per_player){
		loser_player_index = current_player_index;
		return 'lose';
	}else{
		return false;
	}
}
