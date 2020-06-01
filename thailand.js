/*eslint-env es6*/
/*eslint-env browser*/
/*eslint no-console: 0*/
/*global d3 */

/*global window, console, d3 */

// define margin
var margin = {left: 20, right: 80, top: 30, bottom: 70 },         
    width = 1000 - margin.left - margin.right,        
    height = 500 - margin.top - margin.bottom;

// projecting 3d space into 2d html page. center for placing the map, and scale adjusts the zoom
var projection = d3.geoMercator()
                    .center([97, 13])
                    .scale(1800); 

// define path generator, using Mercator projection
// translates the GeoJSON coordinates into SVG path codes
var path = d3.geoPath().projection(projection)

// set svg drawing tool
var svg = d3.select("body").append("svg")        
    .attr("width", width + margin.left + margin.right)        
    .attr("height", height + margin.top + margin.bottom)             
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

var current_var = 'male_pop' // set alternating var

// https://data.humdata.org/dataset/thailand-administrative-levels-0-1-population-statistics/resource/6d582086-baab-4500-85a2-354983a24bd5 
d3.csv("thailand.csv").then(function(data){ 
    //console.log(pop_densities.length)
    //console.log(pop_densities)
    
    // loading in thailand.json data
    d3.json("thailand.json").then(function(json) {
        // console.log(json.features)
        //console.log(json.features)
        
        //https://stackoverflow.com/questions/54947126/geojson-map-with-d3-only-rendering-a-single-path-in-a-feature-collection
        //Because the the polygons are inverted, they cover the entire world except for the region of interest. Need to do this in order to fill each province with color later.
        json.features.forEach(function(feature) {
            if(feature.geometry.type == "MultiPolygon") {
                //console.log('multipolygon')
                feature.geometry.coordinates.forEach(function(polygon) {
                    polygon.forEach(function(ring) {
                        ring.reverse();
                    })
                })
            }
            if (feature.geometry.type == "Polygon") {
                //console.log('polygon')
                feature.geometry.coordinates.forEach(function(ring) {
                    ring.reverse();
                    })  
            }
        })
        
        // binding thailand.csv "Total_Pop" parameter into thailand.json
        for(var i = 0; i < json.features.length; i++){
            for(var j = 0; j < data.length; j++){
                if(data[j].Adm1Name_en == json.features[i].properties.NAME_1) {
                    json.features[i].pop_density = +data[j].Total_Pop / +data[j].Area
                    json.features[i].pop_male = +data[j].M / +data[j].Total_Pop * 100
                    //json.features[i].area = +data[j].Area
                    //json.features[i].T_66plus = +data[i].T_66plus
                    //console.log(data[j])
                    //console.log("yes")
                }
            }
            //if (found == false) {// "Bangkok" in csv was named "Bangkok Metropolis" in json
              //  console.log("no")
                //console.log(json.features[i].properties.NAME_1)
            //}
        }
        //console.log(json.features)
        // bind data and create one path per GeoJSON feature
        // Population Density 
        // https://bl.ocks.org/oikonang/c645e2aa3a4fe313269afc1c39c8a05d (toggle button)
        d3.select("button").on("click", function(){
            // https://stackoverflow.com/questions/3674265/is-there-an-easy-way-to-clear-an-svg-elements-contents
            svg.selectAll("*").remove(); // remove contents of svg to prevent drawing over
            var domains = []
            var elem = document.getElementById("mybutton")
            
            // based on if the button clicked is the population density or male populaiton
            if(current_var == 'pop_density'){
                current_var = 'male_pop'
                elem.innerHTML = 'Population Density'
                domains = [44, 45, 46, 47, 48, 49, 50, 51] // set correct domain
            }
            else{
                domains = [0, 100, 200, 300, 400, 500, 1000, 2000] // set correct domain
                current_var = 'pop_density'
                elem.innerHTML = 'Male Population Percentage'
            }
            
            // define color scale for each province based on pop density or male pop domain
            // set color scale into nine even values in domain
            var color = d3.scaleThreshold()
                .domain(domains)
                .range(d3.schemeGreens[9])
            
            //draw map with corresponding color
            svg.selectAll("path")
                .data(json.features)
                .enter()
                .append("path")
                .attr("d", path)
                .style("fill", function (d) {
                   //console.log(d.pop_density)
                   if (current_var == 'pop_density'){
                       //console.log(color(2500))
                        //console.log(color(3000))
                        //console.log(color.domain())
                        //console.log(color.range())
                        //console.log(color.domain())
                       return color(d.pop_density)
                   }
                   else{
                       return color(d.pop_male)
                   }
                })

            //draw rectangles in legend
            svg.selectAll(null)
                .data(domains)
                .enter()
                .append("rect")
                .attr("y", 300)
                .attr("x", function (d, idx) { return idx*25 + 750})
                .attr("width", 30)
                .attr("height", 10)
                .style("fill", function (d){ 
                    return color(d)
                })

            // add text for each age range in legend to svg
            svg.selectAll(null)
                .data(domains)
                .enter()
                .append("text")
                .attr("y", 320)
                .attr("x", function (d, idx) { if (idx == 0) { return idx*25.5 + 750} return idx*25.5 + 742})
                .attr("font-size", "0.55em")
                .attr("color", "black")
                .text(function (d) { 
                    if(d == 2000){ 
                        return "2000+" // edge case
                    }
                    if(d == 51){
                        return '51+' // edge case
                    }
                    return d
                })

            // add legend title to svg
            svg.append("text")
                .attr("font-size", "0.8em")
                .attr("x", 757)
                .attr("y", 295)
                .style("font-weight", "bold")
                .text(function () {
                    if (current_var == 'pop_density') {
                        return "Population Density (per square km)"       
                    }
                    return "Male Population Percentage"
                })
        })
    })
});