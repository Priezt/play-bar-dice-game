#!/usr/bin/env python

import sys
import math

parts = sys.stdin.readline().rstrip().split(':')
player_count = int(parts[0])
dice = [int(d) for d in parts[1].split(',')]
dice_count = len(dice)

#print player_count
#print dice

prob = dict()
for d in range(1, 7):
	prob[d] = 0

for d in dice:
	prob[d] += 1

expected_count = (player_count - 1) * dice_count / 6.0;

for d in range(1, 7):
	prob[d] += expected_count;

for d in range(2, 7):
	prob[d] += prob[1]

#print prob

one_out = False

def get_prob(num):
	if one_out:
		return prob[num] - prob[1]
	else:
		return prob[num]

def is_possible(num, count):
	return get_prob(num) >= count

def get_possible_announce(count):
	for d in [2,3,4,5,6,1]:
		if prob[d] >= count:
			return (d, count)

def increase_all_prob():
	for d in range(1,7):
		prob[d] += 1

while True:
	line = sys.stdin.readline()
	if not line:
		sys.exit()
	#sys.stderr.write('read: %s' % line)
	#sys.stderr.flush()
	if line.rstrip() == 'win':
		sys.exit()
	if line.rstrip() == 'lose':
		sys.exit()
	history = line.rstrip().split(',')
	for h in history:
		parts = h.split('*')
		if parts[0] == '1':
			one_out = True
	if len(line.rstrip()) > 0:
		parts = history[-1].split('*')
		last_number = int(parts[0])
		last_count = int(parts[1])
	else:
		last_number = 2
		last_count = 0
	announce = get_possible_announce(last_count + 1)
	if announce:
		print "%s*%s" % announce
		sys.stdout.flush()
	else:
		if not is_possible(last_number, last_count):
			print "doubt"
			sys.stdout.flush()
		else:
			increase_all_prob()
			announce = get_possible_announce(last_count + 1)
			while not announce:
				increase_all_prob()
				announce = get_possible_announce(last_count + 1)
			print "%s*%s" % announce
			sys.stdout.flush()

