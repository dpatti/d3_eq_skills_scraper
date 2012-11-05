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
			fs.readFile("data/" + hero.id + ".json", "utf8", this);
		},
		function generateHeroPage(err, heroJSON)
		{
			if(err)
				throw err;

			skillGenerator.generateSkillPage(Object.merge(JSON.parse(heroJSON), hero), this);
		},
		function sendResults(err, skillPage)
		{
			if(err)
				throw err;

			fs.writeFile("out/" + hero.id + ".html", skillPage, "utf8", this);
		},
		function handleErrors(err)
		{
			if(err)
				base.error(err);
		}
	);
});