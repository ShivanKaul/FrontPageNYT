function call_api() {
	var queryURL = "https://api.nytimes.com/svc/news/v3/content/all/science/.json?api-key=6b0b5eb0ff211fe59f2978cee9d8a906:14:71584868";
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
				// get array of all software projects
				var results = queryResult.results;
				var numResults = queryResult.num_results;
				if (numResults > 0) {
					var title = "Letters to the Editor";
					while (title == "Letters to the Editor") {
						var bound = Math.min(19, numResults);
						var randomNum = Math.floor((Math.random()*bound));
						console.log(randomNum);
						title = results[randomNum].title;
					}
					var link = results[randomNum].url;
					var abstract = results[randomNum].abstract;
					document.getElementById("insert").setAttribute('href', link);
					document.getElementById("insert").innerHTML = title;
					document.getElementById("abstract").innerHTML = abstract;
					// document.write(title);
				}
				else {
					document.write("No news found!");
				}
			}
		});
	});
}

call_api();
