requirejs.config({
    shim: {
        "jquery": {
            exports: "$"
        },
        "bootstrap": {
            deps: ["jquery"]
        },
        "bootstrap-datepicker": {
            deps: ["bootstrap"]
        },
        "bootstrap-table": {
            deps: ["bootstrap"]
        },
        "d3": {
            exports: "d3"
        },
        "d3.layout.cloud": {
            deps: ["d3"]
        },
        "crypto-js-md5": {
            exports: "CryptoJS"
        },
        "historian": {
            deps: ["jquery"]
        },
        "material": {
            deps: ["bootstrap"]
        }
    },
    baseUrl: "core/js/lib",
    paths: {
        core: '../app',
        app: '../../../js/app'
    }
});

var guid = function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
};

window.webHistorianLoaded = false;
window.webHistorianPage = 0;
window.sessionId = guid();
var actionUrls = "";
var studyId = "";

main.page = function() {
    requirejs(["core/database", "greg", "crypto-js-md5", 'app/config',"core/utils"], function(database, greg, CryptoJS, config,utils) {
        
		$("#loading_modal_main").modal("show");
		
		main.database = database;
		
		var tellNotEnough = false;
		
		function enough(weekAgo, firstDate, size) {
			
			function notEnough() {

				tellNotEnough = true;

				window.setTimeout(function() {
					$("#wait_msg").hide();
					$("#loading_modal_main").modal("hide");
					
					for (var i=1;i<=9;i++) {
						$("#wizard_page_"+i).hide();
						$("#wizard_step_"+i).hide();
					}
					$("#wizard_next").hide();
				    $("#step_title").html("Insufficient data");
					$("#not_enough_data").show();
				}, 500);
			}
			
			if (firstDate > weekAgo || firstDate == null){
				notEnough();
				console.log("Less than minimum days set in config.js");
				
				database.logEvent("oldest records less than minimum days set in config.js", {
	                'session_id': window.sessionId
	            });

	            chrome.storage.local.get({
	                'upload_identifier': 'unknown-user',
	                'web_historian_condition': 'unknown'
	            }, function(result) {
					//
	            });

	            if (main.database != undefined) {
	                main.database.uploadEvents(null, null, null);
	            }
			}
			else if (size < config.minRecords) {
				notEnough();
				console.log("Less than minimum records set in config.js");
				database.logEvent("less than minimum records set in config.js", {
	                'session_id': window.sessionId
	            });

	            chrome.storage.local.get({
	                'upload_identifier': 'unknown-user',
	                'web_historian_condition': 'unknown'
	            }, function(result) {
					//
	            });

	            if (main.database != undefined) {
	                main.database.uploadEvents(null, null, null);
	            }
			}
		}
		
		function changeStudyModal () {
			//for each study in the array returned by config.studies , create a button with a button id.
			
			var studies = config.studies;
			$("#study_set_option_buttons").html("")
			studies.forEach(function(item){
				//add the html
				$("#study_set_option_buttons").append("<p><a href='#' id='"+item+"_study_button' class='btn btn-raised btn-primary' style='margin: 0px;'>"+item+"</a></p>");
				//add the on-click functions
				$("#"+item+"_study_button").click(function(){
					studyId = item;
					$("#wizard_study").modal("hide");
				});	
			});
			var ns = config.noneStudies
			$("#study_set_option_buttons").append("<p><a href='#' id='none_study_button' class='btn btn-raised btn-primary' style='margin: 0px;'>"+ns+"</a></p>");
				
			$("#none_study_button").click(function(o){
				studyId = "None";
				$("#wizard_study").modal("hide");
				for (var i=1;i<=9;i++) {
					$("#wizard_page_"+i).hide();
					$("#wizard_step_"+i).hide();
				}
				$("#wizard_next").hide();
				$("#step_title").html("No Study Available");
				$("#need_desc").show();
				$("#no_study_available").show();
			});
			$("#wizard_study").modal("show");
		}

		function getDataTestEnough(weekAgo) {
			database.earliestDate(function(result) {
				if(result != null) {
					var first = new Date(result["visitTime"]); 
					database.fetchRecords(null,null,function(result){
						size = result.length;
						enough(weekAgo, first.getTime(),size);
					});
				}
				else {
					enough(weekAgo, new Date(),0);
				}

			});
		}
		
		var now = new Date();
		daysInSeconds = config.minDays * 86400000;
		weekAgo = now.getTime() - daysInSeconds;
        
        var fetchUrlParameter = function(url, key) {
            key = key.replace(/[\[\]]/g, "\\$&");
            
            var regex = new RegExp("[?&]" + key + "(=([^&#]*)|&|#|$)");
            var results = regex.exec(url);
                
            if (!results) {
                 return null;
            }
            
            if (!results[2]) {
                return null;
            }
            
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        };
        
        var guid = function() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }
            
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
        };
        
        var idDomain = 'webhistorian.org';
        
        database.onSyncStart = function() {
            database.logEvent("url_sync_started", {
                'session_id': window.sessionId
            });
        };
    
        database.onSyncEnd = function() {
            database.logEvent("url_sync_completed", {
                'session_id': window.sessionId
            });
            
            window.webHistorianLoaded = true;
			$("#load_bar").html("");
            
            if (window.webHistorianPage == 3) {
                $("#wizard_next").removeClass("disabled");
            }

            chrome.storage.local.get({
                'upload_identifier': 'unknown-user',
                'web_historian_condition': 'unknown',
                'participation_mode': 'unknown',
                'identifier_updated': '0',
            }, function(result) {
				//should be != explore or == unknown - placeholder to keep always participation mode
				
                if (1==1) {
                    var timestamp = 0;
            
                    var foundId = null;
                    var foundCondition = null;

                    database.filter("visits", "domain", IDBKeyRange.only(idDomain), null, function(cursor) {
                        if (cursor != null) {        
                
                            var visit = cursor.value;
                
                            var id = fetchUrlParameter(visit["url"], "id");
                            var cond = fetchUrlParameter(visit["url"], "cond");
              
              			if (id != null && cond != null) {
                                if (visit["visitTime"] > timestamp) {
                                    foundId = id;
                                    foundCondition = cond;
                                    timestamp = visit["visitTime"];
                  					console.log('Condition: '+foundCondition);
                                }
                            }
                    
                            cursor.continue();
                        } else {
                            var lastUpdated = Number(result['identifier_updated']);
                            
                            if (lastUpdated <= timestamp) {
                                if (foundId == null) {
                                    foundId = greg.sentence().replace(/ /g, '-');
                                }
                    
                                if (foundCondition == null) {
                                    foundCondition = '1'
                                }
                                
                                lastUpdated = timestamp;

                                chrome.storage.local.set({
                                    'upload_identifier': foundId,
                                    'web_historian_condition': foundCondition,
                                    'identifier_updated': '' + lastUpdated
                                }, function(bytesUsed) {

                                });
                            }
							//foundCondition == '1'
							if (tellNotEnough != true) { 
                                $("#wait_msg").hide();
								$("#loading_modal_main").modal("hide");
								if (config.askIdLoad == "Yes") {
									$("#wizard_settings").trigger( "click" );
								}
                                for (var i=4;i<=9;i++) {
                                	$("#wizard_page_"+i).show();
                                }
                                
                                var getSvyUrlBase = $.get(config.actions, function(a){
									actionUrls = a;
									  })
								  .error(function(jqXHR, textStatus, errorThrown){
									console.log("Error getting survey urls!!");//Need to fill in!!
								  })
                                
                                if (config.getIDfromURL == "Yes"){
                                	var idRegex = config.idBaseUrl; 
									dayAgo = new Date(now.getTime() - 86400000);
									var studyPair = config.studyPair;
									var foundIDurl = 0;
								
									database.fetchRecords(dayAgo,null,function(result){
										for (var i = result.length-1; i >= 0; i--) {
											var urlC = result[i].url;
											if (idRegex.test(urlC)) {
												foundIDurl = 1;
												var patt = /.*[\?\&](.*)=(.*)$/;
  												var r = patt.exec(urlC);
  												
  												chrome.storage.local.set({
  													'upload_identifier': r[2]
												}, function() {
													console.log("set user id from url: "+r[2]);
												});
  												if (config.multiStudy=="Yes") {
  												  	for (var y = 0; y<= studyPair.study.length-1;y++) {
														if(r[1]==studyPair.study[y].idKey){
															studyId = studyPair.study[y].studyName;
															break;
														}
													}
  												}
												break;
											} 
										}
										if (foundIDurl == 0) {
											//keep self-gen ID, providing config.js with language and domain info to make a back-up determination
											
											chrome.i18n.getAcceptLanguages(function (list) {
												var lang = chrome.i18n.getUILanguage();
												var langList = list;
												database.fetchRecords(null,null,function(data){
													var domains = utils.countPropDomains(data, "domain");
													studyId = config.studyIdBackup(lang,domains,langList);
													if (studyId == "None"){
														changeStudyModal();
													}
													console.log("Individual ID and studyId not found in URL! Backup method routing to study: "+studyId);
												});
											});
										}
									});
                                } 
                            }
                        }
                    }, function() {

                    });
                    
                } 
               
            });
			getDataTestEnough(weekAgo);
			
        };
            
        database.onSyncProgress = function(length, index) {
            var stepSize = Math.ceil(length / 100);
            
            if ((index % stepSize) == 0) {
                var width = Math.ceil(100 * ((index + 1) / length));
                $(".sync_progress").width(width + "%");
            }
        };

        $("#wizard_participate_upload").click(function(eventObj) { 
            database.logEvent("clicked_participate", {
                'session_id': window.sessionId
            });

            chrome.storage.local.get({
                'upload_identifier': 'unknown-user',
                'web_historian_condition': 'unknown'
            }, function(result) {
            	//console.log(""+result.upload-identifier+""+);
            	if ((config.multiStudy == "Yes")&&(studyId == "None" || studyId == "")) {
            		changeStudyModal();
            		$("#study_set_option_buttons").append("<p data-i18n='__par_again__'>You will need to choose 'Participate' again.</p>")
            		//$("#confirm_upload_modal").modal("hide");
            	} else  {
            	var study_url = config.conditionUrl(true, '1', result,studyId,actionUrls);
            	console.log(study_url);
                $("#confirm_upload_modal_button").off("click");
                $("#confirm_upload_modal_button").click(function(eventObj) {
                    //$("#confirm_upload_modal").modal("hide");
					$("#upload-notice").show();  
                    //rm ID condition

                    //console.log("Country: "+country);
                    window.open(study_url, '_blank');//need to update the country to a variable***!!!
					window.addEventListener("beforeunload", functionToRun); 
						function functionToRun(e) {
    					var confirmationMessage = "You are still uploading data."; //This text doesn't actually show up in modern browsers, the default message is the only option.
    					(e || window.event).returnValue = confirmationMessage; 
    					return confirmationMessage; 
					}
                    if (result['web_historian_condition'] == '1') {
                        console.log("REAL SUBMIT");
    
                        database.uploadPending(function(index, length) {
                            //console.log('CE PROGRESS: ' + index + ' / ' + length);
                        }, function() {
                            console.log('CE COMPLETE');
							window.removeEventListener("beforeunload",functionToRun);
							//$("#confirm_upload_modal").modal("hide");
                            chrome.storage.local.set({
                                'participation_mode': 'prevPar'
                            }, function(bytesUsed) {
                                $("#upload-notice").hide();
								$("#upload-complete-notice").show();
								
                            });
                        }, function(reason) {
                            console.log('CE FAILED: ' + reason);
							$("#upload-fail-notice").show();
                        });
                    } else if (result['web_historian_condition'] == '2') {
                        chrome.storage.local.set({
                            'participation_mode': 'explore'
                        }, function(bytesUsed) {
                            //window.location.reload();
                        });
                    } else {
                        console.log("FAKE SUBMIT");

                        //window.location.reload();
                    }
            	});
					$("#confirm_upload_modal_id").html(result["upload_identifier"]);
					// $("#confirm_upload_modal_condition").html(result["web_historian_condition"]);

				   $("#confirm_upload_modal").modal("show");
				   $("#upload-notice").hide();
				   $("#upload-complete-notice").hide();
				   $("#upload-fail-notice").hide();
                }


            });

            if (main.database != undefined) {
                main.database.uploadEvents(null, null, null);
            }
        });
        
        $("#wizard_no_participate").click(function(eventObj) {
          $("#confirm_return_modal").modal("show");
        });
        
        $("#return_modal_button").click(function(eventObj) {
            database.logEvent("clicked_no_participate", {
                'session_id': window.sessionId
            });

            chrome.storage.local.get({
                'upload_identifier': 'unknown-user',
                'web_historian_condition': 'unknown'
            }, function(result) {
                    //rm id-based diff
                   window.open(config.conditionUrl(false, '0', result), '_blank');

                    database.uploadEvents(null, null, null);

            });

            if (main.database != undefined) {
                main.database.uploadEvents(null, null, null);
            }
        });

        $("#wizard_settings").click(function(eventObj) {
            eventObj.preventDefault();
            if (config.multiStudy=="Yes") {
            		$("#study_found").html("<br/><p><strong data-i18n='__MSG_study__'>Study:</strong> "+studyId+"</p> <a href='#' id='change_study_button' class='btn btn-raised btn-primary' style='margin: 0px;' data-i18n='__MSG_change_study__'>Change Study</a> <hr>");
					$("#change_study_button").click(function(){
						$("#wizard_id_modal").modal("hide");
						changeStudyModal();
					});
            }
            chrome.storage.local.get({
                'upload_identifier': 'unknown-user',
                'web_historian_condition': 'unknown',
                'participation_mode': 'unknown'
            }, function(result) {
                $("#wizard_user_id").val(result['upload_identifier']);
                // $("#wizard_user_condition").val(result['web_historian_condition']);
                
                $("#wizard_id_modal").modal("show");
                
                $("#confirm_wizard_settings_update").off('click');
                
                $("#confirm_wizard_settings_update").click(function(eventObj) {
                    eventObj.preventDefault();
                    
                    // console.log("COND: " + $("#wizard_user_condition").val());
					var we = $("#wizard_user_id").val();
					console.log(we);
					var stripped = we.replace(/\s/g, "");
                    
                    chrome.storage.local.set({
                        'upload_identifier': stripped,
                        //'web_historian_condition': $("#wizard_user_condition").val(),
                        'identifier_updated': '' + Date.now()
                    }, function(bytesUsed) {
                        $("#wizard_id_modal").modal("hide");
                    });
                });
            });
            
            $("#wizard_settings_random_id").off("click");
            $("#wizard_settings_random_id").click(function(eventObj) {
                $("#wizard_user_id").val(greg.sentence().replace(/ /g, '-'));
            });

          $("#confirm_wizard_settings_reset").click(function(eventObj) {
                eventObj.preventDefault();
                
                if (confirm("Reset Web Historian to step-by-step mode to participate in research? This may take a few moments to complete. Your history will be retained.")) {
                    $("#wizard_id_modal").modal("hide");

                    $("#resetting_modal").modal("show");
                    
                    chrome.storage.local.set({
                        'participation_mode': 'reset'
                    }, function() {
                         database.filter('visits', 'transmitted', null, null, function(cursor) {
                            if (cursor) {
                                var updateItem = cursor.value;
                        
                                updateItem['transmitted'] = 0;
                        
                                var request = cursor.update(updateItem);

                                request.onerror = function(e){
                                    console.log('Error adding: ' + e);
                                };

                                request.onsuccess = function() {
                                    cursor.continue();
                                };
                            } else {
                                window.location.reload();
                            }
                        }, function() {
                            console.log('Failed to reset timestamps.');
                        });
                    });
                }
                
                return false;
            });


            if (main.database != undefined) {
                main.database.uploadEvents(null, null, null);
            }
        });

        $("#explore_settings").click(function(eventObj) {
            eventObj.preventDefault();
            
            $("#wizard_settings").click();

            if (main.database != undefined) {
                main.database.uploadEvents(null, null, null);
            }
        });
    });
};

// Start the main app logic.
requirejs(["material", "bootstrap-datepicker", "bootstrap-table", "d3.layout.cloud", "app/config"], function(bs, bsdp, bst, d3lc, config) {
    chrome.storage.local.get({
        'participation_mode': 'unknown'
    }, function(result) {
        //should be prevPar rather than alwaysPar, but this works.
		if (result['participation_mode'] != 'alwasyPar') {
			console.log("par mode: " + result['participation_mode']);
            $("#participation_mode").show();
            $("#exploration_mode").hide();
            //$("#navbar_participate").show();
            $("#navbar_participate").html("<ul class='nav navbar-nav navbar-right'>	<li id='nav_wizard_settings'><a href='#' data-toggle='tooltip' data-placement='bottom' title='"+ chrome.i18n.getMessage('usrset') +"' id='wizard_settings'><i class='material-icons'>face</i></a></li></ul>");
            $("#navbar_explore").hide();
            
            $("#wizard_body").height($(window).height() - (60 + 40 + 59 + 57 + 40));

            $("#wizard_step_1").hide();
            $("#wizard_step_2").hide();
            $("#wizard_step_3").hide();
            $("#wizard_step_4").hide();
            $("#wizard_step_5").hide();
            $("#wizard_step_6").hide();
            $("#wizard_step_7").hide();
            $("#wizard_step_8").hide();
            $("#wizard_step_9").hide();
            $("#wizard_step_10").hide();
			$("#not_enough_data").hide();

            $("#wizard_page_4").hide();
            $("#wizard_page_5").hide();
            $("#wizard_page_6").hide();
            $("#wizard_page_7").hide();
            $("#wizard_page_8").hide();
            $("#wizard_page_9").hide();
            $("#wizard_page_10").hide();
			$("#confirm_wizard_settings_reset").hide();

            var resetPages = function() {
                for (var i = 1; i <= 10; i++) {
                    $("#wizard_page_" + i).parent().removeClass("active");
                    $("#wizard_step_" + i).hide();
                    $("#step_" + i + "_title").hide();
                }
            }

            $("#wizard_next").show();
            $("#wizard_participate_upload").hide();
            $("#wizard_no_participate").hide()
			//$("#wizard_no_participate").show().removeClass("disabled");

            $("#wizard_page_1").click(function(eventObj) {
                eventObj.preventDefault();

                resetPages();

                $("#step_1_title").show();
                
                $("#wizard_step_1").show();
        
                $("#wizard_page_1").parent().addClass("active");

                $("#wizard_next").removeClass("disabled");

                $("#wizard_next").show();
                $("#wizard_participate_upload").hide();
                //$("#wizard_no_participate").show();

                if (main.database != undefined) {
                    main.database.logEvent("clicked_step", { 
                        'step': 1,
                        'session_id': window.sessionId
                    });
                }
        
                document.body.scrollTop = document.documentElement.scrollTop = 0;

                window.webHistorianPage = 1;

                if (main.database != undefined) {
                    main.database.uploadEvents(null, null, null);
                }

                return false;
            });

            $("#wizard_page_2").click(function(eventObj) {
                eventObj.preventDefault();

                resetPages();

                $("#step_2_title").show();
        
                chrome.storage.local.get({
                    'upload_identifier': 'unknown-user',
                    'web_historian_condition': 'unknown'
                }, function(result) {

                    if (result['web_historian_condition'] == '3') {
                        $("#wizard_page_8").html("4");
                        $("#wizard_page_9").html("5");
                    } else if (result['web_historian_condition'] == '4') {
                        $("#wizard_page_9").html("4");
                    }
                });

                $("#wizard_step_2").show();
                $("#wizard_page_2").parent().addClass("active");

                $("#wizard_next").removeClass("disabled");

                $("#wizard_next").show();
                $("#wizard_participate_upload").hide();
                //$("#wizard_no_participate").show();

                main.database.logEvent("clicked_step", { 
                    'step': 2,
                    'session_id': window.sessionId
                });

                document.body.scrollTop = document.documentElement.scrollTop = 0;

                window.webHistorianPage = 2;

                if (main.database != undefined) {
                    main.database.uploadEvents(null, null, null);
                }

                return false;
            });

            $("#wizard_page_3").click(function(eventObj) {
                eventObj.preventDefault();

                resetPages();

                $("#step_3_title").show();

                $("#wizard_step_3").show();
                $("#wizard_page_3").parent().addClass("active");

                $("#wizard_next").removeClass("disabled");

                $("#wizard_next").show();
                $("#wizard_participate_upload").hide();
                //$("#wizard_no_participate").show();

                main.database.logEvent("clicked_step", { 
                    'step': 3,
                    'session_id': window.sessionId 
                });

                document.body.scrollTop = document.documentElement.scrollTop = 0;
                
                if (window.webHistorianLoaded == false) {
                    $("#wizard_next").addClass("disabled");
                } else {
                    $("#wizard_next").removeClass("disabled");
					$("#load_bar").html("");
                }

                window.webHistorianPage = 3;

                if (main.database != undefined) {
                    main.database.uploadEvents(null, null, null);
                }

                return false;
            });

            $("#wizard_page_4").click(function(eventObj) {
                eventObj.preventDefault();

                resetPages();

                $("#step_4_title").show();
				$("#load_bar").html("");

                $("#wizard_step_4").show();
                $("#wizard_page_4").parent().addClass("active");

                $("#wizard_next").removeClass("disabled");
        
                var width = $("#wizard_body").width();
                var height = $("#wizard_body").height();
        
                var side = height;
        
                if (width < height) {
                    side = width;
                }
        
                side -= 75;
        
                if (side < 600) {
                    side = 600;
                }

                $("#websites_visited_visualization").height(side);
                $("#websites_visited_visualization").width(side);

                requirejs(["core/websites-visited", "core/database"], function(websites_visited, database) {
                    chrome.storage.local.get({
                        'web_historian_condition': 'unknown'
                    }, function(result) {
                        var condition = result['web_historian_condition'];
                        
                        database.earliestDate(function(result) {
                            var menu = [{
                                title: 'Delete',
                                action: function(d) {
                                    if (confirm('Do you want to remove ALL visits to URLs from ' + d.__data__.className + ' from Web Historian?')) {
                                        var toDelete = [d.__data__.className];
                            			console.log(toDelete);
                                        database.clearDomains(toDelete, function() {
                                            database.logEvent("domain_urls_deleted_bubbles", { 
                                                'count': d.__data__.value,
                                                'domain_count': 1,
                                                'session_id': window.sessionId
                                            });
                                        
                                            $("#wizard_page_4").click();
                                        });
                                    }
                                }
                            }];
                            
                            if (condition != '1') {
                                menu = [];
                            }
                            
                            if (condition == '2'){
								//
                            }
                            if (condition == '5'){
                                //
                            }

                            websites_visited.display("#websites_visited_visualization", menu, false, "#visits_slider", "#visit_type", "#visit_search", new Date(result["visitTime"]));
                            document.body.scrollTop = document.documentElement.scrollTop = 0;
                        })
                    });
                });

                $("#wizard_next").show();
                $("#wizard_participate_upload").hide();
                //$("#wizard_no_participate").show();

                main.database.logEvent("clicked_step", { 
                    'step': 4,
                    'session_id': window.sessionId
                });

                window.webHistorianPage = 4;

                if (main.database != undefined) {
                    main.database.uploadEvents(null, null, null);
                }

                return false;
            });

            $("#wizard_page_5").click(function(eventObj) {
                eventObj.preventDefault();

                resetPages();

                $("#step_5_title").show();

                $("#wizard_step_5").show();
                $("#wizard_page_5").parent().addClass("active");

                $("#wizard_next").removeClass("disabled");

                var side = $("#wizard_body").height() - 75;
        
                if (side < 600) {
                    side = 600;
                }

                $("#websites_network_visualization").height(side);

                requirejs(["core/websites-network", "core/database"], function(websites_network, database) {
                    chrome.storage.local.get({
                        'web_historian_condition': 'unknown'
                    }, function(result) {
                        var condition = result['web_historian_condition'];

                        database.earliestDate(function(result) {
                            var menu = [{
                                title: 'Delete',
                                action: function(d) {
                                    if (confirm('Do you want to remove ALL visits to URLs from ' + d.__data__.name + ' from Web Historian?')) {
                                        var toDelete = [d.__data__.name];
                        
                                        database.clearDomains(toDelete, function() {
                                            database.logEvent("domain_urls_deleted_network", { 
                                                'count': d.__data__.value,
                                                'domain_count': 1,
                                                'session_id': window.sessionId
                                            });
                                    
                                            $("#wizard_page_5").click();
                                        });
                                    }
                                }
                            }];

                            if (condition != '1') {
                                menu = [];
                            } else if (condition == '2') {
                                //
                            }
                            else if (condition == '5') {
                                //
                            }

                            websites_network.display("#websites_network_visualization", menu, "#network_slider", new Date(result["visitTime"]));
                            document.body.scrollTop = document.documentElement.scrollTop = 0;
                        });
                    });

                    document.body.scrollTop = document.documentElement.scrollTop = 0;
                });

                $("#wizard_next").show();
                $("#wizard_participate_upload").hide();
                //$("#wizard_no_participate").show();

                main.database.logEvent("clicked_step", { 
                    'step': 5,
                    'session_id': window.sessionId
                });

                window.webHistorianPage = 5;

                if (main.database != undefined) {
                    main.database.uploadEvents(null, null, null);
                }

                return false;
            });

            $("#wizard_page_6").click(function(eventObj) {
                eventObj.preventDefault();

                resetPages();

                $("#step_6_title").show();

                $("#wizard_step_6").show();
                $("#wizard_page_6").parent().addClass("active");

                $("#wizard_next").removeClass("disabled");

                var side = $("#wizard_body").height() - 75;
        
                if (side < 600) {
                    side = 600;
                }

                $("#websites_word_cloud_visualization").height(side);

                requirejs(["core/websites-word-cloud", "core/database"], function(websites_network, database) {
                    chrome.storage.local.get({
                        'web_historian_condition': 'unknown'
                    }, function(result) {
                        var condition = result['web_historian_condition'];

                        database.earliestDate(function(result) {
                            var menu = [{
                                title: 'Delete',
                                action: function(d) {
                                    if (confirm('Do you want to remove ALL searches for ' + d.__data__.text + ' from Web Historian?')) {
                                        database.clearSearches(d.__data__.text, function() {
                                            database.logEvent("search_terms_deleted", { 
                                                'search_term_count': 1,
                                                'count': d.__data__.value,
                                                'session_id': window.sessionId
                                            });
                                    
                                            $("#wizard_page_6").click();
                                        });
                                    }
                                },
                                disabled: false 
                            }];
                            
                            if (condition != '1') {
                                menu = [];
                            }
                            
                            if (condition == '2') {
                                //
                            }
                            if (condition == '5') {
                                //
                            }

                            websites_network.display("#websites_word_cloud_visualization", menu, "#word_cloud_slider", new Date(result["visitTime"]));
                            document.body.scrollTop = document.documentElement.scrollTop = 0;
                        });

                        document.body.scrollTop = document.documentElement.scrollTop = 0;
                    });
                });

                $("#wizard_next").show();
                $("#wizard_participate_upload").hide();
                //$("#wizard_no_participate").show();

                main.database.logEvent("clicked_step", { 
                    'step': 6,
                    'session_id': window.sessionId
                });

                window.webHistorianPage = 6;

                if (main.database != undefined) {
                    main.database.uploadEvents(null, null, null);
                }

                return false;
            });

            $("#wizard_page_7").click(function(eventObj) {
                eventObj.preventDefault();

                resetPages();

                $("#step_7_title").show();

                $("#wizard_step_7").show();
                $("#wizard_page_7").parent().addClass("active");

                $("#wizard_next").removeClass("disabled");

                var side = $("#wizard_body").height() - 75;
        
                if (side < 600) {
                    side = 600;
                }

                $("#websites_time_visualization").height(side);

                requirejs(["core/websites-time", "core/database"], function(websites_time, database) {
          
                    chrome.storage.local.get({
                        'web_historian_condition': 'unknown'
                    }, function(result) {
                        var condition = result['web_historian_condition'];
            
                        if (condition == '5') {
                            //
                        }
            
                    });
          
                    database.earliestDate(function(result) {
                        websites_time.display("#websites_time_visualization", [], "#time_slider", new Date(result["visitTime"]));
                        document.body.scrollTop = document.documentElement.scrollTop = 0;
                    })

                    document.body.scrollTop = document.documentElement.scrollTop = 0;
                });

                $("#wizard_next").show();
                $("#wizard_participate_upload").hide();
                //$("#wizard_no_participate").show();

                main.database.logEvent("clicked_step", { 
                    'step': 7,
                    'session_id': window.sessionId
                });

                window.webHistorianPage = 7;

                if (main.database != undefined) {
                    main.database.uploadEvents(null, null, null);
                }

                return false;
            });

            $("#wizard_page_8").click(function(eventObj) {
                eventObj.preventDefault();
        
                resetPages();
				$("#load_bar").html("");

                $("#step_8_title").show();
          
                $("#wizard_step_8").show();
                $("#wizard_page_8").parent().addClass("active");

                $("#wizard_next").removeClass("disabled");

                requirejs(["core/websites-data-table"], function(websites_table) {
                    chrome.storage.local.get({
                        'upload_identifier': 'unknown-user',
                        'web_historian_condition': 'unknown'
                    }, function(result) {
                        var canDelete = (result['web_historian_condition'] != '2') && (result['web_historian_condition'] != '5');

                        websites_table.display("table#data_table", "#data_table_tab_pages", "#data_table_tab_domains", "#wizard_data_table_pills", canDelete);
            
                        var condition = result['web_historian_condition'];

                        if (condition == '3') {
                            //
                        }
                        if (condition == '5') {
                            //
                        }
            
                        document.body.scrollTop = document.documentElement.scrollTop = 0;
                    });
                });

                $("#wizard_next").show();
                $("#wizard_participate_upload").hide();
                //$("#wizard_no_participate").show();

                main.database.logEvent("clicked_step", { 
                    'step': 8,
                    'session_id': window.sessionId
                });

                window.webHistorianPage = 8;
                
                if (main.database != undefined) {
                    main.database.uploadEvents(null, null, null);
                }

                return false;
            });

            $("#wizard_page_9").click(function(eventObj) {
                eventObj.preventDefault();
				if (config.allowNoUpload == "Yes") {
					$("#wizard_no_participate").show().removeClass("disabled");
				}
        
                resetPages();
				$("#load_bar").html("");

                $("#step_9_title").show();

                $("#wizard_step_9").show();
                $("#wizard_page_9").parent().addClass("active");

                $("#wizard_next").addClass("disabled");

                $("#wizard_next").hide();
                $("#wizard_participate_upload").show();

                chrome.storage.local.get({
                    'upload_identifier': 'unknown-user',
                    'web_historian_condition': 'unknown'
                }, function(result) {

                    var condition = result['web_historian_condition'];

                    if (condition == '3') {
                        //
                    } else if (condition == '4') {
                        //
                    }
          
                });

                main.database.logEvent("clicked_step", { 
                    'step': 9,
                    'session_id': window.sessionId
                });
        
                window.webHistorianPage = 9;
        
                if (main.database != undefined) {
                    main.database.uploadEvents(null, null, null);
                }
                return false;
            });

            $("#wizard_page_10").click(function(eventObj) {
                eventObj.preventDefault();

                resetPages();

                $("#step_10_title").show();

                $("#wizard_step_10").show();
                $("#wizard_page_10").parent().addClass("active");

                $("#wizard_next").addClass("disabled");

                $("#wizard_next").hide();
                $("#wizard_participate_upload").show();

                chrome.storage.local.get({
                    'upload_identifier': 'unknown-user',
                    'web_historian_condition': 'unknown'
                }, function(result) {
                    if (result['upload_identifier'].length <= 8) {
                        //no differences
                    }
                });

                main.database.logEvent("clicked_step", { 
                    'step': 10,
                    'session_id': window.sessionId
                });

                window.webHistorianPage = 10;

                if (main.database != undefined) {
                    main.database.uploadEvents(null, null, null);
                }

                return false;
            });

            $("#wizard_next").click(function(eventObj) {
                for (var i = 1; i <= 9; i++) {
                    if ($("#wizard_page_" + i).parent().hasClass("active")) {
                    
                        while ($("#wizard_page_" + (i + 1)).is(":visible") == false && i < 9) {
                            i += 1;
                        }
                    
                        $("#wizard_page_" + (i + 1)).click(); 

                        return;
                    }
                    $(".wh-tooltip").remove();
                }
        
                main.database.logEvent("clicked_next", {
                    'session_id': window.sessionId
                });

                if (main.database != undefined) {
                    main.database.uploadEvents(null, null, null);
                }
            });

            $("#wizard_page_1").click();
        } else {
            $("#participation_mode").hide();
            $("#exploration_mode").show();

            $("#exploration_home").show();
            $("#exploration_visits").hide();
            $("#exploration_search").hide();
            $("#exploration_network").hide();
            $("#exploration_time").hide();
            $("#exploration_table").hide();

            $("#navbar_participate").hide();
            $("#navbar_explore").hide();
        }

        $('[data-toggle="tooltip"]').tooltip()

        window.setTimeout(main.page, 250);
    });
});