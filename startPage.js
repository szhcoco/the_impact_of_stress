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
        .text(text)
        .attr('fill', 'black')
        .attr('font-size', 15)
        .attr('class', 'interactive');
}

addInteractionArea(390, 50, 380, 50, '#7cbdf7', 'EDA_scatt.html', 'EDA');
addInteractionArea(430, 170, 420, 170, '#f14b4e', 'HR.html', 'HR');
addInteractionArea(500, 400, 490, 400, '#ff9631', 'temp.html','temp');
addInteractionArea(290, 400, 280, 400, '#00d6a0', 'ACC.html', 'ACC');
