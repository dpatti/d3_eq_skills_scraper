Description
===========

This code will scrape blizzard's d3 guide, in order to generate static HTML pages that are more useful and more condensed.


Requirements
============

Requires [node.js](http://nodejs.org/) to be installed

I've only tested this under Linux, but it should work fine in Windows and MacOS X


Setup
=====

	git clone git://github.com/Sembiance/d3_eq_skills_scraper.git
	cd d3_eq_skills_scraper
	npm install


Generate Skill Pages
====================

	node updateSkillFiles.js
	node generateSkillPages.js

The first step will download the necessary data into the data subdirectory

The second step will generate the hero.html files in the out subdirectory

You can now open the out/wizard.html and other out/hero.html files


Generate EQ Page
================

	node updateEQFiles.js
	node updateEQPage.js

The first step will download the necessary data into the data subdirectory

The second step will generate the eqAll.html file in the out subdirectory

You can now open the out/eqAll.html file
