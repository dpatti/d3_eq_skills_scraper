"use strict";

var base = require("node-base"),
	step = require("step");

var css = [];
css.push({ href : "css/reset.css" }, { href : "css/common.css" });

var js = [];

function generateSkills(input)
{
	var data = { css : css, js : js };

	data.name = input.name;
	data.skills = input.skills;
	data.traits = input.traits;

	return data;
}
exports.generateSkills = generateSkills;

function generateEQ(eqData)
{
	var data = { css : css.concat([{ href : "css/tooltip.css"}]), js : js };

	data.eqData = eqData;

	return data;
}
exports.generateEQ = generateEQ;