define([], function () 
{
    var config = {};
    
    config.actionsUrl = "YOUR ACTION URL HERE";
    config.uploadUrl = "UPLOAD URL HERE";
    config.reviewUrl = "REVIEW URL HERE";
    config.fetchIdUrl = "ID GEN URL HERE";
    config.categoriesUrl = "CATEGORIES JSON URL"; 
    
    config.conditionUrl = function(participate, par, metadata) {
        var url = '';
        
        if (participate) {
            url += 'SURVEY URL FOR PARTICIPANTS - EG QUALTRICS' + par + '&conditionRcvd=';
            url += metadata['web_historian_condition'];
            url += '&idRcvd=';
            url += metadata['upload_identifier'];
        
        return url;
    }

    return config;
});
