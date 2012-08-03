#!/usr/bin/env perl

use Getopt::Std;
use Data::Dumper;
use IPC::Open2;
use IO::Handle;

getopt('dv');

$dice_count = $opt_d || 4;
$current = 0;
@history = ();

#print $dice_count."\n";

@clients = map {{
	'command' => $_
}} @ARGV;

map {
	open2($_->{fh_out}, $_->{fh_in}, $_->{command});
	$_->{fh_in}->autoflush(1);
	$_->{'dice'} = [
		map {
			int(rand(6)) + 1
		} 1..$dice_count
	];
	$fh_in = $_->{fh_in};
	print $fh_in scalar(@clients).":";
	print $fh_in join(',', @{$_->{'dice'}});
	print $fh_in "\n";
	print join(',', @{$_->{'dice'}});
	print "\n";
} @clients;

#print Dumper(\@clients);

sub pp{
	return join(",", map {
		$_->{number}."*".$_->{count}
	} @history)
}

for(1..10){
	print "Current: $current\n" if $opt_v;
	$fh_in = $clients[$current]->{fh_in};
	$fh_out = $clients[$current]->{fh_out};
	print $fh_in pp()."\n";
	print "Send: ".pp()."\n" if $opt_v;
	$announce = <$fh_out>;
	print "announce received\n" if $opt_v;
	unless($announce){
		die "client exit\n";
	}
	chomp($announce);
	print "[".$current."] ".$announce."\n";
	if($announce =~ /^(\d+)\*(\d+)$/){
		push @history, {
			'number' => $1,
			'count' => $2,
		};
	}elsif($announce eq 'doubt'){
		$number = $history[-1]->{number};
		$count = $history[-1]->{count};
		$real_count = get_count($number);
		if($real_count >= $count){
			$loser = $current;
		}else{
			$loser = ($current - 1 + scalar(@clients)) % scalar(@clients);
		}
		for(0..scalar(@clients)-1){
			$fh_in = $clients[$_]->{fh_in};
			print $fh_in (($_ == $loser) ? 'lose' : 'win' )."\n";
			close $fh_in;
			print "[".$_."] ".(($_ == $loser) ? 'lose' : 'win' )."\n";
		}
		last;
	}
	$current++;
	$current %= scalar(@clients);
}

sub get_count{
	$num = shift;
	$one_out = 0;
	if(grep {$_->{number} == 1} @history){
		$one_out = 1;
	}
	return scalar(grep {
		$_ == $num or (not $one_out and $_ == 1)
	} map {
		@{$_->{dice}}
	} @clients);
}

