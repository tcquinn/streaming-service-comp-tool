
// Run main function once page has finished loading
$(document).ready(function() {
	// Initialize main data objects
	var searchResultsList = [];
	var movieList = [];
	// Initialize variable to track how many update requests we are waiting for
	var updateRequestsPending = 0;
	// Draw tables on page
	drawSearchResultsTable(searchResultsList);
	drawMovieListTable(movieList);
	// Event handler if user clicks on Search buttton
	$('button.searchButton').click(function() {
		// Disable all buttons to avoid collisions while waiting for query
		$('button').prop("disabled", true);
		// Give feedback to user that click has been recognized
		$('button.searchButton').html("Working...");
		// Read user's input from search box
		var searchTerm = $('#searchBox').val();
		// Clear search box
		$('#searchBox').val('');
		// Clear search results data
		searchResultsList=[];
		// Send search query
		$.ajax({
			url: "http://www.canistream.it/services/search",
			data: {
				movieName: searchTerm
			},
			// Use JSONP to avoid same origin policy issues
			dataType: "jsonp",
			// Callback function if request is successful
			success: function(data, textStatus, jqXHR) {
				// Check if any search results were returned
				if(data.length > 0) {
					// Is yes, copy search results into search results data object
					clearSearchResultsErrorMessage();
					for(var i=0; i < data.length; i++) {
						searchResultsList.push({
							id: data[i]['_id'],
							title: data[i]['title'],
							releaseYear: data[i]['year']
						});
					}
				}
				else {
					// If no, display error message
					displaySearchResultsErrorMessage(
						'No search results for "' +
						searchTerm +
						'"'
					);
				}
			},
			// Callback function if request is not successful
			error: function(jqXHR, textStatus, errorThrown) {
				// Display error message
				displaySearchResultsErrorMessage(
					'Server error encountered when searching for "' +
					searchTerm +
					'"'
				);
			},
			// Callback function whether or not request was successful
			complete: function(jqXHR, textStatus) {
				// Refresh search results table on page
				drawSearchResultsTable(searchResultsList);
				// Reset the Search button
				$('button.searchButton').html("Search")
				// Re-enable all buttons on page
				$('button').prop("disabled", false);
			}
		});
	});
	// Event handler if user presses Enter key in Search box
	$('#searchBox').keyup(function(event) {
		if(event.keyCode==13) {
			// Click Search button
			$('button.searchButton').click();
		}
	});
	// Event handler if user clicks on Add button next to a search result
	$(document).on('click','button.addButton', function() {
		// Infer index of search result from position of button in table
		var searchResultIndex = $(this).parent().parent().index();
		// Extract search result from search results data
		var searchResult = searchResultsList[searchResultIndex];
		// Remove search result from search result data
		searchResultsList.splice(searchResultIndex,1);
		// Refresh search results table on page
		drawSearchResultsTable(searchResultsList);
		// Add search result to movie data, filling in placeholders for now
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
		// Refresh movie table on page
		drawMovieListTable(movieList);
		// Click Update button next to movie to fill in the streaming info
		$('button.updateInfoButton').last().click();
	});
	// Event handler if user clicks on Update button next to a movie
	$(document).on('click','button.updateInfoButton', function() {
		// Disable all buttons to avoid collisions while waiting for query
		$('button').prop("disabled", true);
		// Give feedback to user that click has been recognized
		$(this).html("Working...");
		// Infer index of search result from position of button in table
		var movieItemIndex = $(this).parent().parent().index();
		// Record that we are sending two update requests
		updateRequestsPending = updateRequestsPending + 2;
		// Send query for instant streaming info
		$.ajax({
			url: "http://www.canistream.it/services/query",
			data: {
				movieId: movieList[movieItemIndex]['id'],
				attributes: "1",
				mediaType: "streaming"
			},
			// Use JSONP to avoid same origin policy issues
			dataType: "jsonp",
			// Ensure that 'this' in the callback functions refer to Update button
			context: this,
			// Callback function if request is successful
			success: function(data, textStatus, jqXHR) {
				// Clear any previous error message
				clearMovieListErrorMessage();
				// Copy query results into movie data
				movieList[movieItemIndex]['netflixStreaming'] = extractStreamingInfo(data, 'netflix_instant');
				movieList[movieItemIndex]['amazonStreaming'] = extractStreamingInfo(data, 'amazon_prime_instant_video');
				movieList[movieItemIndex]['updatedStreaming'] = new Date();
				// Refresh movie table on page
				drawMovieListTable(movieList);
			},
			// Callback function if request is not successful
			error: function(jqXHR, textStatus, errorThrown) {
				// Display an error message
				displayMovieListErrorMessage(
					'Server error encountered when updating instant streaming info for "' +
					movieList[movieItemIndex]['title'] +
					'"'
				);
			},
			// Callback function whether or not request is successful
			complete: function(jqXHR, textStatus) {
				// Record that one of the requests has returned
				updateRequestsPending--;
				// If all requests have returned,  reset Update button and re-enable all buttons
				if(updateRequestsPending == 0) {
					$(this).html("Update")
					$('button').prop("disabled", false);					
				}
			}
		});
		// Send query for streaming rental info
		$.ajax({
			url: "http://www.canistream.it/services/query",
			data: {
				movieId: movieList[movieItemIndex]['id'],
				attributes: "1",
				mediaType: "rental"
			},
			// Use JSONP to avoid same origin policy issues
			dataType: "jsonp",
			// Ensure that 'this' in the callback functions refer to Update button
			context: this,
			// Callback function if request is successful
			success: function(data, textStatus, jqXHR) {
				// Clear any previous error message
				clearMovieListErrorMessage();
				// Copy results into movie data
				movieList[movieItemIndex]['amazonRental'] = extractStreamingInfo(data, 'amazon_video_rental');
				movieList[movieItemIndex]['iTunesRental'] = extractStreamingInfo(data, 'apple_itunes_rental');
				movieList[movieItemIndex]['googlePlayRental'] = extractStreamingInfo(data, 'android_rental');
				movieList[movieItemIndex]['vuduRental'] = extractStreamingInfo(data, 'vudu_rental');
				movieList[movieItemIndex]['updatedRental'] = new Date();
				// Refresh movie table on page
				drawMovieListTable(movieList);
			},
			// Callback function if request is not successful
			error: function(jqXHR, textStatus, errorThrown) {
				// Display an error message
				displayMovieListErrorMessage(
					'Server error encountered when updating streaming rental info for "' +
					movieList[movieItemIndex]['title'] +
					'"'
				);
			},
			// Callback function whether or not request is successful
			complete: function(jqXHR, textStatus) {
				// Record that one of the requests has returned
				updateRequestsPending--;
				// If all requests have returned, reser Update button and re-enable all buttons
				if(updateRequestsPending ==0) {
					$(this).html("Update")
					$('button').prop("disabled", false);					
				}
			}
		});
	});
	// Event handler if user clicks on Remove button next to a movie
	$(document).on('click','button.removeButton', function() {
		// Infer movie index from position of button in table
		var movieItemIndex = $(this).parent().parent().index();
		// Remove movie from movie data
		movieList.splice(movieItemIndex,1);
		// Refresh movie table on page
		drawMovieListTable(movieList);
	});
});

// Refresh search results table on page
var drawSearchResultsTable = function(searchResultsList) {
	// Clear search results table on page
	$('#searchResultsTableBody').empty();
	// Check if search results data is empty
	if(searchResultsList.length===0) {
		// If yes, display placeholder in table
		$('#searchResultsTableBody').append(
			"<tr><td colspan='3'><em>No search results</em></td></tr>"
		);
	}
	// If no, copy data into table
	else {
		for(var i=0; i < searchResultsList.length; i++) {
			$('#searchResultsTableBody').append(
				"<tr><td>" +
				searchResultsList[i].title +
				"</td><td>" +
				searchResultsList[i].releaseYear +
				"</td><td>" +
				"<button class='addButton'>Add</button>" +
				"</td></tr>"
			);
		}
	}
}

// Refresh movie table on page
var drawMovieListTable = function(movieList) {
	// Clear movie table on page
	$('#movieListTableBody').empty();
	// Check if movie data is empty
	if(movieList.length===0){
		// If yes, display placeholder in table
		$('#movieListTableBody').append(
			"<tr><td colspan='13'><em>No movies in list</em></td></tr>"
		);		
	}
	// If no, copy data into table
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
				"<button class='updateInfoButton'>Update</button>" +
				"</td><td>" +
				"<button class='removeButton'>Remove</button>" +
				"</td></tr>"
			);
		}
	}
}

// Display error message associated with search results
var displaySearchResultsErrorMessage = function(errorMessage) {
	// Write error message to page
	$('#searchResultsErrorBox').text(errorMessage);
	// Unhide error message section of page
	$('#searchResultsErrorBox').css("display","block")
}

// Clear error message associated with search results
var clearSearchResultsErrorMessage = function() {
	// Erase error message from page
	$('#searchResultsErrorBox').empty();
	// Hide error message section of page
	$('#searchResultsErrorBox').css("display","none")
}

// Display error message associated with movie list
var displayMovieListErrorMessage = function(errorMessage) {
	// Write error message to page
	$('#movieListErrorBox').text(errorMessage);
	// Unhide error message section of page
	$('#movieListErrorBox').css("display","block")
}

// Clear error message associated with movie list
var clearMovieListErrorMessage = function() {
	// Erase error message to the page
	$('#movieListErrorBox').empty();
	// Hide error message section of page
	$('#movieListErrorBox').css("display","none")
}

// Format streaming info data
var extractStreamingInfo = function(queryResult, serviceName) {
	// Check if streaming service appears in results
	if(serviceName in queryResult) {
		// If yes, display "Y" (plus possibly price info)
		// Check if there is price info in results
		if('price' in queryResult[serviceName]) {
			// If yes, display price info in parentheses
			// Check if price is non-zero
			if(queryResult[serviceName]['price'] > 0) {
				// If yes, format price and include in parentheses
				return("Y ($" + queryResult[serviceName]['price'] + ")");
			}
			// If no, indicate that movie is available via subscription
			else {
				return("Y (subscription)");
			}
		}
		// If no, omit price info
		else {
			return("Y");
		}
	}
	// If no, display "N"
	else {
		return("N");
	}
}

// Format date for display
function formatDate(date) {
	// Check if date is already a string (e.g., because it's still a placeholder)
	if(typeof(date)==="string"){
		// If yes, leave string unchanged
		return(date);
	}
	// If no, format the date
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