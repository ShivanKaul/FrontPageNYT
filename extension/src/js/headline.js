'use strict';

// Local storage: Options
var CYCLE_INTERVAL = 5;
var BASE_API_URL = "https://api.nytimes.com/svc/news/v3/content/all/";
var CYCLE = false;
var CATEGORIES = "all";
// Local storage: Cache
var CACHED_RESULTS = {};
var CACHED_TIMESTAMP = null;
var CACHE_EXPIRY = 20;
// Depends on NYT API
var MAX_STORIES = 20;

// Restores options and result cache
// stored in chrome.storage asynchronously
function restoreLocalStorage() {
    chrome.storage.sync.get({
        interval: 5,
        categories: "all",
        cycle: false,
        results: {},
        timestamp: null
    }, function(items) {
        CATEGORIES = items.categories;
        CYCLE_INTERVAL = items.interval;
        CYCLE = items.cycle;
        CACHED_RESULTS = items.results;
        CACHED_TIMESTAMP = items.timestamp;

        var currentTime = Math.floor(Date.now() / 1000);
        // Cache expiry : 20 seconds
        if (CACHED_TIMESTAMP && currentTime - CACHED_TIMESTAMP < CACHE_EXPIRY) {
            display(CACHED_RESULTS);
        } else {
            fetchDecodeDisplay();
        }
    });
}

// Save results in local cache
function saveResults(results) {
    chrome.storage.sync.set({
        results: results,
        timestamp: Math.floor(Date.now() / 1000)
    });
}


// Get a particular story by choosing randomly from fetched stories
function getRandomStory(numResults, results) {
    var bound = Math.min(MAX_STORIES - 1, numResults);
    var randomNum = Math.floor((Math.random() * bound));
    var title = results[randomNum].title;
    var abstract = results[randomNum].abstract;
    var url = results[randomNum].url;
    var uninteresting = (title == "Letters to the Editor" || title.indexOf("Evening Briefing") > -1 || title == "Reactions" || title.indexOf("Review: ") > -1);
    // Basic uninteresting article filtering
    if (uninteresting) return getRandomStory(numResults, results);
    return {
        title: title,
        abstract: abstract,
        url: url
    };
}

var fetch = function() {
    return new Promise(
        function(resolve, reject) {
            var secretKey = secret;
            var queryURL = BASE_API_URL + CATEGORIES + "/.json?api-key=" + secretKey.API_KEY;
            $(document).ready(function() {
                $.ajax({
                    url: queryURL,
                    dataType: "json",
                    statusCode: {
                        502: function() {
                            reject("Error 502 thrown while fetching from NYT API.");
                        }
                    },
                    success: function(queryResult) {
                        // get array of all headlines
                        var results = queryResult.results;
                        var numResults = queryResult.num_results;
                        resolve({ results: results, numResults: numResults });
                    },
                    error: function(statusCode, errorThrown) {
                        reject("AJAX call errored out, with status object: " + JSON.stringify(statusCode));
                    }
                });
            });
        }
    );
}

var decode = function(results) {
    // Decompose into title, abstract, url
    return new Promise(
        function(resolve, reject) {
            resolve({
                results: results.results.map(function(result) {
                    return {
                        title: result.title,
                        abstract: result.abstract,
                        url: result.url
                    };
                }),
                numResults: results.numResults
            });
        }
    );
};

var display = function(results) {
    function displayInner(resultsInner) {
        var result = getRandomStory(resultsInner.numResults, resultsInner.results);
        var title = result.title;
        var link = result.url;
        // Add quotes
        var abstract = "&ldquo;" + result.abstract + "&rdquo;";
        // Display
        document.getElementById("insert").setAttribute('href', link);
        document.getElementById("insert").setAttribute('title', "Link to NYT article");
        document.getElementById("insert").innerHTML = title;
        document.getElementById("abstract").innerHTML = abstract;
        // Fade in text
        $("#insert").hide().fadeIn();
        $("#abstract").hide().fadeIn();
        // Store results in local storage
        saveResults(results);
    }
    displayInner(results);
    if (CYCLE) {
        window.setInterval(function() {
                displayInner(results);
            },
            CYCLE_INTERVAL * 1000);
    }
}

function fetchDecodeDisplay() {
    // Fetch -> Decode -> Display
    fetch()
        .then((results) => decode(results))
        .then((results) => display(results))
        .catch(function(error) {
            document.getElementById("abstract").innerHTML = "";
            console.log(error);
        });
}

// We start with restoring local storage
restoreLocalStorage();
