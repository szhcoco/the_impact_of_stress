import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';


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
            avg_score: avg_score

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

    // x axis = avg_eda
    const xScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => +d.avg_EDA))
        .range([0, width])
        .nice();

    const yScale = d3.scaleLinear().domain(d3.extent(data, (d) => +d.avg_score)).range([height, 0])

    const margin = { top: 10, right: 10, bottom: 30, left: 20 };

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
        .on('hover', (event, d) => {
            
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
        .call(xAxis);
    
    // render yaxis
    svg
        .append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .attr('class', 'y-axis')
        .call(yAxis);



}

const data = loadData();
console.log(data);

renderScatterPlot();

// dataset/S1_processed/Midterm 1/EDA.csv