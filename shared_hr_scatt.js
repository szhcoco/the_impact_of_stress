// scales.js
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

export async function getHRScales(dataPromise, width, height, margin) {
    const data = await dataPromise;

    const xScale = d3
        .scaleLinear()
        .domain(d3.extent(data, d => +d.avg_HR))
        .nice();

    const yScale = d3
        .scaleLinear()
        .domain(d3.extent(data, d => +d.score));

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

    return { xScale, yScale, usableArea };
}

