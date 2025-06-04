import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const margin = {top: 20, right: 30, bottom: 40, left: 50},
          width = 800 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

const svg = d3.select("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Load the CSV
// Load both datasets: area (min/max) and person's EDA
Promise.all([
    d3.csv("eda_min_max_final.csv", d3.autoType),
    d3.csv("dataset/S4_processed/Final/EDA.csv", d3.autoType)
    ])
    .then(([areaData, personData]) => {
        
    // Downsample
    const N = 500;
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

    svg.append("path")
        .datum(downsampledData)
        .attr("class", "area")
        .attr("d", area);

    // AXES
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));
    svg.append("g")
        .call(d3.axisLeft(y));

    // --- PERSON'S EDA LINE ---
    // Optionally downsample the personData too, for speed
    const personN = N;
    const downsampledPerson = personData.filter((d, i) => i % personN === 0);

    const personLine = d3.line()
        .curve(d3.curveMonotoneX)
        .x(d => x(d.time_seconds))
        .y(d => y(d.EDA));

    svg.append("path")
        .datum(downsampledPerson)
        .attr("fill", "none")
        .attr("stroke", "crimson")
        .attr("stroke-width", 2)
        .attr("d", personLine);

    // Optional: add a legend
    svg.append("text")
        .attr("x", 60)
        .attr("y", 25)
        .style("fill", "crimson")
        .style("font-size", "14px")
        .text("Person's EDA");
});