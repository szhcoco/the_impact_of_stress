import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import * as ACC from './ACC.js';


// load data
async function loadData() {
    const studentCount = 10;
    const tests = ['Midterm 1', 'Midterm 2', 'Final'];
    const ACC_grades = [];

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
        // let allTestACC = [];

        for (const test of tests) {
            const path = `dataset/S${student}_processed/${test}/ACC.csv`;

            const data = await d3.csv(path, d => ({
                ACC: +d.ACC,
                period: d.period.trim()
            }));

            const inTestACC = data.filter(d => d.period === 'in-test').map(d => d.ACC);

            // allTestACC.push(...inTestACC);
            const avg_ACC = inTestACC.reduce((sum, v) => sum + v, 0) / inTestACC.length;

            let score;
            if (test === 'Midterm 1') score = s_grade.midterm_1;
            else if (test === 'Midterm 2') score = s_grade.midterm_2;
            else if (test === 'Final') score = s_grade.final;

            ACC_grades.push({
                student,
                test,
                avg_ACC: avg_ACC,
                score: score,
    
    
            });

        }


    }

    return ACC_grades;
}


async function renderScatterPlot() {
    const data = await loadData();

    const width = 1100;
    const height = 600;

    const svg = d3
        .select('#chart4')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('width', width) 
        .attr('height', height);
    

    const xScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => +d.avg_ACC))
        .range([0, width])
        .nice();

    const yScale = d3.scaleLinear().domain(d3.extent(data, (d) => +d.score)).range([height, 0])

    const margin = { top: 20, right: 10, bottom: 50, left: 40 };

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left + 250,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

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
        .attr('cx', (d) => xScale(d.avg_ACC))
        .attr('cy', (d) => yScale(d.score))
        .attr('r', 16)
        .style('fill-opacity', 0.8)
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

            ACC.createPlot(svg, 'S'+d.student, d.test);
            // ACC.createPlot(svg2, 'S'+d.student, 'Midterm 2');
            // ACC.createPlot(svg3, 'S'+d.student, 'Final');
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
        .text('Average ACC');
    
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

}

const data = loadData();
console.log(data);

renderScatterPlot();