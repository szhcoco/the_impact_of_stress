import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import * as EDA from './EDA.js';


// load data
async function loadData() {
    const studentCount = 10;
    const tests = ['Midterm 1', 'Midterm 2', 'Final'];
    const eda_grades = [];

    const grades = await d3.csv('grades.csv', d => ({
        students: d.students,
        midterm_1: +d.Midterm_1,
        midterm_2: +d.Midterm_2,
        final: +d.Final
    }));

    for (let student = 1; student <= studentCount; student++) {
        const s = student < 10 ? `S0${student}` : `S${student}`;
        const s_grade = grades.find(g => g.students === s);
        const avg_score = (s_grade.midterm_1 + s_grade.midterm_2 + s_grade.final / 2) / 3;


        let allTestEDA = [];

        for (const test of tests) {
            const path = `dataset/S${student}_processed/${test}/EDA.csv`;

            const data = await d3.csv(path, d => ({
                EDA: +d.EDA,
                period: d.period.trim()
            }));

            const inTestEDA = data.filter(d => d.period === 'in-test').map(d => d.EDA);


            allTestEDA.push(...inTestEDA);

        }

        const avg_eda = allTestEDA.reduce((sum, v) => sum + v, 0) / allTestEDA.length;

        eda_grades.push({
            student,
            avg_EDA: avg_eda,
            avg_score: avg_score,
            midterm_1: s_grade.midterm_1,
            midterm_2: s_grade.midterm_2,
            final: s_grade.final,
            


        });
    }

    return eda_grades;
}


async function renderScatterPlot() {
    const data = await loadData();

    const width = 600;
    const height = 400;

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('width', width) // <- Add this
        .attr('height', height);
    
    // const svg = d3
    //     .select('#chart')
    //     .append('svg')
    //     .attr('viewBox', `0 0 ${width} ${height}`)
    //     .attr('preserveAspectRatio', 'xMidYMid meet')
    //     .style('width', '100%')
    //     .style('height', '100%');

    // x axis = avg_eda
    const xScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => +d.avg_EDA))
        .range([0, width])
        .nice();

    const yScale = d3.scaleLinear().domain(d3.extent(data, (d) => +d.avg_score)).range([height, 0])

    const margin = { top: 10, right: 10, bottom: 50, left: 40 };

    const usableArea = {
        // start at y = 10 (y increase from top to bottom)
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    const dots = svg.append('g').attr('class', 'dots');

    dots
        .selectAll('circle')
        .data(data, (d) => d.student)
        .enter()
        .append('circle')
        .attr('cx', (d) => xScale(d.avg_EDA))
        .attr('cy', (d) => yScale(d.avg_score))
        .attr('r', 5)
        .style('fill-opacity', 0.7)
        .style('fill', 'steelblue')
        .on('mouseover', (event, d) => {
            let svg1 = d3.select('#mid1');
            let svg2 = d3.select('#mid2');
            let svg3 = d3.select('#final');

            d3.select('#student-name').text('Student '+d.student);
            d3.select('label#midterm1').text('Midterm 1 Score: '+d.midterm_1);
            d3.select('label#midterm2').text('Midterm 2 Score: '+d.midterm_2);
            d3.select('label#finalexam').text('Final Score: '+d.final);

            EDA.createPlot(svg1, 'dataset/S'+d.student+'_processed/Midterm 1/EDA.csv');
            EDA.createPlot(svg2, 'dataset/S'+d.student+'_processed/Midterm 2/EDA.csv');
            EDA.createPlot(svg3, 'dataset/S'+d.student+'_processed/Final/EDA.csv');
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
        .attr('y', 30)
        .attr('fill', 'black')
        .attr('text-anchor', 'middle')
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
        .text("Weighted Average Grade");
}

const data = loadData();
console.log(data);

renderScatterPlot();

// dataset/S1_processed/Midterm 1/EDA.csv