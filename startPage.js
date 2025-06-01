import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
// const map = document.getElementById('bodymap');

// function createArea(shape, name, coor, web) {
//     const area = document.createElement('area');
//     area.shape = shape;
//     area.coords = coor;
//     area.alt = name;
//     area.title = name;
//     area.href = web;

//     document.getElementById('bodymap').appendChild(area);
// }

const svg = d3
        .select('#human')
        .append('svg')
        .attr('viewBox', `0 0 800 800`)
        .style('overflow', 'visible')
        .attr('preserveAspectRatio', 'xMidYMid meet');

function addInteractionArea(x, y, textx, texty, fill, web, text) {
    svg.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 30)
        .attr('fill', fill)
        .attr('class', 'interactive')
        .on('click', ()=>{window.location.href = web;});

    svg.append('text')
        .attr('x', textx)
        .attr('y', texty)
        .text('Head')
        .attr('fill', 'black')
        .attr('font-size', 12)
        .attr('class', 'interactive');
}

// const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
//   ? "/"
//   : "/DSC106_lab01/";

// console.log(BASE_PATH);
addInteractionArea(410, 150, 400, 150, 'steelblue', 'index.html', 'EDA');
