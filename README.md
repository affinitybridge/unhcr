This build uses npm, gulp, and browserify to manage dependencies.

To install gulp:
- run "npm install -g gulp"

To build the build:
- run "npm install" to download the 3rd party libs in package.json
- run "gulp" to browserify them (ie, to create the minified, namespace-armored
    js/app.js file).


DEVELOPING

While developing, run gulp in the background - ie, run "gulp" in a terminal and
leave it running.  It will automatically recompile app.js as you edit the src files.


Files:

LICENSE.txt - the MIT license
README.md - this help file
crossdomain.xml
css/
    images/ - contains the marker image files for AwesomeMarkers
    leaflet.awesome-markers.css - CSS for AwesomeMarkers Leaflet plugin
    normalize.css - cross-browser CSS, derived from HTML5 Boilerplate
    main.css - the single CSS file that the browser uses, compiled from the SASS 
        files in scss/
gulpfile.js - the gulp file.  This file tells gulp how to compile app.js from the
        various libraries and src files.
humanfont/ - HumanitarianFont, the font we use for the markers.
humans.txt - the credits.  Add yourself! 
index.html - the sole HTML file that serves to convey all of this JS
js/app.js - the single JS file that the browser uses, compiled from the other JS
    files and libraries
node-modules/ - the libraries that are installed by npm.  If the build has run
    successfully, this folder should contain:
    - crossfilter
    - gulp
    - gulp-sas
    - gulp-util
    - jquery
    - leaflet
    - leaflet.markercluster
    - mapbox.js
    - split
    - vinyl-source-stream
    - watchify
package.json - tells npm which modules to install when you run "npm install"
robots.txt - just a generic robots.txt
scss/ - the SASS that gets compiled into css/main.css. 
src/ - our custom JS lives in here
    BaseFilter.js - for filters - this defines a class that is an interface for a
        single filter.
    CategoryFilter.js - for filters - extends BaseFilter to create filters that 
        filter the dataset based on category-like terms.
    FilterControl.js - for filtesr - extends Leaflet's Control class to make the 
        HTML form for our filters.
    compiled.json - the single JSON file the map uses, cooked down from the 
        sources.txt sources by getJSON.js
    getJSON.js - script that pulls in the JSON from all the sources in sources.txt
        and preprocesses it into compiled.json for use on our map.
    images/ - partner logos
    index.js - the main custom JS file for this application.  Bring in the libs,
        initialize the map, and define its behaviors.
    leaflet.awesome-markers.js - the AwesomeMarkers lib.  We use this to make 
        font-based marker icons.
    polygons.json - a geoJSON file of the different regions of Jordan.  Not yet in 
        use, will be useful for filtering by region.
    sources.txt - a plaintext file containing URLs of geoJSON sources, one per 
        line, that will be cooked into compiled.json by getJSON.js.
 
