define([], function () 
{
    var config = {};
    
    config.actionsUrl = "YOUR ACTION URL HERE"; //from your PDK server
    config.uploadUrl = "UPLOAD URL HERE";
    config.reviewUrl = "REVIEW URL HERE";
    config.fetchIdUrl = "ID GEN URL HERE"; //generate human-friendly random IDs for your project
    config.categoriesUrl = "https://historian.audacious-software.com/historian/categories.json";
    
    config.allowNoUpload = "Yes"; //allows participants to opt-out of the browsing data collection component of the study
    config.askIdLoad = "No"; //ask for an ID (you have given them) when the extension loads
    config.minRecords = 0; //rejects potential participants if they do not have at least this many browsing records
    config.minDays = 0; //rejects potential participants if they do not have records at least this many days old
    
    config.conditionUrl = function(participate, par, metadata) {
        var url = '';
        //your survey MUST be able to accept data via URL strings to receive the ID to match the browsing data to the survey
        if (participate) {
        	//test survey url 
            url += 'https://american.co1.qualtrics.com/jfe/form/SV_9TxEljYL39G8uI5/?par=1' + '&conditionRcvd=';
			url += metadata['web_historian_condition'];
            url += '&idRcvd=';
            url += metadata['upload_identifier'];
            
        } else {
            url += 'https://american.co1.qualtrics.com/jfe/form/SV_9TxEljYL39G8uI5/?par=0' + '&conditionRcvd=';
            url += metadata['web_historian_condition'];
            url += '&idRcvd=';
            url += metadata['upload_identifier'];
        }
        
        return url;
    }

    return config;
});
