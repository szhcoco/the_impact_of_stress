import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import * as EDA from './EDA.js';
import { getEDAScales } from './shared_eda_scatt.js';


// load data
async function loadData() {
    const studentCount = 10;
    const tests = ['Midterm 1', 'Midterm 2', 'Final'];
    const EDA_grades = [];

    const grades = await d3.csv('grades.csv', d => ({
        students: d.students,
        midterm_1: +d.Midterm_1,
        midterm_2: +d.Midterm_2,
        final: +d.Final / 2,

    }));

    for (let student = 1; student <= studentCount; student++) {
        const s = student < 10 ? `S0${student}` : `S${student}`;
        const s_grade = grades.find(g => g.students === s);

        // const avg_score = (s_grade.midterm_1 + s_grade.midterm_2 + s_grade.final / 2) / 3;
        // let allTestEDA = [];

        for (const test of tests) {
            const path = `dataset/S${student}_processed/${test}/EDA.csv`;

            const data = await d3.csv(path, d => ({
                EDA: +d.EDA,
                period: d.period.trim()
            }));

            const inTestEDA = data.filter(d => d.period === 'in-test').map(d => d.EDA);

            // allTestEDA.push(...inTestEDA);
            const avg_EDA = inTestEDA.reduce((sum, v) => sum + v, 0) / inTestEDA.length;

            let score;
            if (test === 'Midterm 1') score = s_grade.midterm_1;
            else if (test === 'Midterm 2') score = s_grade.midterm_2;
            else if (test === 'Final') score = s_grade.final;

            EDA_grades.push({
                student,
                test,
                avg_EDA: avg_EDA,
                score: score,
    
    
            });

        }


    }

    return EDA_grades;
}

// function to compute the best-fit line
function linearRegression(data) {
    const n = data.length;
    const sumX = d3.sum(data, d => d.avg_EDA);
    const sumY = d3.sum(data, d => d.score);
    const sumXY = d3.sum(data, d => d.avg_EDA * d.score);
    const sumX2 = d3.sum(data, d => d.avg_EDA * d.avg_EDA);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
}

export async function renderScatterPlot() {
    const data = await loadData();

    const width = 1100;
    const height = 600;
    const margin = { top: 20, right: 10, bottom: 50, left: 40 };

    const svg = d3
        .select('#chart1')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('width', width) 
        .attr('height', height);

    const {xScale, yScale, usableArea} = await getEDAScales(Promise.resolve(data), width, height, margin);
    

    // xScale = d3
    //     .scaleLinear()
    //     .domain(d3.extent(data, (d) => +d.avg_EDA))
    //     .range([0, width])
    //     .nice();

    // yScale = d3.scaleLinear().domain(d3.extent(data, (d) => +d.score)).range([height, 0])

    // xScale.range([usableArea.left, usableArea.right]);
    // yScale.range([usableArea.bottom, usableArea.top]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    // add legend for the dots
    const students = Array.from(new Set(data.map(d => d.student)));

    const color = d3.scaleOrdinal().domain(students).range(d3.schemePaired);

    const dots = svg.append('g').attr('class', 'dots');

    dots
        .selectAll('circle')
        .data(data, (d) => d.student)
        .enter()
        .append('circle')
        .attr('cx', (d) => xScale(d.avg_EDA))
        .attr('cy', (d) => yScale(d.score))
        .attr('r', 16)
        .style('opacity', 0)
        .style('fill', d => color(d.student))
        .attr('stroke', 'black')
        .attr('stroke-width', 0.5)
        .attr('class', d => `dot student-${d.student}`)
        .on('mouseover', (event, d) => {
            let svg = d3.select('#test');
            // let svg2 = d3.select('#mid2');
            // let svg3 = d3.select('#final');

            d3.select('#student-name').text('Student '+d.student + ' - ' + d.test + ": Score " + d.score);
            // d3.select('label#midterm1').text('Midterm 1 Score: '+d.midterm_1+' Rank: '+d.m1_rank);
            // d3.select('label#midterm2').text('Midterm 2 Score: '+d.midterm_2+' Rank: '+d.m2_rank);
            // d3.select('label#finalexam').text('Final Score: '+d.final+' Rank: '+d.final_rank);

            EDA.createPlot(svg, 'S'+d.student, d.test);
            // EDA.createPlot(svg2, 'S'+d.student, 'Midterm 2');
            // EDA.createPlot(svg3, 'S'+d.student, 'Final');
        });

    const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    // render xaxis
    svg
        .append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .attr('class', 'x-axis')
        .call(xAxis)
        .append("text")
        .attr('x', (usableArea.left + usableArea.right) / 2)
        .attr('y', 50)
        .attr('fill', 'black')
        .attr('text-anchor', 'middle')
        .attr('font-size', '20px')
        .text('Average EDA');
    
    // render yaxis
    svg
        .append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .attr('class', 'y-axis')
        .call(yAxis)
        .append('text')
        .attr("class", "y-axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -(usableArea.top + usableArea.bottom) / 2)
        .attr("y", -30)
        .attr("fill", "black")
        .attr('font-size', '20px')
        .text("Weighted Average Grade");


    // allow users to draw their line:
    svg.append('rect')
        .attr('class', 'draw-overlay')
        .attr('x', usableArea.left)
        .attr('y', usableArea.top)
        .attr('width', usableArea.right - usableArea.left)
        .attr('height', usableArea.bottom - usableArea.top)
        .style('fill', 'transparent')
        .style('cursor', 'crosshair');

    // Line to display user's drawing
    const userLine = svg.append('line')
        .attr('class', 'user-line')
        .attr('stroke', 'blue')
        .attr('stroke-width', 3)
        .attr('visibility', 'hidden');

    let isDrawing = false;
    let startPoint = null;

    svg.select('.draw-overlay')
        .on('mousedown', (event) => {
            isDrawing = true;
            const [mx, my] = d3.pointer(event);
            startPoint = [mx, my];
            userLine
                .attr('x1', mx)
                .attr('y1', my)
                .attr('x2', mx)
                .attr('y2', my)
                .attr('visibility', 'visible');
        })
        .on('mousemove', (event) => {
            if (!isDrawing) return;
            const [mx, my] = d3.pointer(event);
            userLine.attr('x2', mx).attr('y2', my);
        })
        .on('mouseup', (event) => {
            if (!isDrawing) return;
            isDrawing = false;

            const userCoords = {
                x1: +userLine.attr('x1'),
                y1: +userLine.attr('y1'),
                x2: +userLine.attr('x2'),
                y2: +userLine.attr('y2'),
            };

            showBestFitLine(userCoords);
        });



    // render legend
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);


    // give each student a legend
    // also enable clickable interaction:
    // when a student is selected, enlargen the three dots; and restore if click again
    const legendItem = legend.selectAll('.legend-item')
        .data(students)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 50})`)
        .style('cursor', 'pointer')
        .on('click', function(event, student) {
            const legend = d3.selectAll('.legend-item');
            const dots = d3.selectAll('.dot');
    
            const clickedLegend = d3.select(this);
            const isSelected = clickedLegend.classed('selected');
    
            if (isSelected) {
                clickedLegend.classed('selected', false);
                dots.filter(d => d.student === student)
                    .attr('r', 16);
            } else {
                legend.classed('selected', false);
                dots.attr('r', 16);
    
                clickedLegend.classed('selected', true);
                dots.filter(d => d.student === student)
                    .attr('r', 25);
            }
        });

    legendItem.append('rect')
        .attr('x', 0)
        .attr('y', -10)
        .attr('width', 28)
        .attr('height', 28)
        .attr('fill', d => color(d));

    legendItem.append('text')
        .attr('x', 45)
        .attr('y', 0)
        .attr('dy', '0.5em')
        .attr('font-size', '20px')
        .text(d => `Student ${d}`);
    
    // draw best fit line
    const { slope, intercept } = linearRegression(data);
    const xMin = d3.min(data, d => d.avg_EDA);
    const xMax = d3.max(data, d => d.avg_EDA);
    const bestFitLinePoints = [
        { x: xMin, y: slope * xMin + intercept },
        { x: xMax, y: slope * xMax + intercept }
    ];

    // the best fit line is initially hidden
    const bestFitLine = svg.append('line')
        .attr('class', 'best-fit-line')
        .attr('stroke', 'red')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '6,3')
        .attr('visibility', 'hidden');
    
    function showBestFitLine(userCoords) {

        bestFitLine
            .attr('visibility', 'visible')
            .attr('x1', userCoords.x1)
            .attr('y1', userCoords.y1)
            .attr('x2', userCoords.x2)
            .attr('y2', userCoords.y2)
            .transition()
            .duration(2000)
            .attr('x1', xScale(bestFitLinePoints[0].x))
            .attr('y1', yScale(bestFitLinePoints[0].y))
            .attr('x2', xScale(bestFitLinePoints[1].x))
            .attr('y2', yScale(bestFitLinePoints[1].y));
    
        svg.selectAll('.dots circle')
            .transition()
            .delay(1000)
            .duration(1000)
            .style('opacity', 0.8);
    }
}


// const data = loadData();
// console.log(data);

// renderScatterPlot();

