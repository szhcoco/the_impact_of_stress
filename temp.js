import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const svg = d3.select("svg");
const tooltip = d3.select(".tooltip");
const margin = { top: 20, right: 60, bottom: 50, left: 60 };
const width = +svg.attr("width") - margin.left - margin.right;
const height = +svg.attr("height") - margin.top - margin.bottom;
const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

let xScale = d3.scaleLinear().range([0, width]);
let yScale = d3.scaleLinear().range([height, 0]);

const xAxisGroup = g.append("g").attr("transform", `translate(0,${height})`);
const yAxisGroup = g.append("g");

const lineEDA = d3.line().x(d => xScale(d.time_seconds)).y(d => yScaleEDA(d.EDA));
const lineHR = d3.line().x(d => xScale(d.time_seconds)).y(d => yScaleHR(d.HR));

function setupTooltip(selection, field) {
  selection
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", .9);
      tooltip.html(`${field}: ${d[field]}<br/>Time: ${d.time_seconds}s<br/>Timestamp: ${d.timestamp}<br/>Period: ${d.period}`)
             .style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(500).style("opacity", 0);
    });
}

// Add vertical test period markers
function addPeriodLine(g, edaData) {
    let endTest;
    let endTestText;
    const startTest = edaData.find(d => d.timestamp === "09:00:00")?.time_seconds;
    if (exam !== "Final") {
        endTest = edaData.find(d => d.timestamp === "10:30:00")?.time_seconds;
        endTestText = "End Test (10:30)";
    }
    else {
        endTest = edaData.find(d => d.timestamp === "12:00:00")?.time_seconds;
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
    { label: "EDA", color: "steelblue" },
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
function handleData(edaData, hrData) {
    // Create a lookup for HR by timestamp
    const hrMap = new Map();
    hrData.forEach(d => hrMap.set(d.timestamp, +d.HR));

    // Merge HR into EDA where timestamps match
    edaData = edaData
      .filter(d => hrMap.has(d.timestamp))
      .map(d => ({
        ...d,
        EDA: +d.EDA,
        time_seconds: +d.time_seconds,
        HR: hrMap.get(d.timestamp)
      }));

    //get start timestamp to change x-axis later
    const startTimestamp = edaData[0].timestamp; 
    const parseTime = d3.timeParse("%H:%M:%S");
    const formatTime = d3.timeFormat("%H:%M"); // format for axis ticks 
    const startTime = parseTime(startTimestamp);

    // Define scales
    xScale.domain(d3.extent(edaData, d => d.time_seconds));
    yScaleEDA.domain([0, d3.max(edaData, d => d.EDA)]).nice();
    yScaleHR.domain([0, d3.max(edaData, d => d.HR)]).nice();

    // Draw axes
    xAxisGroup.call(
        d3.axisBottom(xScale)
          .ticks(10)  // or adjust as needed
          .tickFormat(d => {
            const date = new Date(startTime.getTime() + d * 1000); // seconds to ms
            return formatTime(date);  // e.g., "09:15"
        })
    );
    yAxisEDAGroup.call(d3.axisLeft(yScaleEDA));
    yAxisHRGroup.call(d3.axisRight(yScaleHR));

    // Clear old elements
    g.selectAll(".line-path, .dot, .hr-dot, .vline, .label").remove();

    const colors = [
        { label: "EDA", color: "steelblue" },
        { label: "Heart Rate", color: "darkorange" }
    ];

    // EDA line
    g.append("path")
      .datum(edaData)
      .attr("class", "line-path")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", lineEDA);

    // HR line
    g.append("path")
      .datum(edaData)
      .attr("class", "line-path")
      .attr("fill", "none")
      .attr("stroke", "darkorange")
      .attr("stroke-width", 1.5)
      .attr("d", lineHR);

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
        .text("EDA (μS)");
    g.append("text")
        .attr("class", "y-axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", width + margin.right - 15)
        .text("Heart Rate");

    // Tooltip points for EDA
    setupTooltip(
      g.selectAll(".dot")
        .data(edaData)
        .enter().append("circle")
          .attr("class", "dot")
          .attr("cx", d => xScale(d.time_seconds))
          .attr("cy", d => yScaleEDA(d.EDA))
          .attr("r", 4)
          .attr("fill", "transparent")
          .attr("stroke", "transparent"),
      "EDA"
    );

    // Tooltip points for HR
    setupTooltip(
      g.selectAll(".hr-dot")
        .data(edaData)
        .enter().append("circle")
          .attr("class", "hr-dot")
          .attr("cx", d => xScale(d.time_seconds))
          .attr("cy", d => yScaleHR(d.HR))
          .attr("r", 4)
          .attr("fill", "transparent")
          .attr("stroke", "transparent"),
      "HR"
    );

    addPeriodLine(g, edaData);
    addLegends(g, colors);
}

function draw(datasetBase) {
    //path for EDA and HR
  const edaPath = datasetBase;
  const hrPath = datasetBase.replace("EDA", "HR");
    //load the dataset
  Promise.all([
    d3.csv(edaPath),
    d3.csv(hrPath)
  ]).then(([edaData, hrData]) => {
    handleData(edaData, hrData);
  });
}


// Initial dataset
let student = "S1";
let exam = "Midterm 1";
draw("Data/S1_processed/Midterm 1/EDA.csv");

// Dropdown to change dataset
document.getElementById("dataset-select").addEventListener("change", function () {
    exam = this.value;
    draw("Data/"+student+"_processed/"+exam+"/EDA.csv");
});

// Change student
document.getElementById("student-select").addEventListener("change", function () {
    student = this.value;
    draw("Data/"+student+"_processed/"+exam+"/EDA.csv");
});