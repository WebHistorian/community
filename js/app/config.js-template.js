define([], function () 
{
    var config = {};
    
    config.actionsUrl = "YOUR ACTION URL HERE";
    config.uploadUrl = "UPLOAD URL HERE";
    config.reviewUrl = "REVIEW URL HERE";
    config.fetchIdUrl = "ID GEN URL HERE";
    config.categoriesUrl = "https://historian.audacious-software.com/historian/categories.json";
    
    config.conditionUrl = function(participate, par, metadata) {
        var url = '';
        
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
