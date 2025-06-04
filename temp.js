import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let svg1 = d3.select('#mid1');
let svg2 = d3.select('#mid2');
let svg3 = d3.select('#final');

export function createPlot(svg, Path) {
    svg.selectAll("*").remove();
    let margin = { top: 20, right: 60, bottom: 50, left: 60 };
    let boundingRect = svg.node().getBoundingClientRect();
    let width = boundingRect.width - margin.left - margin.right;
    let height = boundingRect.height - margin.top - margin.bottom;
    // let width = +svg.attr("width") - margin.left - margin.right;
    // let height = +svg.attr("height") - margin.top - margin.bottom;
    let g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    let xScale = d3.scaleLinear().range([0, width]);
    let yScale = d3.scaleLinear().range([height, 0]);

    let xAxisGroup = g.append("g").attr("transform", `translate(0,${height})`);
    let yAxisGroup = g.append("g");

    let line = d3.line().x(d => xScale(d.time_seconds)).y(d => yScale(d.TEMP));

    draw(Path, xScale, yScale, xAxisGroup, yAxisGroup, g, line, width, height, margin);
}

const tooltip = d3.select(".tooltip");

function setupTooltip(selection, field) {
  selection
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", .9);
      tooltip.html(`${field}: ${d[field]}<br/>Time: ${d.time_seconds}s<br/>Timestamp: ${d.timestamp}<br/>Period: ${d.period}`)
             .style("left", `${event.pageX + 10}px`)
             .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", () => {
      tooltip.transition().duration(500).style("opacity", 0);
    });
}

// Add vertical test period markers
function addPeriodLine(g, TEMPData) {
    let endTest;
    let endTestText;
    const startTest = TEMPData.find(d => d.timestamp === "09:00:00")?.time_seconds;
    if (exam !== "Final") {
        endTest = TEMPData.find(d => d.timestamp === "10:30:00")?.time_seconds;
        endTestText = "End Test (10:30)";
    }
    else {
        endTest = TEMPData.find(d => d.timestamp === "12:00:00")?.time_seconds;
        endTestText = "End Test (12:00)";
    }

    if (startTest !== undefined) {
      g.append("line")
        .attr("class", "vline")
        .attr("x1", xScale(startTest))
        .attr("x2", xScale(startTest))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "red")
        .attr("stroke-dasharray", "4");
      g.append("text")
        .attr("class", "label")
        .attr("x", xScale(startTest) + 5)
        .attr("y", 15)
        .text("Start Test (9:00)")
        .attr("fill", "red");
    }

    if (endTest !== undefined) {
      g.append("line")
        .attr("class", "vline")
        .attr("x1", xScale(endTest))
        .attr("x2", xScale(endTest))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "red")
        .attr("stroke-dasharray", "4");
      g.append("text")
        .attr("class", "label")
        .attr("x", xScale(endTest) + 5)
        .attr("y", 15)
        .text(endTestText)
        .attr("fill", "red");
    }
}

function addLegends(g, legendColors) {
    // Legend data
const legendData = [
    { label: "TEMP", color: "steelblue" },
    { label: "Heart Rate", color: "darkorange" }
  ];
  
  // Location of legends
  const legend = g.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
  
  legendColors.forEach((d, i) => {
    const legendRow = legend.append("g")
      .attr("transform", `translate(0, ${i * 20})`);
  
    // Colored square
    legendRow.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", d.color);
  
    // Label
    legendRow.append("text")
      .attr("x", 18)
      .attr("y", 10)
      .attr("font-size", "12px")
      .attr("fill", "black")
      .text(d.label);
  });
}
function handlTEMPta(Data, xScale, yScale, xAxisGroup, yAxisGroup, g, line, width, height, margin) {
    // Create a lookup for TEMP by timestamp
    //get start timestamp to change x-axis later
    const startTimestamp = Data[0].timestamp; 
    const parseTime = d3.timeParse("%H:%M:%S");
    const formatTime = d3.timeFormat("%H:%M"); // format for axis ticks 
    const startTime = parseTime(startTimestamp);
    // Define scales
    xScale.domain(d3.extent(Data, d => +d.time_seconds));
    yScale.domain([0, d3.max(Data, d => +d.TEMP)]).nice();

    // Draw axes
    // xAxisGroup.call(
    //     d3.axisBottom(xScale)
    //       .ticks(10)  // or adjust as needed
    //       .tickFormat(d => {
    //         const date = new Date(startTime.getTime() + d * 1000); // seconds to ms
    //         return formatTime(date);  // e.g., "09:15"
    //     })
    // );
    xAxisGroup.call(d3.axisBottom(xScale));
    yAxisGroup.call(d3.axisLeft(yScale));

    // Clear old elements
    g.selectAll(".line-path, .line-dot, .vline, .label").remove();

    // TEMP line
    g.append("path")
      .datum(Data)
      .attr("class", "line-path")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", line);


    //axis name
    g.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .text("Time");
    g.append("text")
        .attr("class", "y-axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .text("TEMP");


    // Tooltip points for TEMP
    setupTooltip(
      g.selectAll(".line-dot")
        .data(Data)
        .enter().append("circle")
          .attr("class", "line-dot")
          .attr("cx", d => xScale(d.time_seconds))
          .attr("cy", d => yScale(d.TEMP))
          .attr("r", 4)
          .attr("fill", "transparent")
          .attr("stroke", "transparent"),
      "TEMP"
    );

    //addPeriodLine(g, Data);
    //addLegends(g, colors);
}

function draw(datasetBase, xScale, yScale, xAxisGroup, yAxisGroup, g, line, width, height, margin) {
    //path for TEMP and TEMP
  const dataPath = datasetBase;
    //load the dataset
  Promise.all([
    d3.csv(dataPath)
  ]).then(([Data]) => {
    handlTEMPta(Data, xScale, yScale, xAxisGroup, yAxisGroup, g, line, width, height, margin);
  });
}