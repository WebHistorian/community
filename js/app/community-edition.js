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

main.page = function() {
    requirejs(["core/database", "greg", "crypto-js-md5", 'app/config'], function(database, greg, CryptoJS, config) {
        
		$("#loading_modal_main").modal("show");
		
		main.database = database;
        
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
            
            if (window.webHistorianPage == 3) {
                $("#wizard_next").removeClass("disabled");
            }

            chrome.storage.local.get({
                'upload_identifier': 'unknown-user',
                'web_historian_condition': 'unknown',
                'participation_mode': 'unknown',
                'identifier_updated': '0',
            }, function(result) {
                if (result['participation_mode'] == 'unknown') {
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
                        
                            if (foundCondition == '1') {
                                $("#wait_msg").hide();
								$("#loading_modal_main").modal("hide");
                                $("#wizard_page_4").show();
                                $("#wizard_page_5").show();
                                $("#wizard_page_6").show();
                                $("#wizard_page_7").show();
                                $("#wizard_page_8").show();
                                $("#wizard_page_9").show();
                                $("#wizard_page_10").show();
                            }
                        }
                    }, function() {
                        console.log('ID lookup filter failed.');
                    });
                } 
                else {
                    $("#navbar_explore").show();
					$("#loading_modal_main").modal("hide");
					$("#confirm_wizard_settings_reset").show()

//                  $("#web_historian_id").html(result['upload_identifier']);
//                  $("#web_historian_condition").html('&nbsp;(' + result['web_historian_condition'] + ')');

                    $("#explore_home").click(function(eventObj) {
                        eventObj.preventDefault();

                        $("#exploration_home").show();
                        $("#exploration_visits").hide();
                        $("#exploration_search").hide();
                        $("#exploration_network").hide();
                        $("#exploration_time").hide();
                        $("#exploration_table").hide();
                        
                        if (main.database != undefined) {
                            main.database.uploadEvents(null, null, null);
                        }
                        
                        return false;
                    });

                    $("#explore_visits").click(function(eventObj) {
                        eventObj.preventDefault();

                        $("#exploration_visits").show();
                        $("#exploration_home").hide();
                        $("#exploration_search").hide();
                        $("#exploration_network").hide();
                        $("#exploration_time").hide();
                        $("#exploration_table").hide();

                        var width = $("#exploration_body").width();
                        var height = $("#exploration_body").height();
        
                        var side = height;
        
                        if (width < height) {
                            side = width;
                        }
        
                        side -= 75;
        
                        if (side < 600) {
                            side = 600;
                        }

                        $("#explore_visits_visualization").height(side);
                        $("#explore_visits_visualization").width(side);

                        requirejs(["core/websites-visited", "core/database"], function(websites_visited, database) {
                            database.earliestDate(function(result) {
                                var menu = [{
                                    title: 'View in Data Table',
                                    action: function(d) {
                                        $("#explore_table").click();
                                        
                                        window.setTimeout(function() {
                                            $("#explore_data_table_tab_domains").click();
                                            $("#explore_data_table").bootstrapTable('resetSearch', d.__data__.className);
                                        }, 2500);
                                    },
                                    disabled: false 
                                }, {
                                    title: 'Delete',
                                    action: function(d) {
                                        if (confirm('Do you want to remove ALL visits to URLs from ' + d.__data__.className + ' from Web Historian?')) {
                                            var toDelete = [d.__data__.className];
                                    
                                            database.clearDomains(toDelete, function() {
                                                database.logEvent("domains_deleted", { 
                                                    'count': 1,
                                                    'session_id': window.sessionId
                                                });
                                                
                                                $("#explore_visits").click();
                                            });
                                        }
                                    }
                                }];
                            
                                websites_visited.display("#explore_visits_visualization", menu, true, "#explore_visits_slider", "#explore_visits_type", "#explore_visits_search", new Date(result["visitTime"]));
                                document.body.scrollTop = document.documentElement.scrollTop = 0;
                            })
                        });

                        if (main.database != undefined) {
                            main.database.uploadEvents(null, null, null);
                        }

                        return false;
                    });

                    $("#web_visit_card").click(function(eventObj) {
                        eventObj.preventDefault();
                        
                        $("#explore_visits").click();

                        if (main.database != undefined) {
                            main.database.uploadEvents(null, null, null);
                        }
                    });

                    $("#explore_search").click(function(eventObj) {
                        eventObj.preventDefault();

                        $("#exploration_search").show();
                        $("#exploration_home").hide();
                        $("#exploration_visits").hide();
                        $("#exploration_network").hide();
                        $("#exploration_time").hide();
                        $("#exploration_table").hide();

                        var height = $("#exploration_body").height();

                        var side = height;
        
                        side -= 75;
        
                        if (side < 600) {
                            side = 600;
                        }

                        $("#explore_search_visualization").height(side);

                        requirejs(["core/websites-word-cloud", "core/database"], function(websites_network, database) {
                            database.earliestDate(function(result) {
                                var menu = [{
                                    title: 'View in Data Table',
                                    action: function(d) {
                                        $("#explore_table").click();
                                        
                                        window.setTimeout(function() {
                                            $("#explore_data_table").bootstrapTable('resetSearch', d.__data__.text);
                                        }, 2500);
                                    },
                                    disabled: false 
                                }];

                                websites_network.display("#explore_search_visualization", menu, "#explore_search_slider", new Date(result["visitTime"]));
                                document.body.scrollTop = document.documentElement.scrollTop = 0;
                            });

                            document.body.scrollTop = document.documentElement.scrollTop = 0;
                        });
                        
                        if (main.database != undefined) {
                            main.database.uploadEvents(null, null, null);
                        }
                        return false;
                    });

                    $("#search_words_card").click(function(eventObj) {
                        eventObj.preventDefault();
                        
                        $("#explore_search").click();

                        if (main.database != undefined) {
                            main.database.uploadEvents(null, null, null);
                        }
                    });

                    $("#explore_network").click(function(eventObj) {
                        eventObj.preventDefault();

                        $("#exploration_network").show();
                        $("#exploration_home").hide();
                        $("#exploration_visits").hide();
                        $("#exploration_search").hide();
                        $("#exploration_time").hide();
                        $("#exploration_table").hide();

                        var height = $("#exploration_body").height();

                        var side = height;
        
                        side -= 75;
        
                        if (side < 600) {
                            side = 600;
                        }

                        $("#explore_network_visualization").height(side);

                        requirejs(["core/websites-network", "core/database"], function(websites_network, database) {
                            database.earliestDate(function(result) {
                                var menu = [{
                                    title: 'View in Data Table',
                                    action: function(d) {
                                        $("#explore_table").click();
                                        
                                        window.setTimeout(function() {
                                            $("#explore_data_table_tab_domains").click();
                                            $("#explore_data_table").bootstrapTable('resetSearch', d.__data__.name);
                                        }, 2500);
                                    },
                                    disabled: false 
                                }, {
                                    title: 'Delete',
                                    action: function(d) {
                                        if (confirm('Do you want to remove ALL visits to URLs from ' + d.__data__.name + ' from Web Historian?')) {
                                            var toDelete = [d.__data__.name];
                                    
                                            database.clearDomains(toDelete, function() {
                                                database.logEvent("domains_deleted", {
                                                    'count': 1,
                                                    'session_id': window.sessionId
                                                });
                                                
                                                $("#explore_network").click();
                                            });
                                        }
                                    }
                                }];
                            
                                websites_network.display("#explore_network_visualization", menu, "#explore_network_slider", new Date(result["visitTime"]));
                                document.body.scrollTop = document.documentElement.scrollTop = 0;
                            })

                            document.body.scrollTop = document.documentElement.scrollTop = 0;
                        });

                        if (main.database != undefined) {
                            main.database.uploadEvents(null, null, null);
                        }

                        return false;
                    });

                    $("#network_card").click(function(eventObj) {
                        eventObj.preventDefault();
                        
                        $("#explore_network").click();

                        if (main.database != undefined) {
                            main.database.uploadEvents(null, null, null);
                        }
                    });

                    $("#explore_time").click(function(eventObj) {
                        eventObj.preventDefault();

                        $("#exploration_time").show();
                        $("#exploration_home").hide();
                        $("#exploration_visits").hide();
                        $("#exploration_search").hide();
                        $("#exploration_network").hide();
                        $("#exploration_table").hide();

                        var height = $("#exploration_body").height();

                        var side = height;
        
                        side -= 75;
        
                        if (side < 600) {
                            side = 600;
                        }

                        $("#explore_time_visualization").height(side);

                        requirejs(["core/websites-time", "core/database"], function(websites_time, database) {
                            database.earliestDate(function(result) {
                                var menu = [{
                                    title: 'View in Data Table',
                                    action: function(d) {
                                        $("#explore_table").click();
                                        
                                        window.setTimeout(function() {
                                            console.log("SET DATE");
                                            $("#explore_data_table").bootstrapTable('resetSearch', d.__data__.tableDate);
                                        }, 2500);
                                    },
                                }];

                                websites_time.display("#explore_time_visualization", menu, "#explore_time_slider", new Date(result["visitTime"]));
                                document.body.scrollTop = document.documentElement.scrollTop = 0;
                            })

                            document.body.scrollTop = document.documentElement.scrollTop = 0;
                        });

                        if (main.database != undefined) {
                            main.database.uploadEvents(null, null, null);
                        }
                        
                        return false;
                    });

                    $("#time_card").click(function(eventObj) {
                        eventObj.preventDefault();
                        
                        $("#explore_time").click();

                        if (main.database != undefined) {
                            main.database.uploadEvents(null, null, null);
                        }
                    });

                    $("#explore_table").click(function(eventObj) {
                        eventObj.preventDefault();

                        $("#exploration_table").show();
                        $("#exploration_home").hide();
                        $("#exploration_visits").hide();
                        $("#exploration_search").hide();
                        $("#exploration_network").hide();
                        $("#exploration_time").hide();

                        requirejs(["core/websites-data-table"], function(websites_table) {
                            chrome.storage.local.get({
                                'upload_identifier': 'unknown-user',
                                'web_historian_condition': 'unknown'
                            }, function(result) {
                                var canDelete = (result['web_historian_condition'] != '2') && (result['web_historian_condition'] != '5');

                                websites_table.display("#explore_data_table", "#explore_data_table_tab_pages", "#explore_data_table_tab_domains", "#explore_data_table_pills", canDelete);
                                document.body.scrollTop = document.documentElement.scrollTop = 0;
                            });
                        });

                        if (main.database != undefined) {
                            main.database.uploadEvents(null, null, null);
                        }
                        
                        return false;
                    });

                    $("#exploration_upload").click(function(eventObj) {
                        eventObj.preventDefault();

                        database.logEvent("clicked_upload", {
                            'session_id': window.sessionId
                        });

                        chrome.storage.local.get({
                            'upload_identifier': 'unknown-user',
                            'web_historian_condition': 'unknown'
                        }, function(result) {
                            if (result['web_historian_condition'] == '1') {
                                console.log("REAL SUBMIT");
    
                                database.uploadPending(function(index, length) {
                                    console.log('CE PROGRESS: ' + index + ' / ' + length);
                                }, function() {
                                    console.log('CE COMPLETE');
                                    
                                    alert("Data upload complete.");
                                }, function(reason) {
                                    console.log('CE FAILED: ' + reason);
                                });
                            } else {
                                console.log("FAKE SUBMIT");
                            }
                        });

                        if (main.database != undefined) {
                            main.database.uploadEvents(null, null, null);
                        }

                        return false;
                    });

                    $("#explore_server").click(function(eventObj) {
                        eventObj.preventDefault();

                        database.logEvent("clicked_server_review", {
                            'session_id': window.sessionId
                        });
                        
                        var now = new Date();
                        var month = "" + (now.getMonth() + 1);
                        var day = "" + now.getDate();

                        if (month.length < 2) {
                            month = '0' + month;
                        }

                        if (day.length < 2) {
                            day = '0' + day;
                        }

                        var isoDate = now.getFullYear() + '-' +  month + '-' + day;

                        var sourceId = CryptoJS.MD5(CryptoJS.MD5(result['upload_identifier']).toString() + isoDate).toString();

                        var newURL = config.reviewUrl + sourceId;
                        
                        console.log("OPENING SERVER URL: " + newURL);
                        
                        chrome.tabs.create({ url: newURL });

                        if (main.database != undefined) {
                            main.database.uploadEvents(null, null, null);
                        }

                        return false;
                    });
                    
                    $("#explore_home").click();
                }
            });
        };
            
        database.onSyncProgress = function(length, index) {
            var stepSize = Math.ceil(length / 100);
            
            if ((index % stepSize) == 0) {
                var width = Math.ceil(100 * ((index + 1) / length));
                $(".sync_progress").width(width + "%");
            }
        };

        $("#wizard_participate_upload").click(function(eventObj) { //look here
            database.logEvent("clicked_participate", {
                'session_id': window.sessionId
            });

            chrome.storage.local.get({
                'upload_identifier': 'unknown-user',
                'web_historian_condition': 'unknown'
            }, function(result) {
                $("#confirm_upload_modal_button").off("click");
                $("#confirm_upload_modal_button").click(function(eventObj) {
                    $("#confirm_upload_modal").modal("hide");
                    //rm ID condition
                    window.open(config.conditionUrl(true, '1', result), '_blank');
                    
                
                    window.setTimeout(function() {
                        $("#confirm_modal_title").html("Reload Web Historian?");
                        $("#confirm_modal_body").html("Web Historian needs to reload to verify that you completed the survey.<br /><br />Continue?");
                        $("#confirm_modal_cancel").html("No");
                        $("#confirm_modal_confirm").html("Yes");
                
                        $("#confirm_modal_confirm").off("click");
                
                        $("#confirm_modal_confirm").click(function(e) {
                            window.location.reload();
                        });

                        $("#confirm_modal").modal("show");
                    }, (10 * 60 * 1000));

                    // Exploration mode not enabled until survey is completed. 
                    // Show modal if survey not completed with links before.

                    if (result['web_historian_condition'] == '1') {
                        console.log("REAL SUBMIT");
    
                        database.uploadPending(function(index, length) {
                            console.log('CE PROGRESS: ' + index + ' / ' + length);
                        }, function() {
                            console.log('CE COMPLETE');

                            chrome.storage.local.set({
                                'participation_mode': 'explore'
                            }, function(bytesUsed) {
                                window.location.reload();
                            });
                        }, function(reason) {
                            console.log('CE FAILED: ' + reason);
                        });
                    } else if (result['web_historian_condition'] == '2') {
                        chrome.storage.local.set({
                            'participation_mode': 'explore'
                        }, function(bytesUsed) {
                            window.location.reload();
                        });
                    } else {
                        console.log("FAKE SUBMIT");

                        window.location.reload();
                    }
                });

                $("#confirm_upload_modal_id").html(result["upload_identifier"]);
                // $("#confirm_upload_modal_condition").html(result["web_historian_condition"]);

                $("#confirm_upload_modal").modal("show");
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
                    
                    chrome.storage.local.set({
                        'upload_identifier': $("#wizard_user_id").val(),
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
                    
                    chrome.storage.local.remove([
                        'participation_mode',
                    ], function() {
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
requirejs(["material", "bootstrap-datepicker", "bootstrap-table", "d3.layout.cloud"], function(bs, bsdp, bst, d3lc) {
    chrome.storage.local.get({
        'participation_mode': 'unknown'
    }, function(result) {
        if (result['participation_mode'] == 'unknown') {
            $("#participation_mode").show();
            $("#exploration_mode").hide();

            $("#navbar_participate").show();
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

            $("#wizard_page_4").hide();
            $("#wizard_page_5").hide();
            $("#wizard_page_6").hide();
            $("#wizard_page_7").hide();
            $("#wizard_page_8").hide();
            $("#wizard_page_9").hide();
            $("#wizard_page_10").hide();
			$("#confirm_wizard_settings_reset").hide()

            var resetPages = function() {
                for (var i = 1; i <= 10; i++) {
                    $("#wizard_page_" + i).parent().removeClass("active");
                    $("#wizard_step_" + i).hide();
                }
            }

            $("#wizard_next").show();
            $("#wizard_participate_upload").hide();
            $("#wizard_no_participate").show().addClass("disabled");

            $("#wizard_page_1").click(function(eventObj) {
                eventObj.preventDefault();

                resetPages();

                $("#step_title").html("Step 1: Welcome to Web Historian - Community Edition");

                $("#wizard_step_1").show();
        
                $("#wizard_page_1").parent().addClass("active");

                $("#wizard_next").removeClass("disabled");

                $("#wizard_next").show();
                $("#wizard_participate_upload").hide();
                $("#wizard_no_participate").show();

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

                $("#step_title").html("Step 2: Research Project");
        
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
                $("#wizard_no_participate").show();

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

                $("#step_title").html("Step 3: Where is your web browsing history?");

                $("#wizard_step_3").show();
                $("#wizard_page_3").parent().addClass("active");

                $("#wizard_next").removeClass("disabled");

                $("#wizard_next").show();
                $("#wizard_participate_upload").hide();
                $("#wizard_no_participate").show();

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

                $("#step_title").html("Step 4: Review Your Data: Visits &amp; Habits");
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
                            
                                        database.clearDomains(toDelete, function() {
                                            database.logEvent("domains_deleted", { 
                                                'count': 1,
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
                $("#wizard_no_participate").show();

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

                $("#step_title").html("Step 5: Review Your Data: Site Links");

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
                                            database.logEvent("domains_deleted", { 
                                                'count': 1,
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
                $("#wizard_no_participate").show();

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

                $("#step_title").html("Step 6: Review Your Data: Web Searches");

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
                                                'count': 1,
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
                $("#wizard_no_participate").show();

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

                $("#step_title").html("Step 7: When You Use the Web");

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
                $("#wizard_no_participate").show();

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

                $("#step_title").html("Step 8: Your Web Usage History");
          
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
                $("#wizard_no_participate").show();

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
        
                resetPages();
				$("#load_bar").html("");

                $("#step_title").html("Step 9");

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

                $("#step_title").html("Step 10");

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