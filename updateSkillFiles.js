"use strict";

var base = require("node-base"),
	step = require("step"),
	fs = require("fs"),
	C = require("./C"),
	skillGenerator = require("./skillGenerator");

C.heroes.forEach(function(hero)
{
	step(
		function getHeroData()
		{
			skillGenerator.getHeroData(hero, this);
		},
		function saveHeroData(err, heroData)
		{
			if(err)
				throw err;

			fs.writeFile("data/" + hero.id + ".json", JSON.stringify(heroData), "utf8", this);
		},
		function handleErrors(err)
		{
			if(err)
				base.error(err);
		}
	);
});
