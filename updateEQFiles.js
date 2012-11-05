"use strict";

var base = require("node-base"),
	step = require("step"),
	fs = require("fs"),
	C = require("./C"),
	eqGenerator = require("./eqGenerator");

C.equipment.serialForEach(function(eqtype, cb)
{
	base.info("Processing %s", eqtype);

	step(
		function getData()
		{
			eqGenerator.getEQData(eqtype, this);
		},
		function saveData(err, data)
		{
			if(err)
				throw err;

			fs.writeFile("data/eq-" + eqtype + ".html", "<h1>" + eqtype.toProperCase() + "</h1><br>" + data.join("<hr>"), "utf8", this);
		},
		function processNext(err)
		{
			cb(err);
		}
	);
}, function(err, allEQ)
{
	if(err)
		base.error(err);

	process.exit(0);
});
