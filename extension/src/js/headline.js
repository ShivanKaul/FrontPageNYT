function call_api() {
	var public = secret
	var queryURL = "https://api.nytimes.com/svc/news/v3/content/all/science/.json?api-key=" + public.API_KEY
	$(document).ready(function(){
		$.ajax({
			url: queryURL,
			dataType: "json",
			statusCode: {
	        	502: function () {
	        		console.log("Error 502 thrown.")
	        	}
	        },
			success: function (queryResult) {
				// get array of all headlines
				var results = queryResult.results;
				var numResults = queryResult.num_results;
				if (numResults > 0) {
					var result = getTitle(numResults, results)
					var title = result[0]
					var randomNum = result[1]
					var link = results[randomNum].url;
					var abstract = "&ldquo;" + results[randomNum].abstract + "&rdquo;";
					document.getElementById("insert").setAttribute('href', link);
					document.getElementById("insert").setAttribute('title', "Link to NYT article");
					document.getElementById("insert").innerHTML = title;
					document.getElementById("abstract").innerHTML = abstract;
				}
				else {
					document.write("No news found!");
				}
			},
			error: function(statusCode, errorThrown) {
        			if (statusCode.status == 0) {
            				document.getElementById("abstract").innerHTML = "Whoops, something went wrong. Are you sure you're connected to the Internet&#8482;?";
        			}
    			}
		});
	});
}

function getTitle(numResults, results) {
	var bound = Math.min(19, numResults);
	var randomNum = Math.floor((Math.random()*bound));
	var title = results[randomNum].title;
	while (title == "Letters to the Editor" || title == "Reactions") {
		var newResult = getTitle(numResults, results)
		title = newResult[0];
		randomNum = newResult[1]
	}
	return [title, randomNum]
}

call_api();
