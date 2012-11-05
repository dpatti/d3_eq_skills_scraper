Description
===========

This code will scrape blizzard's d3 guide, in order to generate static HTML pages that are more useful and more condensed.

I only tested this in linux, but it should work anywhere.


Setup
=====

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
