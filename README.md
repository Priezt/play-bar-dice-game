```bash
./judge.pl [-d <dice_count>] <client_program> [<client_program>...]
```

Example:
```bash
./judge.pl ./naive.py 'nc -l 7777'
```
Then you can do
```bash
nc localhost 7777
```
to play against naive.py

