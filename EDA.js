import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';


export function createPlot(svg, student, exam) {
    svg.selectAll("*").remove();
    let margin = { top: 20, right: 60, bottom: 20, left: 60 };
    let boundingRect = svg.node().getBoundingClientRect();
    let width = boundingRect.width - margin.left - margin.right;
    let height = boundingRect.height - margin.top - margin.bottom;

    let g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    let xScale = d3.scaleLinear().range([0, width]);
    let yScale = d3.scaleLinear().range([height, 0]);

    let xAxisGroup = g.append("g").attr("transform", `translate(0,${height})`);
    let yAxisGroup = g.append("g");

    draw(student, exam, xScale, yScale, xAxisGroup, yAxisGroup, g, width, height);
}


function draw(student, exam, xScale, yScale, xAxisGroup, yAxisGroup, g, width, height) {

    

    // Clear old elements
    g.selectAll(".line-path, .line-dot, .vline, .label").remove();

    // Area
    Promise.all([
        d3.csv(`eda_min_max_${exam}.csv`, d3.autoType),
        d3.csv(`dataset/${student}_processed/${exam}/EDA.csv`, d3.autoType)
        ])
        .then(([areaData, personData]) => {
          xScale.domain(d3.extent(personData, d => +d.time_seconds));
          yScale.domain([0, d3.max(personData, d => +d.EDA)]).nice();


          xAxisGroup.call(d3.axisBottom(xScale));
          yAxisGroup.call(d3.axisLeft(yScale));
        // Downsample
        const N = 200;
        const downsampledData = areaData.filter((d, i) => i % N === 0);
    
        // SCALES
        const x = d3.scaleLinear()
            .domain(d3.extent(downsampledData, d => d.time_seconds))
            .range([0, width]);
        const y = d3.scaleLinear()
            .domain([0, d3.max(downsampledData, d => d.EDA_max, d3.max(personData, d => d.EDA))]).nice()
            .range([height, 0]);
    
        // AREA
        const area = d3.area()
            .curve(d3.curveMonotoneX)
            .x(d => x(d.time_seconds))
            .y0(d => y(d.EDA_min))
            .y1(d => y(d.EDA_max));
    
        g.append("path")
            .datum(downsampledData)
            .attr("class", "area")
            .attr("d", area);
    
        // AXES
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));
        g.append("g")
            .call(d3.axisLeft(y));
    
        // --- PERSON'S EDA LINE ---
        const personN = N;
        const downsampledPerson = personData.filter((d, i) => i % personN === 0);
    
        const personLine = d3.line()
            .curve(d3.curveMonotoneX)
            .x(d => x(d.time_seconds))
            .y(d => y(d.EDA));
    
        g.append("path")
            .datum(downsampledPerson)
            .attr("fill", "none")
            .attr("stroke", "crimson")
            .attr("stroke-width", 2)
            .attr("d", personLine);
    
    
    });

}
