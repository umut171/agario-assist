all: build
.PHONY: all setup build debug

setup:
	npm install

build:
	mkdir -p build
	rm build/*
	cp src/manifest.json build/manifest.json
	cp src/bandages.js build/bandages.js
	cp src/override.js build/override.js
	cp src/injector.js build/injector.js
	node_modules/.bin/browserify src/injected.js -t babelify -p [minifyify --no-map] --outfile build/injected.js
	node_modules/.bin/browserify src/worker.js -t babelify -p [minifyify --no-map] --outfile build/worker.js

debug:
	node_modules/.bin/babel-node scripts/debug.js
