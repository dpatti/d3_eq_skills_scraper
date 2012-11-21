"use strict";

var base = require("node-base"),
	step = require("step"),
	fs = require("fs"),
	C = require("./C"),
	eqGenerator = require("./eqGenerator");


C.equipment.serialForEach(function(eqtype, cb)
{
	fs.readFile("data/eq-" + eqtype +".html", "utf8", cb);
}, function(err, allEQ)
{
	step(
		function generateEQPage()
		{
			eqGenerator.generateEQPage(allEQ.join("\n"), this);
		},
		function sendResults(err, eqPage)
		{
			if(err)
				throw err;

			fs.writeFile("out/eqAll.html", eqPage, "utf8", this);
		},
		function handleErrors(err)
		{
			if(err)
				base.error(err);

			process.exit(0);
		}
	);
});
