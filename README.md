# Web Historian - Community Edition

This is a research data collection tool created by 	[Ericka Menchen-Trevino](http://ericka.cc/). 

### Quick Start

If you just want to run the extension localy to see the interface and visualizations:

* Clone or download the repository
* Rename _locales/en/messages.json-template.json to _locales/en/messages.json
* Remove the folders _locales/nl/ and _locales/pl/
* Rename the file: js/app/config.js-template.js to config.js
* In Chrome, go to chrome://extensions, turn on Developer Mode, and choose Load Unpacked extension, and select the folder where you cloned or downloaded this repository. The extension will also load in Firefox if you prefer. Chrome will say there is an error in the manifest because there are Firefox specific settings, but it does not impact the extension.

### If you use this tool please cite this paper: 

Menchen-Trevino, E. (2016). Web Historian: Enabling multi-method and independent research with real-world web browsing history data. Presented at the iConference, Philadelphia: IDEALS. https://doi.org/10.9776/16611

And/or cite the code itself.

Menchen-Trevino, E., & Karr, C. (2018). Web Historian - Community Edition. Zenodo. https://doi.org/10.5281/zenodo.1322782

### If you are interested in using Web Historian for your own research you will need to:

* Set up a server running [PassiveDataKit-Django](https://github.com/audaciouscode/PassiveDataKit-Django).
* Make sure to clone this repository's submodule (core)
* Customize Web Historian to describe your research in all of the languages your study supports 
  * Rename the file: _locales/en/messages.json-template.json to messages.json and update steps 1, 2 and 9.
  * Remove the locales you do not support.
* Customize the configuration settings
  * Rename the file: js/app/config.js-template.js to config.js and customize the settings and put in your PDK server address.
* (Optional) Customize the categories of websites relevant to your research: core/js/app/categories.json
