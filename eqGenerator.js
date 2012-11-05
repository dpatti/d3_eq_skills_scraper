"use strict";

var base = require("node-base"),
	step = require("step"),
	fs = require("fs"),
	request = require("request"),
	cheerio = require("cheerio"),
	dustUtils = require("node-utils").dust,
	dustData = require("./dustData");

function getEQData(eqtype, cb)
{
	step(
		function getHTML()
		{
			request("http://us.battle.net/d3/en/item/" + eqtype + "/", this);
		},
		function processData(err, response, body)
		{
			if(err)
				throw err;

			var doc = cheerio.load(body);

			doc(".item-details").map(function(i, item) { return "<div class=\"item-details\">" + doc(item).html() + "</div>"; }).serialForEach(processItem, this);
		},
		function returnData(err, finalData)
		{
			if(err)
				return cb(err);

			cb(undefined, finalData);
		}
	);
}
exports.getEQData = getEQData;

function processItem(itemHTML, cb)
{
	var itemDoc = cheerio.load(itemHTML);

	if(itemDoc(".item-itemset").length>0)
	{
		step(
			function getSetPageHTML()
			{
				var setPageURL = "http://us.battle.net" + itemDoc("h4.subcategory a").attr("href");
				base.info("Found set, retrieving set page %s", setPageURL);
				request(setPageURL, this);
			},
			function extractSetBonusHTML(err, response, setPageHTML)
			{
				if(err)
					throw err;

				var setDoc = cheerio.load(setPageHTML);
				itemDoc(".item-itemset").replaceWith(setDoc("ul.item-itemset"));
				this();
			},
			function returnResult(err)
			{
				cb(err, itemDoc.html());
			}
		);
	}
	else
	{
		cb(undefined, itemHTML);
	}
}

function generateEQPage(eqData, cb)
{
	step(
		function generatePage()
		{
			dustUtils.render("dust/", "eq", dustData.generateEQ(eqData), this);
		},
		function returnPage(err, output)
		{
			cb(err, output);
		}
	);
}
exports.generateEQPage = generateEQPage;