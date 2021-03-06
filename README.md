## Streaming service comparison tool

This tool allows the user to build a list of movies they want to see and then compare streaming and video rental services based on their list. The tool is powered by the [CanIStream.It](http://canistream.it) API.

The tool runs entirely within the browser, so all data is lost when the page reloads. [CanIStream.It](http://canistream.it) only accepts `http` requests so most browsers will generate mixed content errors if page is accessed through`https`.

Note that the results from [CanIStream.It](http://canistream.it) appear to be incorrect for some movies (e.g., movie is clearly listed in Amazon Prime Video but [CanIStream.It](http://canistream.it) indicates that it is not available for instant streaming from Amazon).