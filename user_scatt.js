import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const width = 800;
const height = 600;

const margin = { top: 20, right: 10, bottom: 50, left: 40 };

const usableArea = {
  top: margin.top,
  right: width - margin.right,
  bottom: height - margin.bottom,
  left: margin.left,
  width: width - margin.left - margin.right,
  height: height - margin.top - margin.bottom,
};

const svg = d3.select('#chart0')
  .append('svg')
  .attr('viewBox', `0 0 ${width} ${height}`)
  .attr('width', width)
  .attr('height', height);

  const xScale = d3.scaleLinear()
  .domain([40, 180])
  .range([0, usableArea.width])
  .nice();

const yScale = d3.scaleLinear()
  .domain([0, 100])
  .range([usableArea.height, 0]);

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

g.append("g").call(d3.axisLeft(yScale));
g.append("g").attr("transform", `translate(0, ${usableArea.height})`).call(d3.axisBottom(xScale));


svg.append("text")
  .attr("x", width / 2)
  .attr("y", height - 5)
  .attr("text-anchor", "middle")
  .text("Avg Heart Rate (bpm) During Test");

svg.append("text")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", 15)
  .attr("text-anchor", "middle")
  .text("Grade out of 100");

// allow users to draw a line 
let drawing = false;
let userLine = [];

const line = d3.line()
.curve(d3.curveBasis)
.x(d => xScale(d[0]))
.y(d => yScale(d[1]));

const path = g.append('path').attr('class', 'line');

svg.on("mousedown", (event) => {
    userLine = [];
    drawing = true;
    const [x, y] = d3.pointer(event, g.node());
    userLine.push([xScale.invert(x), yScale.invert(y)]);
    path.datum(userLine).attr("d", line);
  });

svg.on("mousemove", (event) => {
    if (!drawing) return;
    const [x, y] = d3.pointer(event, g.node());
    userLine.push([xScale.invert(x), yScale.invert(y)]);
    path.datum(userLine).attr("d", line);
});

svg.on("mouseup", () => {
    drawing = false;
    console.log("User drawn data:", userLine);
});