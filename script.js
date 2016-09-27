
// Run main function once page has finished loading
$(document).ready(function() {
	// Initialize main data objects
	var searchResultsData = {};
	var searchResultsList = [];
	var movieData = {};
	var movieList = [];
	// Initialize variable to track how many update requests we are waiting for
	var updateRequestsPending = 0;
	// Initialize tables on page
	drawSearchResultsTable(searchResultsData, searchResultsList);
	drawMovieListTable(movieData, movieList);
	// Clear error boxes
	clearSearchResultsErrorMessage();
	clearMovieListErrorMessage();
	// Event handler if user clicks on Search buttton
	$('button.searchButton').click(function() {
		// Disable search button and search box
		$(this).addClass("disabled");
		$('#searchBox').prop('disabled', true);
		// Read user's input from search box
		var searchTerm = $('#searchBox').val();
		// Clear search results data
		searchResultsData = {};
		searchResultsList=[];
		// Send search query
		$.ajax({
			url: "http://www.canistream.it/services/search",
			data: {
				movieName: searchTerm
			},
			// Use JSONP to avoid same origin policy issues
			dataType: "jsonp",
			// Ensure that 'this' in the callback functions refers to Search button
			context: this,
			// Callback function if request is successful
			success: function(searchResults, textStatus, jqXHR) {
				// Check if any search results were returned
				if(searchResults.length > 0) {
					// Is yes, clear error messages and copy search results into search results data object
					clearSearchResultsErrorMessage();
					searchResults.forEach(function(searchResult){
						var movieID = searchResult._id;
						searchResultsData[movieID] = {
							title: searchResult.title,
							releaseYear: searchResult.year
						};
						searchResultsList.push(movieID);
					});
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
				drawSearchResultsTable(searchResultsData, searchResultsList);
				// Clear search box
				$('#searchBox').val('');
				// Re-enable the search button and search box
				$('#searchBox').prop('disabled', false);
				$(this).removeClass("disabled");
			}
		});
	});
	// Event handler if user presses Enter key in Search box
	$('#searchBox').keyup(function(event) {
		if(event.keyCode===13) {
			// Click Search button
			$('button.searchButton').click();
		}
	});
	// Event handler if user clicks on add button next to a search result
	$(document).on('click','button.addButton', function() {
		// Extract movie ID from button data
		var movieID = $(this).data().movieid;
		// Extract corresponding search result from search result data
		var searchResult = searchResultsData[movieID];
		// Check if movie is already in movie list
		if(jQuery.inArray(movieID,movieList) > -1) {
			displayMovieListErrorMessage(
				'"' +
				searchResult.title +
				'" is already in movie list'
			);
			return;
		}
		// Remove search result from search result data
		delete searchResultsData[movieID];
		// Remove every occurence of movieID from searchResultsList
		// Handles edge case in which list has accumulated duplicates
		// Use jQuery.inArray of indexOf() or filter() for compatibility with older browsers
		var i;
		while ((i = jQuery.inArray(movieID,searchResultsList)) > -1) {
			searchResultsList.splice(i,1);
		}
		// Refresh search results table on page
		drawSearchResultsTable(searchResultsData, searchResultsList);
		// Add search result to movie data, filling in placeholders for now
		movieData[movieID] = {
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
		};
		// Add movie ID to movie list at the end
		movieList.push(movieID);
		// Refresh movie table on page
		drawMovieListTable(movieData, movieList);
		// Click Update button next to movie to fill in the streaming info
		$('button.updateInfoButton').last().click();
	});
	// Event handler if user clicks on Update button next to a movie
	$(document).on('click','button.updateInfoButton', function() {
		// Disable Update button
		$(this).addClass("disabled");
		// Extract movie ID from button data
		var movieID = $(this).data().movieid;
		// Record that we are sending two update requests
		updateRequestsPending = updateRequestsPending + 2;
		// Send query for instant streaming info
		$.ajax({
			url: "http://www.canistream.it/services/query",
			data: {
				movieId: movieID,
				attributes: "1",
				mediaType: "streaming"
			},
			// Use JSONP to avoid same origin policy issues
			dataType: "jsonp",
			// Ensure that 'this' in the callback functions refer to Update button
			context: this,
			// Callback function if request is successful
			success: function(streamingResult, textStatus, jqXHR) {
				// Clear any previous error message
				clearMovieListErrorMessage();
				// Check if movie is still in data
				if(movieID in movieData){
					// If yes, copy query results into movie data
					movieData[movieID].netflixStreaming = extractStreamingInfo(streamingResult, 'netflix_instant');
					movieData[movieID].amazonStreaming = extractStreamingInfo(streamingResult, 'amazon_prime_instant_video');
					movieData[movieID].updatedStreaming = new Date();					
				}
				// Refresh movie table on page
				drawMovieListTable(movieData, movieList);
			},
			// Callback function if request is not successful
			error: function(jqXHR, textStatus, errorThrown) {
				// Display an error message
				displayMovieListErrorMessage(
					'Server error encountered when updating instant streaming info for "' +
					movieData[movieID].title +
					'"'
				);
			},
			// Callback function whether or not request is successful
			complete: function(jqXHR, textStatus) {
				// Record that one of the requests has returned
				updateRequestsPending--;
				// If all requests have returned, re-enable update button
				if(updateRequestsPending === 0) {
					$(this).removeClass("disabled");					
				}
			}
		});
		// Send query for streaming rental info
		$.ajax({
			url: "http://www.canistream.it/services/query",
			data: {
				movieId: movieID,
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
				// Check if movie is still in data
				if(movieID in movieData) {
					// If yes, copy results into movie data
					movieData[movieID].amazonRental = extractStreamingInfo(data, 'amazon_video_rental');
					movieData[movieID].iTunesRental = extractStreamingInfo(data, 'apple_itunes_rental');
					movieData[movieID].googlePlayRental = extractStreamingInfo(data, 'android_rental');
					movieData[movieID].vuduRental = extractStreamingInfo(data, 'vudu_rental');
					movieData[movieID].updatedRental = new Date();					
				}
				// Refresh movie table on page
				drawMovieListTable(movieData, movieList);
			},
			// Callback function if request is not successful
			error: function(jqXHR, textStatus, errorThrown) {
				// Display an error message
				displayMovieListErrorMessage(
					'Server error encountered when updating streaming rental info for "' +
					movieData[movieID].title +
					'"'
				);
			},
			// Callback function whether or not request is successful
			complete: function(jqXHR, textStatus) {
				// Record that one of the requests has returned
				updateRequestsPending--;
				// If all requests have returned, re-enable update button
				if(updateRequestsPending === 0) {
					$(this).removeClass("disabled");						
				}
			}
		});
	});
	// Event handler if user clicks on Remove button next to a movie
	$(document).on('click','button.removeButton', function() {
		// Extract movie ID from button data
		var movieID = $(this).data().movieid;
		// Remove movie from movie data
		delete movieData[movieID];
		// Remove every occurence of movieID from movieList
		// Handles edge case in which list has accumulated duplicates
		// Use jQuery.inArray of indexOf() or filter() for compatibility with older browsers
		var i;
		while ((i = jQuery.inArray(movieID, movieList)) > -1) {
			movieList.splice(i,1);
		}
		// Refresh movie table on page
		drawMovieListTable(movieData, movieList);
	});
});

// Refresh search results table on page
var drawSearchResultsTable = function(searchResultsData, searchResultsList) {
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
		searchResultsList.forEach(function(movieID) {
			$('#searchResultsTableBody').append(
				"<tr><td>" +
				searchResultsData[movieID].title +
				"</td><td>" +
				searchResultsData[movieID].releaseYear +
				"</td><td>" +
				"<button type='button' class='btn btn-default addButton' data-movieid='"+
				movieID +
				"'><span class='glyphicon  glyphicon-plus'></span></button>" +
				"</td></tr>"
			);
		});
	}
}

// Refresh movie table on page
var drawMovieListTable = function(movieData, movieList) {
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
		movieList.forEach(function(movieID) {
			$('#movieListTableBody').append(
				"<tr><td>" +
				movieData[movieID].title +
				"</td><td>" +
				movieData[movieID].releaseYear +
				"</td><td>" +
				movieData[movieID].netflixStreaming +
				"</td><td>" +
				movieData[movieID].amazonStreaming +
				"</td><td>" +
				formatDate(movieData[movieID].updatedStreaming) +
				"</td><td>" +
				movieData[movieID].amazonRental +
				"</td><td>" +
				movieData[movieID].iTunesRental +
				"</td><td>" +
				movieData[movieID].googlePlayRental +
				"</td><td>" +
				movieData[movieID].vuduRental +
				"</td><td>" +
				formatDate(movieData[movieID].updatedRental) +
				"</td><td>" +
				"<button type='button' class='btn btn-default updateInfoButton' data-movieid='" +
				movieID +
				"'><span class='glyphicon glyphicon-refresh'></span></button>" +
				"</td><td>" +
				"<button type='button' class='btn btn-default removeButton' data-movieid='" +
				movieID +
				"'><span class='glyphicon  glyphicon-remove'></span></button>" +
				"</td></tr>"
			);
		});
	}
}

// Display error message associated with search results
var displaySearchResultsErrorMessage = function(errorMessage) {
	// Write error message to page
	$('#searchResultsErrorBox').html(
		'<div class="alert alert-warning" id="searchResultsErrorBox" display="none">' +
		'<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' + 
		errorMessage +
		'</div>');
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
	$('#movieListErrorBox').html(
		'<div class="alert alert-warning" id="searchResultsErrorBox" display="none">' +
		'<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' + 
		errorMessage +
		'</div>');
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
				return("<span class='glyphicon glyphicon-ok'></span> ($" + queryResult[serviceName]['price'] + ")");
			}
			// If no, omit price info
			else {
				return("<span class='glyphicon glyphicon-ok'></span>");
			}
		}
		// If no, omit price info
		else {
			return("<span class='glyphicon glyphicon-ok'></span>");
		}
	}
	// If no, display a blank
	else {
		return("");
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