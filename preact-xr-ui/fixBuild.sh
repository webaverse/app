#!/bin/bash
var="\/******\/ export default (function(modules) { \/\/ webpackBootstrap"
sed -i "1s/.*/$var/" ./dev/index/index.bundle.js
sed -i "1s/.*/$var/" ./dev/inventory/inventory.bundle.js