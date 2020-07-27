.DEFAULT_GOAL := push
MAKEFLAGS += --silent
SHELL = /usr/bin/env bash

.PHONY: format
format: install
	node_modules/.bin/prettier --write './*.{json,ts}'

.PHONY: install
install:
	npm install

.PHONY: login
login: format
	node_modules/.bin/clasp login 2> /dev/null || true

.PHONY: logout
logout:
	node_modules/.bin/clasp logout

.PHONY: push
push: login
	node_modules/.bin/clasp push
