#!/bin/bash
while read -u 10 line; do
	cd ~/Documents/ConvergeWS/public/pages/
	cp template.html $line.html
done 10<peptides.txt