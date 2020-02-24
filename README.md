# Web Historian - Community Edition

This is a research data collection tool created by [Ericka Menchen-Trevino](http://ericka.cc/). 

### Quick Start

If you just want to run the extension locally to see the interface and visualizations:

* Download the repository including the core submodule. You may use `git clone --recurse-submodules`.
* Rename `manifest.json-template.json` to `manifest.json`.
* Create the folder `_locales/en/` and rename `_locales/en_messages.json-template.json` to `_locales/en/messages.json`.
* Rename the file `js/app/config.js-template.js` to `config.js`.
* In Chrome, go to chrome://extensions, turn on Developer Mode, and choose Load Unpacked extension, and select the folder where you cloned or downloaded this repository. The extension will also load in Firefox if you prefer. Chrome will say there is an error in the manifest because there are Firefox specific settings, but it does not impact the extension.

### If you use this tool please cite this paper: 

Menchen-Trevino, E. (2016). Web Historian: Enabling multi-method and independent research with real-world web browsing history data. Presented at the iConference, Philadelphia: IDEALS. https://doi.org/10.9776/16611

And/or cite the code itself.

Menchen-Trevino, E., & Karr, C. (2018). Web Historian - Community Edition. Zenodo. https://doi.org/10.5281/zenodo.1322782

### If you are interested in using Web Historian for your own research you will need to:

* Set up a server running [PassiveDataKit-Django](https://github.com/audaciouscode/PassiveDataKit-Django).
* Download the repository including the core submodule. You may use `git clone --recurse-submodules`.
* Rename `manifest.json-template.json` to `manifest.json` and configure the version number and the default locale.
* Customize Web Historian to describe your research in all of the languages your study supports
	* Rename `_locales/xx_messages.json-template.json` to `_locales/xx/messages.json` for each language code `xx`.
	* Edit at least messages `html0021`, `html0029` and `html0054`.
* Customize the configuration settings
	* Rename `js/app/config.js-template.js` to `config.js` and customize the settings and put in your PDK server address.
* (Optional) Customize the categories of websites relevant to your research by editing the file `core/js/app/categories.json`.
