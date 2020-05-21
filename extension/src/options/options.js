// https://developer.chrome.com/extensions/optionsV2
// Saves options to chrome.storage.sync.

function saveOptions() {

    let formElements = document.getElementById('settings').elements;
    let interval = formElements['interval'].value;
    let cycle = formElements['cycle'].checked;
    let cacheExpiry = formElements['cacheExpiry'].value;

    let categories = Array.prototype.slice.call(formElements['categories']).filter(function(x) {
            return x.checked;
        })
        .map(function(x) {
            return x.value;
        })
        .join(";");

    if (!categories) {
        categories = "all";
    }

    chrome.storage.sync.set({
        interval: interval,
        cycle: cycle,
        categories: categories,
        cacheExpiry: cacheExpiry
    });
}

function getOptions() {
    // Modify view
    chrome.storage.sync.get({
        interval: 5,
        cycle: false,
        categories: "all",
        cacheExpiry: 60
    }, function(items) {
        if (items.cycle) {
            document.getElementById('interval').style.display = "block";
            document.getElementById(items.interval).checked = true;
            document.getElementById('cycle').checked = true;
        }
        // Categories
        if (items.categories != "all") {
            let categoriesArray = items.categories.split(";");
            for (let i = 0; i < categoriesArray.length; i++) {
                document.getElementById(categoriesArray[i]).checked = true;
            }
        }
        
        // Cache expiry
        document.getElementById('cacheExpiry_' + items.cacheExpiry.toString()).checked = true;
    });
}

function initialize() {
    /* Display current options */
    getOptions();
    /* If cycle is on, display options */
    document.getElementById("cycle").addEventListener("change", function(e) {
        if (e.target.checked) {
            //show the div:
            document.getElementById('interval').style.display = "block";
        } else {
            //hide the div:
            document.getElementById('interval').style.display = "none";
        }
    });
    /* If any of the form elements change, save automatically */
    document.getElementById("settings").addEventListener("change", saveOptions);
}

document.addEventListener('DOMContentLoaded', initialize);

