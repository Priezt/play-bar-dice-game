_ = require('./underscore');

process.stdin.resume();
process.stdin.on('data', function(data){
	var input = JSON.parse(data);
	var output = JSON.stringify(ai_func(input));
	process.stdout.write(output);
	process.exit();
});

function ai_func(game){
	return {
		"challenge":true
	};
}
