'use strict';

// Local storage: Options
let CYCLE_INTERVAL = 5; // in seconds
let BASE_API_URL = "https://api.nytimes.com/svc/news/v3/content/all/";
let CYCLE = false;
let CATEGORIES = "all";
// Local storage: Cache
let CACHED_RESULTS = {};
let CACHED_TIMESTAMP = null;
let CACHE_EXPIRY = 60;
// Depends on NYT API
let MAX_STORIES = 20;
let AJAX_TIMEOUT = 10; // in seconds

// Restores options and result cache
// stored in chrome.storage asynchronously
function restoreLocalStorage() {
    // Default
    chrome.storage.sync.get({
        interval: CYCLE_INTERVAL,
        categories: CATEGORIES,
        cycle: CYCLE,
        results: CACHED_RESULTS,
        timestamp: CACHED_TIMESTAMP,
        cache_expiry: CACHE_EXPIRY
    }, function(items) {
        CATEGORIES = items.categories;
        CYCLE_INTERVAL = items.interval;
        CYCLE = items.cycle;
        CACHED_RESULTS = items.results;
        CACHED_TIMESTAMP = items.timestamp;
        CACHE_EXPIRY = items.cache_expiry;

        let currentTime = Math.floor(Date.now() / 1000); // UNIX in seconds
        // Cache expiry : 1 minute
        if (CACHED_TIMESTAMP && currentTime - CACHED_TIMESTAMP < CACHE_EXPIRY) {
            console.log("[DEBUG][FrontPageNYT]: Using cached stories, current cache expiry is " + CACHE_EXPIRY + " seconds");
            console.log("[DEBUG][FrontPageNYT]: Current time: " + currentTime + ", cache time: " + CACHED_TIMESTAMP);
            display(CACHED_RESULTS, false);
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
function getRandomStory(numResults, stories) {
    let bound = Math.min(MAX_STORIES - 1, numResults);
    let randomNum = Math.floor((Math.random() * bound));
    let title = stories[randomNum].title;
    let abstract = stories[randomNum].abstract;
    let url = stories[randomNum].url;
    let uninteresting = (title == "Letters to the Editor" || title.indexOf("Evening Briefing") > -1 || title == "Reactions" || title.indexOf("Review: ") > -1);
    // Basic uninteresting article filtering
    if (uninteresting) {
        // Remove uninteresting story: citation: http://stackoverflow.com/a/5767357/2989693
        stories.splice(randomNum, 1);
        return getRandomStory(numResults - 1, stories);
    }
    return {
        title: title,
        abstract: abstract,
        url: url
    };
}

let fetch = function() {
    return new Promise(
        function(resolve, reject) {
            let queryURL = BASE_API_URL + CATEGORIES + "/.json?api-key=" + secretKeys.API_KEY;
            $.ajax({
                url: queryURL,
                dataType: "json",
                timeout: AJAX_TIMEOUT * 1000,
                statusCode: {
                    502: function() {
                        reject("Error 502 thrown while fetching from NYT API.");
                    }
                },
                success: function(queryResult) {
                    // get array of all headlines
                    let stories = queryResult.results;
                    let numResults = queryResult.num_results;
                    resolve({
                        stories: stories,
                        numResults: numResults
                    });
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    let cacheAvailableText = ". No cached stories available.";
                    if (!$.isEmptyObject(CACHED_RESULTS)) {
                        cacheAvailableText = ". Trying to display cached results.";
                        display(CACHED_RESULTS, false);
                    }
                    reject("AJAX call errored/timed out, with error thrown: " + JSON.stringify(jqXHR) + cacheAvailableText);
                }
            });
        }
    );
}

let decode = function(results) {
    // Decompose into title, abstract, url
    return new Promise(
        function(resolve, reject) {
            resolve({
                stories: results.stories.map(function(result) {
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

let display = function(results, updateCache) {
    function display(results, updateCache) {
        if (document.getElementById("headline") == null) {
            return;
        }
        let result = getRandomStory(results.numResults, results.stories);
        let title = result.title;
        let link = result.url;
        // Add quotes
        let abstract = "&ldquo;" + result.abstract + "&rdquo;";
        // Display
        document.getElementById("headline").setAttribute('href', link);
        document.getElementById("headline").setAttribute('title', "Link to NYT article");
        document.getElementById("headline").innerHTML = title;
        document.getElementById("abstract").innerHTML = abstract;
        // Fade in text
        $("#headline").hide().fadeIn();
        $("#abstract").hide().fadeIn();
        // Store results in local storage
        if (updateCache) {
            saveResults(results);
        }
    }
    display(results, updateCache);
    if (CYCLE) {
        window.setInterval(function() {
                display(results, false);
            },
            CYCLE_INTERVAL * 1000);
    }
}

function fetchDecodeDisplay() {
    // Fetch -> Decode -> Display
    fetch()
        .then((results) => decode(results))
        .then((results) => display(results, true))
        .catch(function(error) {
            console.log(error);
        });
}

// We start with restoring local storage
restoreLocalStorage();
