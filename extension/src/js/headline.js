// Based on options
var CYCLE_INTERVAL = 5;
var CYCLE = false;
var CATEGORIES = "all";
// Depends on NYT API
var MAX_STORIES = 20;

// Restores interval and cycle using the preferences
// stored in chrome.storage.
function restoreOptions() {
    chrome.storage.sync.get({
        interval: 5,
        categories: "all",
        cycle: false
    }, function(items) {
        CATEGORIES = items.categories;
        CYCLE_INTERVAL = items.interval;
        CYCLE = items.cycle;
    });
}
// Restore options from local storage
document.addEventListener('DOMContentLoaded', restoreOptions);

function displayStories(numResults, results) {
    var result = getStory(numResults, results);
    var title = result[0];
    var randomNum = result[1];
    var link = results[randomNum].url;
    var abstract = "&ldquo;" + results[randomNum].abstract + "&rdquo;";
    document.getElementById("insert").setAttribute('href', link);
    document.getElementById("insert").setAttribute('title', "Link to NYT article");
    document.getElementById("insert").innerHTML = title;
    document.getElementById("abstract").innerHTML = abstract;
    // Fade in
    $("#insert").hide().fadeIn();
    $("#abstract").hide().fadeIn();
}

function callAPI() {
    var public = secret;
    var queryURL = "https://api.nytimes.com/svc/news/v3/content/all/" + CATEGORIES + "/.json?api-key=" + public.API_KEY;
    $(document).ready(function() {
        $.ajax({
            url: queryURL,
            dataType: "json",
            statusCode: {
                502: function() {
                    console.log("Error 502 thrown.");
                }
            },
            success: function(queryResult) {
                // get array of all headlines
                var results = queryResult.results;
                var numResults = queryResult.num_results;

                if (numResults > 0) {
                    CYCLE ? window.setInterval(function() { displayStories(numResults, results); },
                        CYCLE_INTERVAL * 1000) : displayStories(numResults, results);
                } else {
                    document.getElementById("abstract").innerHTML = "No news found!";
                }
            },
            error: function(statusCode, errorThrown) {
                // TODO: Add better error handling.
                if (statusCode.status === 0) {
                    document.getElementById("abstract").innerHTML = "";
                }
            }
        });
    });
}

// Get a particular story by choosing randomly from fetched stories
// Do basic filtering
function getStory(numResults, results) {
    var bound = Math.min(MAX_STORIES - 1, numResults);
    var randomNum = Math.floor((Math.random() * bound));
    var title = results[randomNum].title;
    var uninteresting = (title == "Letters to the Editor" || title.indexOf("Evening Briefing") > -1 || title == "Reactions" || title.indexOf("Review: ") > -1);
    // Basic uninteresting article filtering
    while (uninteresting) {
        uninteresting = false;
        var newResult = getTitle(numResults, results);
        title = newResult[0];
        randomNum = newResult[1];
    }
    return [title, randomNum];
}
// Invoke
callAPI();
