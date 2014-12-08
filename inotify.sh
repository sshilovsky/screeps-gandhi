#!/bin/sh
while true
do
    ls [0-9]*.js
    cat [0-9]*.js | tee full.js | xclip -selection clipboard -i
    inotifywait -e close_write [0-9]*.js
    sleep 1s
done
