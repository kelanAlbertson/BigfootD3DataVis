// CS6017 HW 7 - Jon Hughes and Kelan Albertson


////////////////////////////////////////////////////
// You will need to download bfro_clean.json from //
// cs.utah.edu/~jhughes/bfro_clean.json           //
////////////////////////////////////////////////////

let mapHeight = 500;
let mapWidth = 900;
// let height = window.innerHeight * 0.65;

// create and draw the map
let projection = d3.geoAlbers();
let path = d3.geoPath(projection);

let mapSvg = d3.select("#map")
    .append("svg")
    .attr("width", mapWidth)
    .attr("height", mapHeight)
    .call(d3.zoom()
        .scaleExtent([1, 50])
        .translateExtent([[0, 0], [mapWidth, mapHeight]])
        .on("zoom", function () {
            mapSvg.attr("transform", d3.event.transform)
        }))
    .append("g")
;

// load the us.json file that provides the representation of the US and the states
d3.json('us.json', function (us) {
    console.log("usa", us);

    let map = mapSvg.append('g').attr('class', 'boundary');
    usa = map.selectAll('path')
        .data(topojson.feature(us, us.objects.states).features)
    ;

    usa.enter()
        .append('path')
        .attr('d', path)
        .attr('fill', 'gray')
    ;
});

let datapoints // this will act similar to a global variable to give us access to the sightings data everywhere

var parseDate = d3.timeParse("%Y-%m-%d") // creates a pattern to parse a date from

// set up the timeline histogram
var margin = {top: 10, right: 30, bottom: 30, left: 30},
    tlWidth = 960 - margin.left - margin.right,
    tlHeight = 200 - margin.top - margin.bottom;

var x = d3.scaleTime()
    .domain([new Date("1940"), new Date("2021")])
    .rangeRound([0, tlWidth]);

var y = d3.scaleLinear()
    .range([tlHeight, 0]);

var histogram = d3.histogram()
    .value(function(d) { return parseDate(d.date); })
    .domain(x.domain())
    .thresholds(x.ticks(152));

var tlSvg = d3.select("#timeline").append("svg")
    .attr("width", tlWidth + margin.left + margin.right)
    .attr("height", tlHeight + margin.top + margin.bottom)
.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

tlSvg.append("g")
    .attr("id", "x axis")
    .attr("transform", "translate(0," + tlHeight + ")")
    .call(d3.axisBottom(x));

// read in the bigfoot sighting data that we cleaned up in Python and then saved as a JSON
d3.json('bfro_clean.json', function (sightings) {

        // console.log('sightings', sightings);

        datapoints = sightings      // copy data to global variable for later use when updating points

        // cal drawDots
        drawDots(sightings);
        
        drawTimeline(sightings);
            
    });

// this will act as a reset for the dots on the map
function updatePoints(){
    console.log("UPDATE!!")
    console.log('datapoints', datapoints);
    console.log("type of datapoints", typeof datapoints)

    // this is the array of dots that we will add to to display
    let dots = [];

    // if class A is checked then add all class A dots
    let aBox = document.getElementById("classACheckbox")
    if (aBox.checked) {
        dots = dots.concat(datapoints.filter(function (d) {
            return d.classification == "Class A"
        }))
    }

    // if class B is checked then add all class B dots
    let bBox = document.getElementById("classBCheckbox")
    if (bBox.checked) {
        dots = dots.concat(datapoints.filter(function (d) {
            return d.classification == "Class B"
        }))
    }

    // if class C is checked then add all class C dots
    let cBox = document.getElementById("classCCheckbox")
    if (cBox.checked) {
        dots = dots.concat(datapoints.filter(function (d) {
            return d.classification == "Class C"
        }))
    }

    // we noticed that this orders the dots by class such that class C dots are always displayed on top
    // of class B and both are always displayed on top of class A dots
    // to pseudo fix this we will shuffle the dots array so the classes should be dispersed
    dots.sort( ()=>Math.random()-0.5 )

    // console.log('dots', dots);

    let blank = []
    
    // remove the old points
    mapSvg.selectAll('circle')
        .data(blank)
        .exit().remove()

    // add new ones
    drawDots(dots);

    // also redraw the histogram with filtered data
    drawTimeline(dots);
}

// this will update the map to show only dots for the year that is currently hovered over
function mouseOverYear(b) {
    let blank = []
    
    // remove the old points
    mapSvg.selectAll('circle')
        .data(blank)
        .exit().remove()

    // add new ones
    drawDots(b);
}

// this will handle drawing the dots onto the map
function drawDots(dots) {
    // get the circles, link them to whatever data was passed, and place them
    mapSvg.selectAll('circle')    
        .data(dots)
        .enter()
        .append('circle')
        .attr('cx', function (d) { return projection([d.longitude, d.latitude])[0] })
        .attr('cy', function (d) { return projection([d.longitude, d.latitude])[1] })
        .attr('r', 2)
        .attr('fill', function (d) {
            // the color of the dots is determined by what classification they are
            if (d.classification == "Class A") { return "darkred" }
            else if (d.classification == "Class B") { return "peru" }
            else { return "goldenrod" }
        })
        .on("mouseover", function (b) {
            // hovering over a dot will change its color to highlight it
            console.log("Sighting", b)
            let sightingTitle = document.getElementById("sightingTitle")
            sightingTitle.textContent = b.title
            d3.select(this).style("fill", "blue");
        })
        .on("mouseout", function (d) {
            // reset the color when not hovered over
            if (d.classification == "Class A") { d3.select(this).style("fill", "darkred"); }
            else if (d.classification == "Class B") { d3.select(this).style("fill", "peru"); }
            else { d3.select(this).style("fill", "goldenrod"); }
            let sightingTitle = document.getElementById("sightingTitle")
            sightingTitle.textContent = "---"
        })
        .on("click", function (d) {
            // when clicked, gput info about the sighting that the dot represents into the info panel
            let storyText = document.getElementById("storyText")
            storyText.textContent = d.observed

            let storyTitle = document.getElementById("storyTitle")
            storyTitle.textContent = d.title

            let storyCoords = document.getElementById("storyCoords")
            storyCoords.textContent = d.latitude + " , " + d.longitude;

            let storyWeather = document.getElementById("storyWeather")
            storyWeather.textContent = d.summary

            letter = d.classification.split(' ')[1]; // getting the report number from the title column will be easier since it is a string already
            let classLetter = document.getElementById("classLetter");
            classLetter.textContent = letter;

            let date = document.getElementById("date");
            date.textContent = d.date;

            let state = document.getElementById("state");
            state.textContent = d.state;

            let county = document.getElementById("county");
            county.textContent = d.county.replace(" County", "");

            let temperature = document.getElementById("temperature");
            temperature.textContent = d.temperature_high + "/" + d.temperature_mid + "/" + d.temperature_low;

            let dewpoint = document.getElementById("dewpoint");
            dewpoint.textContent = d.dew_point;

            let humidity = document.getElementById("humidity");
            humidity.textContent = d.humidity;

            let cloud = document.getElementById("cloud")
            cloud.textContent = d.cloud_cover;
        });
}

function drawTimeline(data) {

    let blank = []
    
    // remove the old points
    tlSvg.selectAll(".bar")
        .data(blank)
        .exit().remove()

    // remove the old y axis
    tlSvg.select("#yAxis")
        .data(blank)
        .exit().remove()

    // create and fill the bins
    var bins = histogram(data);

    y.domain([0, d3.max(bins, function(d) { return d.length; })]);

    tlSvg.append("g")
        .attr("id", "yAxis")
        .call(d3.axisLeft(y));

    // turn the bins into bars
    var bar = tlSvg.selectAll(".bar")
        .data(bins)
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; });

    bar.append("rect")
        .attr("x", 1)
        .attr("width", function(d) { return x(d.x1) - x(d.x0) - 1; })
        .attr("height", function(d) { return tlHeight - y(d.length); })
        .on("mouseover", function (b) {
            d3.select(this).style("fill", "darkred");
            let timelineInfo = document.getElementById("timelineInfo")
            timelineInfo.textContent = "Year: " + b[0].date.split("-")[0] + "\r\nSightings: " + b.length
            mouseOverYear(b); // will draw only the dots for that year
        })
        .on("mouseout", function (b) {
            d3.select(this).style("fill", "black");
            let timelineInfo = document.getElementById("timelineInfo")
            timelineInfo.textContent = ""
            updatePoints(); // will reset the map to have all dots that fit the current checkbox filter
        });
}