$(document).ready(function() {
	var searchResults = [];
	var movieList = [];
	drawSearchResultsTable(searchResults, "Enter movie title above to search for movies");
	drawMovieListTable(movieList);
	$('button.searchButton').click(function() {
		$('button').prop("disabled", true);
		$('button.searchButton').html("Working...");
		var searchTerm = $('#searchBox').val();
		$('#searchBox').val('');
		$.ajax({
			url: "http://www.canistream.it/services/search",
			data: {
				movieName: searchTerm
			},
			dataType: "jsonp",
			success: function(data, textStatus, jqXHR) {
				searchResults=[];
				if(data.length > 0) {
					var statusMessage = "Found search results";
					for(var i=0; i < data.length; i++) {
						searchResults[i] = {
							id: data[i]['_id'],
							title: data[i]['title'],
							releaseYear: data[i]['year']
						};
					}
				}
				else {
					var statusMessage = "No search results";
				}
				drawSearchResultsTable(searchResults, statusMessage);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				searchResults=[];
				var statusMessage = "Error in accessing CanIStream.It";
				drawSearchResultsTable(searchResults, statusMessage);
			},
			complete: function(jqXHR, textStatus) {
				$('button.searchButton').html("Search")
				$('button').prop("disabled", false);
			}
		});
	});
	$('#searchBox').keyup(function(event) {
		if(event.keyCode==13) {
			$('button.searchButton').click();
		}
	});
	$(document).on('click','button.addButton', function() {
		var searchResultIndex = $(this).parent().parent().index();
		var searchResult = searchResults[searchResultIndex];
		searchResults.splice(searchResultIndex,1);
		if(searchResults.length > 0) {
			var statusMessage = "Search results found";
		}
		else {
			var statusMessage = "No search results";
		}
		drawSearchResultsTable(searchResults, statusMessage);
		movieList.push({
			id: searchResult.id,
			title: searchResult.title,
			releaseYear: searchResult.releaseYear,
			netflixStreaming: "?",
			amazonStreaming: "?",
			updatedStreaming: "Never",
			amazonRental: "?",
			iTunesRental: "?",
			googlePlayRental: "?",
			vuduRental: "?",
			updatedRental: "Never"
		});
		drawMovieListTable(movieList);
	});
	$(document).on('click','button.updateStreamingButton', function() {
		$('button').prop("disabled", true);
		$(this).html("Working...");
		var movieItemIndex = $(this).parent().parent().index();
		$.ajax({
			url: "http://www.canistream.it/services/query",
			data: {
				movieId: movieList[movieItemIndex]['id'],
				attributes: "1",
				mediaType: "streaming"
			},
			dataType: "jsonp",
			context: this,
			success: function(data, textStatus, jqXHR) {
				movieList[movieItemIndex]['netflixStreaming'] = extractStreamingInfo(data, 'netflix_instant');
				movieList[movieItemIndex]['amazonStreaming'] = extractStreamingInfo(data, 'amazon_prime_instant_video');
				movieList[movieItemIndex]['updatedStreaming'] = new Date();
				drawMovieListTable(movieList);;
			},
			error: function(jqXHR, textStatus, errorThrown) {
			},
			complete: function(jqXHR, textStatus) {
				$(this).html("Update")
				$('button').prop("disabled", false);
			}
		});
	});
	$(document).on('click','button.updateRentalButton', function() {
		$('button').prop("disabled", true);
		$(this).html("Working...");
		var movieItemIndex = $(this).parent().parent().index();
		$.ajax({
			url: "http://www.canistream.it/services/query",
			data: {
				movieId: movieList[movieItemIndex]['id'],
				attributes: "1",
				mediaType: "rental"
			},
			dataType: "jsonp",
			context: this,
			success: function(data, textStatus, jqXHR) {
				movieList[movieItemIndex]['amazonRental'] = extractStreamingInfo(data, 'amazon_video_rental');
				movieList[movieItemIndex]['iTunesRental'] = extractStreamingInfo(data, 'apple_itunes_rental');
				movieList[movieItemIndex]['googlePlayRental'] = extractStreamingInfo(data, 'android_rental');
				movieList[movieItemIndex]['vuduRental'] = extractStreamingInfo(data, 'vudu_rental');
				movieList[movieItemIndex]['updatedRental'] = new Date();
				drawMovieListTable(movieList);
			},
			error: function(jqXHR, textStatus, errorThrown) {
			},
			complete: function(jqXHR, textStatus) {
				$(this).html("Update")
				$('button').prop("disabled", false);
			}
		});
	});
	$(document).on('click','button.removeButton', function() {
		var movieItemIndex = $(this).parent().parent().index();
		movieList.splice(movieItemIndex,1);
		drawMovieListTable(movieList);
	});
});

var drawSearchResultsTable = function(searchResults) {
	$('#searchResultsTableBody').empty();
	if(searchResults.length===0) {
		$('#searchResultsTableBody').append(
			"<tr><td colspan='3'><em>No search results</em></td></tr>"
		);
	}
	else {
		for(var i=0; i < searchResults.length; i++) {
			$('#searchResultsTableBody').append(
				"<tr><td>" +
				searchResults[i].title +
				"</td><td>" +
				searchResults[i].releaseYear +
				"</td><td>" +
				"<button class='addButton'>Add</button>" +
				"</td></tr>"
			);
		}
	}
}

var drawMovieListTable = function(movieList) {
	$('#movieListTableBody').empty();
	if(movieList.length===0){
		$('#movieListTableBody').append(
			"<tr><td colspan='13'><em>No movies in list</em></td></tr>"
		);		
	}
	else {
		for(var i=0; i < movieList.length; i++) {
			$('#movieListTableBody').append(
				"<tr><td>" +
				movieList[i].title +
				"</td><td>" +
				movieList[i].releaseYear +
				"</td><td>" +
				movieList[i].netflixStreaming +
				"</td><td>" +
				movieList[i].amazonStreaming +
				"</td><td>" +
				formatDate(movieList[i].updatedStreaming) +
				"</td><td>" +
				"<button class='updateStreamingButton'>Update</button>" +
				"</td><td>" +
				movieList[i].amazonRental +
				"</td><td>" +
				movieList[i].iTunesRental +
				"</td><td>" +
				movieList[i].googlePlayRental +
				"</td><td>" +
				movieList[i].vuduRental +
				"</td><td>" +
				formatDate(movieList[i].updatedRental) +
				"</td><td>" +
				"<button class='updateRentalButton'>Update</button>" +
				"</td><td>" +
				"<button class='removeButton'>Remove</button>" +
				"</td></tr>"
			);
		}
	}
}

var extractStreamingInfo = function(data, serviceName) {
	if(serviceName in data) {
		if('price' in data[serviceName]) {
			if(data[serviceName]['price'] > 0){
				return("Y ($" + data[serviceName]['price'] + ")");
			}
			else {
				return("Y (subscription)");
			}
		}
		else {
			return("Y");
		}
	}
	else {
		return("N");
	}
}

var randomStreamingInfo = function() {
	if(Math.random() > 0.5) {
		return("$" + Math.floor(Math.random()*4) + ".99");
	}
	else {
		return("");
	}
}

function formatDate(date) {
	if(typeof(date)==="string"){
		return(date);
	}
	else{
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var seconds = date.getSeconds();
		hours = hours < 10 ? '0'+hours : hours;
		minutes = minutes < 10 ? '0'+minutes : minutes;
		seconds = seconds < 10 ? '0'+seconds : seconds;
		return (
			(date.getMonth() + 1) +
			"/" +
			date.getDate() +
			"/" +
			date.getFullYear() +
			" " +
			hours +
			":" +
			minutes +
			":" +
			seconds
		)
	}
}