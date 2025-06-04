import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let svg1 = d3.select('#mid1');
let svg2 = d3.select('#mid2');
let svg3 = d3.select('#final');

const dataSave = {};

export function createPlot(svg, student, exam) {
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

    let line = d3.line().x(d => xScale(d.time_seconds)).y(d => yScale(d.EDA));

    draw(student, exam, xScale, yScale, xAxisGroup, yAxisGroup, g, line, width, height, margin);
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

function handleData(mainData, allStudentData, xScale, yScale, xAxisGroup, yAxisGroup, g, line, width, height, margin) {
    // Create a lookup for eda by timestamp
    //get start timestamp to change x-axis later
    // const startTimestamp = mainData[0].timestamp; 
    // const parseTime = d3.timeParse("%H:%M:%S");
    // const formatTime = d3.timeFormat("%H:%M"); // format for axis ticks 
    // const startTime = parseTime(startTimestamp);
    // Define scales

    console.log(mainData);
    xScale.domain(d3.extent(mainData, d => +d.time_seconds));
    yScale.domain([0, d3.max(mainData, d => +d.EDA)]).nice();

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

    // EDA line
    g.append("path")
      .datum(mainData)
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
        .text("EDA");


    // Tooltip points for eda
    setupTooltip(
      g.selectAll(".line-dot")
        .data(mainData)
        .enter().append("circle")
          .attr("class", "line-dot")
          .attr("cx", d => xScale(d.time_seconds))
          .attr("cy", d => yScale(d.EDA))
          .attr("r", 4)
          .attr("fill", "transparent")
          .attr("stroke", "transparent"),
      "EDA"
    );

    //addPeriodLine(g, Data);
    //addLegends(g, colors);



    // for area data:

    const timePoints = mainData.map(d => +d.time_seconds);

    const areaData = timePoints.map(time => {
      const edaValues = allStudentData.map(studentData => {
        const matchTimeData = studentData.find(d => +d.time_seconds === time);
        return matchTimeData;
      });

      return {
        time_seconds: time,
        min: d3.min(edaValues),
        max:d3.max(edaValues),
      }

    });

    const area = d3.area().x(d => xScale(d.time_seconds)).y0(d => yScale(d.min)).y1(d => yScale(d.max));

    g.append('path')
      .datum(areaData)
      .attr('fill', 'grey')
      .attr('stroke', 'none')
      .attr('opacity', 0.4)
      .attr('d', area);
}

function draw(student, exam, xScale, yScale, xAxisGroup, yAxisGroup, g, line, width, height, margin) {


  const allStudents = ['S1', 'S2','S3','S4','S5','S6','S7','S8', 'S9', 'S10'];

  if (dataSave[exam]) {
    const mainData = dataSave[exam][student];
    const allStudentData = allStudents.map(s => dataSave[exam][s]);
    handleData(mainData, allStudentData, xScale, yScale, xAxisGroup, yAxisGroup, g, line, width, height, margin);
  }
  else {
    const allPaths = allStudents.map(s => `dataset/${s}_processed/${exam}/EDA.csv`);

    Promise.all(allPaths.map(path => d3.csv(path))).then(allDataCSV => {
      const save = {};
      allStudents.forEach((s, i) => {
        save[s] = allDataCSV[i];
      });

      dataSave[exam] = save;

      const mainData = save[student];
      const allStudentData = allStudents.map(s => save[s]);
      handleData(mainData, allStudentData, xScale, yScale, xAxisGroup, yAxisGroup, g, line, width, height, margin);
    });
  }


  //   //path for EDA and HR
  // const dataPath = datasetBase;
  //   //load the dataset
  // Promise.all([
  //   d3.csv(dataPath)
  // ]).then(([Data]) => {
  //   handleData(Data, xScale, yScale, xAxisGroup, yAxisGroup, g, line, width, height, margin);
  // });
}


// Initial dataset
// let student = "S1";
// createPlot(svg1, 'dataset/S1_processed/Midterm 1/EDA.csv');
// createPlot(svg2, 'dataset/S1_processed/Midterm 2/EDA.csv');
// createPlot(svg3, 'dataset/S1_processed/Final/HR.csv');

// Change student
// document.getElementById("student-select").addEventListener("change", function () {
//     student = this.value;
//     createPlot(svg1, 'dataset/'+student+'_processed/Midterm 1/EDA.csv');
//     createPlot(svg2, 'dataset/'+student+'_processed/Midterm 2/EDA.csv');
//     createPlot(svg3, 'dataset/'+student+'_processed/Final/EDA.csv');
// });