"use strict";

var base = require("node-base"),
	step = require("step"),
	fs = require("fs"),
	request = require("request"),
	dustUtils = require("node-utils").dust,
	dustData = require("./dustData");

function getHeroData(hero, cb)
{
	step(
		function getData()
		{
			var url = "http://us.battle.net/d3/en/data/calculator/" + hero.id;
			base.info("Retrieving %s", url);
			request(url, this);
		},
		function returnData(err, response, body)
		{
			cb(err, Object.merge(JSON.parse(body), hero));
		}
	);
}
exports.getHeroData = getHeroData;

function generateSkillPage(heroData, cb)
{
	step(
		function generatePage()
		{
			dustUtils.render("dust/", "hero", dustData.generateSkills(heroData), this);
		},
		function returnPage(err, output)
		{
			cb(err, output);
		}
	);
}
exports.generateSkillPage = generateSkillPage;