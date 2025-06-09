// Global state
let currentSlide = 0;
const totalSlides = 7;
let visualizations = {
    HR: null,
    EDA: null,
    TEMP: null,
    ACC: null
};

// Global state for modal
let currentStudentData = null;
let currentMetric = null;

// Modal functions
function openStudentModal(studentData, metric) {
    try {
    currentStudentData = studentData;
    currentMetric = metric;
    
    const modal = document.getElementById('studentModal');
    const modalTitle = document.getElementById('modalTitle');
    
    if (modalTitle) {
        modalTitle.textContent = `Student ${studentData.student} - ${studentData.test} (${metric})`;
    }
    
    // Generate enlarged chart
    createEnlargedChart(studentData, metric);
    updateStudentStats(studentData, metric);
    
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    } catch (error) {
    console.error('Error opening student modal:', error);
    }
}

function closeStudentModal() {
    try {
    const modal = document.getElementById('studentModal');
    if (modal) {
        modal.classList.remove('show');
    }
    document.body.style.overflow = '';
    
    // Clear the enlarged chart
    d3.select('#enlargedChart').selectAll('*').remove();
    } catch (error) {
    console.error('Error closing student modal:', error);
    }
}

async function createEnlargedChart(studentData, metric) {
    const svg = d3.select('#enlargedChart');
    svg.selectAll('*').remove();

    const data = await generateTimeSeriesData(studentData.student, studentData.test, metric);
    const minMaxData = await generateMinMaxData(studentData.test, metric);
    const interestingMoments = findInterestingMoments(data, metric);
    
    const width = 500;
    const height = 400;
    const margin = { top: 40, right: 40, bottom: 60, left: 80 };

    const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.time_seconds))
    .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
    .domain([
        Math.min(d3.min(data, d => d[metric]), d3.min(minMaxData, d => d[`${metric}_min`])),
        Math.max(d3.max(data, d => d[metric]), d3.max(minMaxData, d => d[`${metric}_max`]))
    ])
    .range([height - margin.bottom, margin.top])
    .nice();

    const line = d3.line()
    .x(d => xScale(d.time_seconds))
    .y(d => yScale(d[metric]))
    .curve(d3.curveMonotoneX);

    // Create area for min/max envelope
    const area = d3.area()
    .x(d => xScale(d.time_seconds))
    .y0(d => yScale(d[`${metric}_min`]))
    .y1(d => yScale(d[`${metric}_max`]))
    .curve(d3.curveMonotoneX);

    const colorScale = d3.scaleOrdinal()
    .domain(['pre-test', 'in-test', 'post-test'])
    .range(['var(--pre-test)', 'var(--in-test)', 'var(--post-test)']);

    // Add background periods with labels
    let periods = [
    { name: 'pre-test', start: -300, end: 0, label: 'Pre-Test' },
    { name: 'in-test', start: 0, end: 5400, label: 'During Test' },
    { name: 'post-test', start: 5400, end: 5700, label: 'Post-Test' }
    ];
    if (studentData.test === 'Final') {
    periods = [
        { name: 'pre-test', start: -300, end: 0, label: 'Pre-Test' },
        { name: 'in-test', start: 0, end: 10800, label: 'During Test' },
        { name: 'post-test', start: 10800, end: 11100, label: 'Post-Test' }
    ];
    }

    periods.forEach(period => {
    svg.append('rect')
        .attr('x', xScale(period.start))
        .attr('y', margin.top)
        .attr('width', xScale(period.end) - xScale(period.start))
        .attr('height', height - margin.top - margin.bottom)
        .attr('fill', colorScale(period.name))
        .attr('opacity', 0.1);

    // Add period labels
    svg.append('text')
        .attr('x', xScale((period.start + period.end) / 2))
        .attr('y', margin.top - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('fill', colorScale(period.name))
        .text(period.label);
    });

    // Add gridlines
    svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).tickSize(-height + margin.top + margin.bottom).tickFormat(''));

    svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).tickSize(-width + margin.left + margin.right).tickFormat(''));

    // Add min/max area
    svg.append('path')
    .datum(minMaxData)
    .attr('fill', '#9ca3af')
    .attr('fill-opacity', 0.2)
    .attr('stroke', 'none')
    .attr('d', area);

    // Add boundary lines
    svg.append('path')
    .datum(minMaxData)
    .attr('fill', 'none')
    .attr('stroke', '#9ca3af')
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '3,3')
    .attr('d', d3.line()
        .x(d => xScale(d.time_seconds))
        .y(d => yScale(d[`${metric}_min`]))
        .curve(d3.curveMonotoneX)
    );

    svg.append('path')
    .datum(minMaxData)
    .attr('fill', 'none')
    .attr('stroke', '#9ca3af')
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '3,3')
    .attr('d', d3.line()
        .x(d => xScale(d.time_seconds))
        .y(d => yScale(d[`${metric}_max`]))
        .curve(d3.curveMonotoneX)
    );

    // Add student's data line
    svg.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'var(--accent-purple)')
    .attr('stroke-width', 3)
    .attr('d', line);

    // Add data points
    svg.selectAll('.data-point')
    .data(data.filter((d, i) => i % 5 === 0)) // Subsample for clarity
    .enter().append('circle')
    .attr('class', 'data-point')
    .attr('cx', d => xScale(d.time_seconds))
    .attr('cy', d => yScale(d[metric]))
    .attr('r', 3)
    .attr('fill', 'var(--accent-purple)')
    .attr('stroke', 'white')
    .attr('stroke-width', 1)
    .style('opacity', 0.8);

    // Add enhanced annotations
    const annotationGroup = svg.append('g').attr('class', 'annotations');

    interestingMoments.forEach((moment, i) => {
    const x = xScale(moment.time);
    const y = yScale(moment.value);

    // Add annotation point
    annotationGroup.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 6)
        .attr('fill', moment.color)
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

    // Add annotation callout
    const labelOffset = 60;
    const labelX = x + (i % 2 === 0 ? labelOffset : -labelOffset);
    const labelY = y - 20;

    // Callout line
    annotationGroup.append('line')
        .attr('x1', x)
        .attr('y1', y)
        .attr('x2', labelX)
        .attr('y2', labelY)
        .attr('stroke', moment.color)
        .attr('stroke-width', 2);

    // Callout background
    const textGroup = annotationGroup.append('g');
    
    const textBg = textGroup.append('rect')
        .attr('x', labelX - 50)
        .attr('y', labelY - 25)
        .attr('width', 100)
        .attr('height', 35)
        .attr('fill', 'white')
        .attr('stroke', moment.color)
        .attr('stroke-width', 1)
        .attr('rx', 4);

    const textElement = textGroup.append('text')
        .attr('x', labelX)
        .attr('y', labelY - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('font-weight', '600')
        .style('fill', moment.color);

    textElement.append('tspan')
        .attr('x', labelX)
        .text(moment.label);

    textElement.append('tspan')
        .attr('x', labelX)
        .attr('dy', '1.2em')
        .style('font-size', '10px')
        .style('font-weight', '400')
        .text(moment.description.replace(/[()]/g, ''));
    });

    // Add axes
    svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(8).tickFormat(d => `${Math.floor(d/60)}:${(d%60).toString().padStart(2,'0')}`))
    .selectAll('text')
    .style('font-size', '12px');

    svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).ticks(8))
    .selectAll('text')
    .style('font-size', '12px');

    // Add axis labels
    svg.append('text')
    .attr('x', width / 2)
    .attr('y', height - 10)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('font-weight', '600')
    .style('fill', 'var(--text-dark)')
    .text('Time (mm:ss)');

    svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 20)
    .attr('x', -height / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('font-weight', '600')
    .style('fill', 'var(--text-dark)')
    .text(`${metric} Value`);

    // Add legend
    const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width - 150}, ${margin.top + 10})`);

    const legendItems = [
    { color: 'var(--accent-purple)', label: 'Student Data', type: 'line' },
    { color: '#9ca3af', label: 'Population Range', type: 'area' }
    ];

    legendItems.forEach((item, i) => {
    const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

    if (item.type === 'line') {
        legendRow.append('line')
        .attr('x1', 0)
        .attr('x2', 15)
        .attr('y1', 5)
        .attr('y2', 5)
        .attr('stroke', item.color)
        .attr('stroke-width', 3);
    } else {
        legendRow.append('rect')
        .attr('width', 15)
        .attr('height', 10)
        .attr('fill', item.color)
        .attr('fill-opacity', 0.3);
    }

    legendRow.append('text')
        .attr('x', 20)
        .attr('y', 8)
        .style('font-size', '12px')
        .style('fill', 'var(--text-dark)')
        .text(item.label);
    });
}

async function updateStudentStats(studentData, metric) {
    try {
    const data = await generateTimeSeriesData(studentData.student, studentData.test, metric);
    const values = data.map(d => d[metric]);
    const inTestData = data.filter(d => d.period === 'in-test');
    const preTestData = data.filter(d => d.period === 'pre-test');
    const postTestData = data.filter(d => d.period === 'post-test');

    const avgValue = d3.mean(values) || 0;
    const peakValue = d3.max(values) || 0;
    const minValue = d3.min(values) || 0;
    
    const preTestAvg = d3.mean(preTestData, d => d[metric]) || 0;
    const inTestAvg = d3.mean(inTestData, d => d[metric]) || 0;
    const postTestAvg = d3.mean(postTestData, d => d[metric]) || 0;
    
    const stressIncrease = inTestAvg - preTestAvg;
    const recoveryRate = postTestAvg - inTestAvg;

    const avgElement = document.getElementById('avgValue');
    const peakElement = document.getElementById('peakValue');
    const minElement = document.getElementById('minValue');
    const stressElement = document.getElementById('stressIncrease');
    const recoveryElement = document.getElementById('recoveryRate');

    if (avgElement) avgElement.textContent = avgValue.toFixed(1);
    if (peakElement) peakElement.textContent = peakValue.toFixed(1);
    if (minElement) minElement.textContent = minValue.toFixed(1);
    if (stressElement) stressElement.textContent = stressIncrease > 0 ? `+${stressIncrease.toFixed(1)}` : stressIncrease.toFixed(1);
    if (recoveryElement) recoveryElement.textContent = recoveryRate > 0 ? `+${recoveryRate.toFixed(1)}` : recoveryRate.toFixed(1);
    } catch (error) {
    console.error('Error updating student stats:', error);
    }
}

// Mock data that mimics the original CSV structure
const gradesData = {
    'S1': { 'Midterm 1': 78, 'Midterm 2': 82, 'Final': 182 },
    'S2': { 'Midterm 1': 82, 'Midterm 2': 85, 'Final': 180 },
    'S3': { 'Midterm 1': 77, 'Midterm 2': 90, 'Final': 188 },
    'S4': { 'Midterm 1': 75, 'Midterm 2': 77, 'Final': 149 },
    'S5': { 'Midterm 1': 67, 'Midterm 2': 77, 'Final': 157 },
    'S6': { 'Midterm 1': 71, 'Midterm 2': 64, 'Final': 175 },
    'S7': { 'Midterm 1': 64, 'Midterm 2': 33, 'Final': 110 },
    'S8': { 'Midterm 1': 92, 'Midterm 2': 88, 'Final': 184 },
    'S9': { 'Midterm 1': 80, 'Midterm 2': 39, 'Final': 126 },
    'S10': { 'Midterm 1': 89, 'Midterm 2': 64, 'Final': 116 }
};

// Data loading functions
async function loadRealData(student, test, metric) {
    try {
    const path = `dataset/S${student}_processed/${test}/${metric}.csv`;
    const response = await fetch(path);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    let data = d3.csvParse(csvText, d => ({
        time_seconds: +d.time_seconds,
        [metric]: +d[metric],
        period: d.period ? d.period.trim() : 'unknown',
        timestamp: d.timestamp || ''
    }));
    
    // Significantly reduce ACC data points for faster loading
    if (metric === 'ACC') {
        data = data.filter((_, i) => i % 500 === 0); // Take every 500th point instead of 200th
    }
        if (metric === 'TEMP') {
          data = data.filter((_, i) => i % 20 === 0);
        }
        if (metric === 'EDA') {
          data = data.filter((_, i) => i % 20 === 0);
        }

    return data;
    } catch (error) {
    console.warn(`Failed to load real data for S${student}, ${test}, ${metric}:`, error);
    return null;
    }
}

async function loadMinMaxData(test, metric) {
    try {
    const path = `${metric}_min_max_${test}.csv`;
    const response = await fetch(path);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    let data = d3.csvParse(csvText, d => ({
        time_seconds: +d.time_seconds,
        [`${metric}_min`]: +d[`${metric}_min`],
        [`${metric}_max`]: +d[`${metric}_max`],
        period: d.period ? d.period.trim() : 'unknown'
    }));

    // Significantly reduce ACC data points for faster loading
    if (metric === 'ACC') {
        data = data.filter((_, i) => i % 500 === 0); // Take every 500th point instead of 200th
    }
        if (metric === 'TEMP') {
          data = data.filter((_, i) => i % 20 === 0);
        }
        if (metric === 'EDA') {
          data = data.filter((_, i) => i % 20 === 0);
        }
    
    return data;
    } catch (error) {
    console.warn(`Failed to load min/max data for ${test}, ${metric}:`, error);
    return null;
    }
}

// Data generation functions
async function generateMetricData(metric) {
    const data = [];
    const studentCount = 10;
    const tests = ['Midterm 1', 'Midterm 2', 'Final'];
    
    for (let student = 1; student <= studentCount; student++) {
    const studentId = `S${student}`;
    const gradeData = gradesData[studentId];
    
    for (const test of tests) {
        // Try to load real data first
        const realData = await loadRealData(student, test, metric);
        
        let avgMetric;
        let score;
        
        if (test === 'Midterm 1') score = gradeData['Midterm 1'];
        else if (test === 'Midterm 2') score = gradeData['Midterm 2'];
        else score = gradeData['Final'] / 2; // Divide final by 2 as in original code
        
        if (realData && realData.length > 0) {
        // Use real data - calculate average for in-test period
        const inTestData = realData.filter(d => d.period === 'in-test');
        if (inTestData.length > 0) {
            avgMetric = d3.mean(inTestData, d => d[metric]);
        } else {
            // Fallback to all data if no in-test period found
            avgMetric = d3.mean(realData, d => d[metric]);
        }
        } 
        else {
        // Generate mock data as fallback
        const baseStress = Math.random() * 0.5 + 0.5;
        const performanceCorrelation = Math.random() * 0.6 - 0.3;
        const normalizedScore = (score - 50) / 50;
        
        switch (metric) {
            case 'HR':
            avgMetric = 70 + baseStress * 25 + performanceCorrelation * normalizedScore * 15;
            break;
            case 'EDA':
            avgMetric = 2 + baseStress * 8 - performanceCorrelation * normalizedScore * 3;
            break;
            case 'TEMP':
            avgMetric = 36.2 + baseStress * 1.5 - performanceCorrelation * normalizedScore * 0.5;
            break;
            case 'ACC':
            avgMetric = 0.1 + baseStress * 0.6 - performanceCorrelation * normalizedScore * 0.2;
            break;
        }
        avgMetric = Math.max(0, avgMetric + (Math.random() - 0.5) * 2);
        }
        
        data.push({
        student: student,
        test: test,
        [`avg_${metric}`]: avgMetric,
        score: score
        });
    }
        
    }
    return data;
}

async function generateTimeSeriesData(student, test, metric) {
    // Try to load real data first
    const realData = await loadRealData(student, test, metric);
    
    if (realData && realData.length > 0) {
    // Return real data if available
    return realData;
    }
    
    // Generate mock data as fallback (keep existing mock generation code below)
    const data = [];
    const duration = 3600; // 1 hour
    const points = 120;
    
    for (let i = 0; i < points; i++) {
    const time = (i / points) * duration;
    let period = 'pre-test';
    if (time > 300 && time < 3300) period = 'in-test';
    else if (time >= 3300) period = 'post-test';
    
    let value;
    const stressMultiplier = period === 'in-test' ? 1.5 : 1.0;
    const timeNoise = Math.sin(time / 100) * 0.1 + (Math.random() - 0.5) * 0.2;
    
    switch (metric) {
        case 'HR':
        value = (60 + Math.random() * 20) * stressMultiplier + timeNoise * 10;
        break;
        case 'EDA':
        value = (2 + Math.random() * 4) * stressMultiplier + timeNoise * 2;
        break;
        case 'TEMP':
        value = 36.2 + Math.random() * 1.0 + (stressMultiplier - 1) * 0.8 + timeNoise * 0.3;
        break;
        case 'ACC':
        value = (0.1 + Math.random() * 0.4) * stressMultiplier + timeNoise * 0.1;
        break;
    }
    
    data.push({
        time_seconds: time,
        [metric]: Math.max(0, value),
        period: period,
        timestamp: new Date(Date.now() + time * 1000).toISOString()
    });
    }
    
    return data;
}

// Generate min/max envelope data across all students
async function generateMinMaxData(test, metric) {
    // Try to load real min/max data first
    const realMinMaxData = await loadMinMaxData(test, metric);
    
    if (realMinMaxData && realMinMaxData.length > 0) {
    return realMinMaxData;
    }
    
    // Generate mock min/max data as fallback (keep existing code below)
    const allStudentData = [];
    
    // Generate data for all 10 students
    for (let student = 1; student <= 10; student++) {
    const studentData = await generateTimeSeriesData(student, test, metric);
    allStudentData.push(studentData);
    }
    
    const points = allStudentData[0].length;
    const minMaxData = [];
    
    // Calculate min/max at each time point across all students
    for (let i = 0; i < points; i++) {
    const timePoint = allStudentData[0][i].time_seconds;
    const valuesAtTime = allStudentData.map(studentData => studentData[i][metric]);
    
    minMaxData.push({
        time_seconds: timePoint,
        [`${metric}_min`]: Math.min(...valuesAtTime),
        [`${metric}_max`]: Math.max(...valuesAtTime),
        period: allStudentData[0][i].period
    });
    }
    
    return minMaxData;
}

// Find interesting moments in the data
function findInterestingMoments(data, metric) {
    const values = data.map(d => d[metric]);
    const times = data.map(d => d.time_seconds);
    
    // Find max and min values
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const maxIndex = values.indexOf(maxValue);
    const minIndex = values.indexOf(minValue);
    
    // Find maximum fluctuation (largest derivative)
    let maxFluctuation = 0;
    let maxFluctuationIndex = 0;
    
    for (let i = 1; i < values.length - 1; i++) {
    const fluctuation = Math.abs(values[i + 1] - values[i - 1]);
    if (fluctuation > maxFluctuation) {
        maxFluctuation = fluctuation;
        maxFluctuationIndex = i;
    }
    }
    
    // Find stress onset (largest increase)
    let maxIncrease = 0;
    let stressOnsetIndex = 0;
    
    for (let i = 5; i < values.length - 5; i++) {
    const before = values.slice(i - 5, i).reduce((a, b) => a + b) / 5;
    const after = values.slice(i, i + 5).reduce((a, b) => a + b) / 5;
    const increase = after - before;
    
    if (increase > maxIncrease) {
        maxIncrease = increase;
        stressOnsetIndex = i;
    }
    }
    
    // Find recovery point (largest decrease during post-test)
    let maxDecrease = 0;
    let recoveryIndex = 0;
    const postTestData = data.filter(d => d.period === 'post-test');
    
    if (postTestData.length > 10) {
    const postTestStart = data.findIndex(d => d.period === 'post-test');
    const postTestValues = postTestData.map(d => d[metric]);
    
    for (let i = 5; i < postTestValues.length - 5; i++) {
        const before = postTestValues.slice(i - 5, i).reduce((a, b) => a + b) / 5;
        const after = postTestValues.slice(i, i + 5).reduce((a, b) => a + b) / 5;
        const decrease = before - after;
        
        if (decrease > maxDecrease) {
        maxDecrease = decrease;
        recoveryIndex = postTestStart + i;
        }
    }
    }
    
    const moments = [
    {
        type: 'max',
        index: maxIndex,
        value: maxValue,
        time: times[maxIndex],
        label: 'Peak Value',
        description: `Highest ${metric}: ${maxValue.toFixed(2)}`,
        color: '#ef4444'
    },
    {
        type: 'min',
        index: minIndex,
        value: minValue,
        time: times[minIndex],
        label: 'Minimum Value',
        description: `Lowest ${metric}: ${minValue.toFixed(2)}`,
        color: '#10b981'
    }
    ];
    
    if (maxFluctuation > 0) {
    moments.push({
        type: 'fluctuation',
        index: maxFluctuationIndex,
        value: values[maxFluctuationIndex],
        time: times[maxFluctuationIndex],
        label: 'High Variability',
        description: `Intense fluctuation (Δ${maxFluctuation.toFixed(2)})`,
        color: '#f59e0b'
    });
    }
    
    if (maxIncrease > 0) {
    moments.push({
        type: 'stress_onset',
        index: stressOnsetIndex,
        value: values[stressOnsetIndex],
        time: times[stressOnsetIndex],
        label: 'Stress Onset',
        description: `Rapid increase (+${maxIncrease.toFixed(2)})`,
        color: '#8b5cf6'
    });
    }
    
    if (maxDecrease > 0 && recoveryIndex > 0) {
    moments.push({
        type: 'recovery',
        index: recoveryIndex,
        value: values[recoveryIndex],
        time: times[recoveryIndex],
        label: 'Recovery',
        description: `Stress recovery (-${maxDecrease.toFixed(2)})`,
        color: '#06b6d4'
    });
    }
    
    return moments;
}

// Visualization functions
function createScatterPlot(containerId, data, metric) {
    const container = d3.select(`#${containerId}`);
    container.selectAll('*').remove();

    const width = 700;
    const height = 550;
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };

    const svg = container.append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', '100%');

    const xField = `avg_${metric}`;
    const yField = 'score';

    const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d[xField]))
    .range([margin.left, width - margin.right])
    .nice();

    const yScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d[yField]))
    .range([height - margin.bottom, margin.top])
    .nice();

    const colorScale = d3.scaleOrdinal()
    .domain(d3.range(1, 11))
    .range(['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1']);

    // Add gridlines
    svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).tickSize(-height + margin.top + margin.bottom).tickFormat(''));

    svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).tickSize(-width + margin.left + margin.right).tickFormat(''));

    // Add axes
    svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale))
    .append('text')
    .attr('x', width / 2)
    .attr('y', 40)
    .attr('fill', 'black')
    .style('text-anchor', 'middle')
    .style('font-size', '14px')
    .text(`Average ${metric}`);

    svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -40)
    .attr('x', -height / 2)
    .attr('fill', 'black')
    .style('text-anchor', 'middle')
    .style('font-size', '14px')
    .text('Exam Score');

    // Tooltip
    const tooltip = d3.select('.tooltip');

    // Add dots
    const dots = svg.selectAll('.dot')
    .data(data)
    .enter().append('circle')
    .attr('class', 'dot')
    .attr('cx', d => xScale(d[xField]))
    .attr('cy', d => yScale(d[yField]))
    .attr('r', 8)
    .attr('fill', d => colorScale(d.student))
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .style('opacity', 0)
    .style('cursor', 'pointer');

    // Add legend
    const legend = svg.selectAll('.legend')
    .data(d3.range(1, 11))
    .enter().append('g')
    .attr('class', 'legend legend-item')
    .attr('transform', (d, i) => `translate(${width - 100}, ${30 + i * 20})`)
    .style('cursor', 'pointer');

    legend.append('circle')
    .attr('r', 6)
    .attr('fill', d => colorScale(d))
    .attr('stroke', 'white')
    .attr('stroke-width', 1);

    legend.append('text')
    .attr('x', 12)
    .attr('y', 0)
    .attr('dy', '.35em')
    .style('font-size', '12px')
    .style('fill', '#64748b')
    .text(d => `S${d < 10 ? '0' + d : d}`);

    // Add interaction
    dots
    .on('mouseover', function(event, d) {
        d3.select(this).transition().duration(200).attr('r', 12);
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`
        <strong>Student ${d.student}</strong><br/>
        ${metric}: ${d[xField].toFixed(1)}<br/>
        Score: ${d[yField]}<br/>
        Test: ${d.test}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', function() {
        d3.select(this).transition().duration(200).attr('r', 8);
        tooltip.transition().duration(300).style('opacity', 0);
    })
    .on('click', function(event, d) {
        updateStudentDetails(d, metric);
    });

    // Legend interaction
    legend.on('click', function(event, studentId) {
    const isSelected = d3.select(this).classed('selected');
    
    legend.classed('selected', false);
    dots.attr('r', 8).style('opacity', 0.7);
    
    if (!isSelected) {
        d3.select(this).classed('selected', true);
        dots.filter(d => d.student === studentId)
        .attr('r', 12)
        .style('opacity', 1);
    }
    });

    // Drawing interaction
    let isDrawing = false;
    let userLine = null;
    let hasDrawn = false;

    const drawOverlay = svg.append('rect')
    .attr('class', 'draw-overlay')
    .attr('x', margin.left)
    .attr('y', margin.top)
    .attr('width', width - margin.left - margin.right)
    .attr('height', height - margin.top - margin.bottom)
    .style('fill', 'transparent')
    .style('cursor', 'crosshair')
    .style('pointer-events', 'all');

    // Add drawing instructions
    const instructionText = svg.append('text')
    .attr('x', width / 2)
    .attr('y', margin.top + 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', '#64748b')
    .style('opacity', 0.8)
    .text('Click and drag to draw your prediction line')
    .style('pointer-events', 'none');

    drawOverlay
    .on('mousedown', function(event) {
        if (hasDrawn) return;
        event.preventDefault();
        isDrawing = true;
        const [mx, my] = d3.pointer(event, this);
        
        userLine = svg.append('line')
        .attr('class', 'user-line')
        .attr('x1', mx)
        .attr('y1', my)
        .attr('x2', mx)
        .attr('y2', my)
        .style('stroke', 'var(--accent-blue)')
        .style('stroke-width', '3px')
        .style('stroke-linecap', 'round')
        .style('pointer-events', 'none');

        // Hide instruction text
        instructionText.style('opacity', 0);
    })
    .on('mousemove', function(event) {
        if (!isDrawing || !userLine) return;
        event.preventDefault();
        const [mx, my] = d3.pointer(event, this);
        userLine.attr('x2', mx).attr('y2', my);
    })
    .on('mouseup', function(event) {
        if (!isDrawing || !userLine) return;
        event.preventDefault();
        isDrawing = false;
        hasDrawn = true;
        
        // Ensure we have a valid line (not just a point)
        const x1 = parseFloat(userLine.attr('x1'));
        const y1 = parseFloat(userLine.attr('y1'));
        const x2 = parseFloat(userLine.attr('x2'));
        const y2 = parseFloat(userLine.attr('y2'));
        
        const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        
        if (distance > 20) { // Minimum line length
        showBestFitLine(data, xField, yField, xScale, yScale, svg, userLine, metric);
        drawOverlay
            .style('cursor', 'default')
            .style('pointer-events', 'none');
        } else {
        // Line too short, reset
        userLine.remove();
        userLine = null;
        isDrawing = false;
        hasDrawn = false;
        instructionText.style('opacity', 0.8);
        }
    })
    .on('mouseleave', function() {
        if (isDrawing && userLine) {
        // If mouse leaves while drawing, cancel the line
        userLine.remove();
        userLine = null;
        isDrawing = false;
        hasDrawn = false;
        instructionText.style('opacity', 0.8);
        }
    });

    // Show dots with animation only after best fit line is shown
    return { svg, dots, legend, showDots: () => {
    dots.transition()
        .delay((d, i) => i * 50)
        .duration(500)
        .style('opacity', 0.7);
    }};
}

function showBestFitLine(data, xField, yField, xScale, yScale, svg, userLine, metric) {
    try {
    // Calculate best fit line
    const n = data.length;
    const sumX = d3.sum(data, d => d[xField]);
    const sumY = d3.sum(data, d => d[yField]);
    const sumXY = d3.sum(data, d => d[xField] * d[yField]);
    const sumX2 = d3.sum(data, d => d[xField] * d[xField]);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const xExtent = d3.extent(data, d => d[xField]);
    
    const bestFitLine = svg.append('line')
        .attr('class', 'best-fit-line')
        .attr('x1', xScale(xExtent[0]))
        .attr('y1', yScale(slope * xExtent[0] + intercept))
        .attr('x2', xScale(xExtent[1]))
        .attr('y2', yScale(slope * xExtent[1] + intercept))
        .style('opacity', 0);

    // Animate best fit line
    bestFitLine.transition()
        .delay(500)
        .duration(1000)
        .style('opacity', 1)
        .on('end', () => {
        // Show dots only after best fit line animation completes
        if (visualizations[metric] && visualizations[metric].showDots) {
            visualizations[metric].showDots();
        }
        });

    // Calculate accuracy
    if (userLine) {
        const userCoords = {
        x1: +userLine.attr('x1'),
        y1: +userLine.attr('y1'),
        x2: +userLine.attr('x2'),
        y2: +userLine.attr('y2')
        };

        const ux1 = xScale.invert(userCoords.x1);
        const uy1 = yScale.invert(userCoords.y1);
        const ux2 = xScale.invert(userCoords.x2);
        const uy2 = yScale.invert(userCoords.y2);

        const userSlope = (uy2 - uy1) / (ux2 - ux1);
        const userIntercept = uy1 - userSlope * ux1;

        // Calculate accuracy based on angle difference and position similarity
        const actualAngle = Math.atan(slope) * 180 / Math.PI;
        const userAngle = Math.atan(userSlope) * 180 / Math.PI;
        const angleDiff = Math.abs(actualAngle - userAngle);

        // Calculate position accuracy by comparing predicted vs actual values at key points
        const xMid = (d3.max(data, d => d[xField]) + d3.min(data, d => d[xField])) / 2;
        const yUserMid = userSlope * xMid + userIntercept;
        const yTrueMid = slope * xMid + intercept;
        const yRange = d3.max(data, d => d[yField]) - d3.min(data, d => d[yField]);
        const positionError = Math.abs(yUserMid - yTrueMid) / yRange;

        // Combine angle and position accuracy (angle is more important)
        const angleAccuracy = Math.max(0, 100 - angleDiff * 2); // 2% penalty per degree
        const positionAccuracy = Math.max(0, 100 - positionError * 100);
        const accuracy = Math.max(0, angleAccuracy * 0.7 + positionAccuracy * 0.3);

        console.log(`Accuracy calculation: angle=${actualAngle.toFixed(1)}°, userAngle=${userAngle.toFixed(1)}°, angleDiff=${angleDiff.toFixed(1)}°, accuracy=${accuracy.toFixed(1)}%`);

        showFeedback(metric, accuracy);
    }
    } catch (error) {
    console.error('Error showing best fit line:', error);
    }
}

async function createTimeSeriesPlot(containerId, student, test, metric) {
    const svg = d3.select(`#${containerId}`);
    svg.selectAll('*').remove();

    let data = await generateTimeSeriesData(student, test, metric);
    let minMaxData = await generateMinMaxData(test, metric);
    
    // Further reduce ACC data for time series plots to improve performance
    if (metric === 'ACC') {
    data = data.filter((_, i) => i % 10 === 0); // Take every 10th point for display
    minMaxData = minMaxData.filter((_, i) => i % 10 === 0);
    }
    
    const interestingMoments = findInterestingMoments(data, metric);
    
    const width = 320;
    const height = 200;
    const margin = { top: 20, right: 15, bottom: 40, left: 50 };

    const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.time_seconds))
    .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
    .domain([
        Math.min(d3.min(data, d => d[metric]), d3.min(minMaxData, d => d[`${metric}_min`])),
        Math.max(d3.max(data, d => d[metric]), d3.max(minMaxData, d => d[`${metric}_max`]))
    ])
    .range([height - margin.bottom, margin.top])
    .nice();

    const line = d3.line()
    .x(d => xScale(d.time_seconds))
    .y(d => yScale(d[metric]))
    .curve(d3.curveMonotoneX);

    // Create area for min/max envelope
    const area = d3.area()
    .x(d => xScale(d.time_seconds))
    .y0(d => yScale(d[`${metric}_min`]))
    .y1(d => yScale(d[`${metric}_max`]))
    .curve(d3.curveMonotoneX);

    const colorScale = d3.scaleOrdinal()
    .domain(['pre-test', 'in-test', 'post-test'])
    .range(['var(--pre-test)', 'var(--in-test)', 'var(--post-test)']);

    // Add background periods
    const periods = test === 'Final' ? [
    { name: 'pre-test', start: -300, end: 0, label: 'Pre-Test' },
    { name: 'in-test', start: 0, end: 10800, label: 'During Test' },
    { name: 'post-test', start: 10800, end: 11100, label: 'Post-Test' }
    ] : [
    { name: 'pre-test', start: -300, end: 0 },
    { name: 'in-test', start: 0, end: 5400 },
    { name: 'post-test', start: 5400, end: 5700 }
    ];

    periods.forEach(period => {
    svg.append('rect')
        .attr('x', xScale(period.start))
        .attr('y', margin.top)
        .attr('width', xScale(period.end) - xScale(period.start))
        .attr('height', height - margin.top - margin.bottom)
        .attr('fill', colorScale(period.name))
        .attr('opacity', 0.15);
    });

    // Add min/max area (grey envelope)
    svg.append('path')
    .datum(minMaxData)
    .attr('fill', '#9ca3af')
    .attr('fill-opacity', 0.3)
    .attr('stroke', 'none')
    .attr('d', area);

    // Add area boundary lines
    svg.append('path')
    .datum(minMaxData)
    .attr('fill', 'none')
    .attr('stroke', '#9ca3af')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '2,2')
    .attr('d', d3.line()
        .x(d => xScale(d.time_seconds))
        .y(d => yScale(d[`${metric}_min`]))
        .curve(d3.curveMonotoneX)
    );

    svg.append('path')
    .datum(minMaxData)
    .attr('fill', 'none')
    .attr('stroke', '#9ca3af')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '2,2')
    .attr('d', d3.line()
        .x(d => xScale(d.time_seconds))
        .y(d => yScale(d[`${metric}_max`]))
        .curve(d3.curveMonotoneX)
    );

    // Add student's data line
    svg.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'var(--accent-purple)')
    .attr('stroke-width', 2.5)
    .attr('d', line);

    // Add interesting moment annotations
    const annotationGroup = svg.append('g').attr('class', 'annotations');

    interestingMoments.forEach((moment, i) => {
    const x = xScale(moment.time);
    const y = yScale(moment.value);

    // Add annotation point
    annotationGroup.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 4)
        .attr('fill', moment.color)
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

    // Add annotation line and label
    const labelOffset = i % 2 === 0 ? -30 : 25;
    const labelY = y + labelOffset;

    // Annotation line
    annotationGroup.append('line')
        .attr('x1', x)
        .attr('y1', y)
        .attr('x2', x)
        .attr('y2', labelY)
        .attr('stroke', moment.color)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2');

    // Annotation background
    const textElement = annotationGroup.append('text')
        .attr('x', x)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .style('font-size', '9px')
        .style('font-weight', '600')
        .style('fill', moment.color);

    textElement.append('tspan')
        .attr('x', x)
        .attr('dy', '-0.5em')
        .text(moment.label);

    textElement.append('tspan')
        .attr('x', x)
        .attr('dy', '1em')
        .style('font-size', '8px')
        .style('font-weight', '400')
        .text(moment.description);

    // Add interactive tooltip for annotations
    const annotationCircle = annotationGroup.select(`circle:nth-child(${i * 3 + 1})`);
    annotationCircle
        .style('cursor', 'pointer')
        .on('mouseover', function(event) {
        d3.select(this).transition().duration(200).attr('r', 6);
        
        const tooltip = d3.select('.tooltip');
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`
            <strong>${moment.label}</strong><br/>
            ${moment.description}<br/>
            Time: ${Math.floor(moment.time / 60)}:${(moment.time % 60).toFixed(0).padStart(2, '0')}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function() {
        d3.select(this).transition().duration(200).attr('r', 4);
        d3.select('.tooltip').transition().duration(300).style('opacity', 0);
        });
    });

    // Add axes
    svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(4).tickFormat(d => `${Math.floor(d/60)}m`))
    .selectAll('text')
    .style('font-size', '9px');

    svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).ticks(4))
    .selectAll('text')
    .style('font-size', '9px');

    // Add labels
    svg.append('text')
    .attr('x', width / 2)
    .attr('y', height - 8)
    .attr('text-anchor', 'middle')
    .style('font-size', '10px')
    .style('fill', 'var(--text-muted)')
    .text('Time');

    svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 12)
    .attr('x', -height / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '10px')
    .style('fill', 'var(--text-muted)')
    .text(metric);

    // Add legend for the grey area
    const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${margin.left + 5}, ${margin.top + 5})`);

    legend.append('rect')
    .attr('width', 12)
    .attr('height', 8)
    .attr('fill', '#9ca3af')
    .attr('fill-opacity', 0.3)
    .attr('stroke', '#9ca3af')
    .attr('stroke-width', 1);

    legend.append('text')
    .attr('x', 16)
    .attr('y', 6)
    .style('font-size', '8px')
    .style('fill', 'var(--text-muted)')
    .text('All students range');
}

async function updateStudentDetails(studentData, metric) {
    try {
    const studentNameElement = document.querySelector(`#${metric.toLowerCase()}-student-name`);
    const testSvg = `${metric.toLowerCase()}-test`;
    
    if (studentNameElement) {
        studentNameElement.textContent = `Student ${studentData.student} - ${studentData.test}: Score ${studentData.score}`;
    }
    
    await createTimeSeriesPlot(testSvg, studentData.student, studentData.test, metric);
    
    // Add click handler to enlarge
    const timeSeriesElement = document.querySelector(`#${testSvg}`);
    if (timeSeriesElement && timeSeriesElement.parentElement) {
        const timeSeriesContainer = timeSeriesElement.parentElement;
        timeSeriesContainer.style.cursor = 'pointer';
        timeSeriesContainer.onclick = () => openStudentModal(studentData, metric);
    }
    } catch (error) {
    console.error('Error updating student details:', error);
    }
}

function showFeedback(metric, accuracy) {
    const feedbackElement = document.querySelector(`#${metric.toLowerCase()}-feedback`);
    if (!feedbackElement) return;
    
    feedbackElement.style.display = 'block';
    
    if (accuracy >= 70) {
    feedbackElement.className = 'feedback-box success';
    feedbackElement.innerHTML = `🎉 Great job! Your prediction accuracy: ${accuracy.toFixed(1)}%`;
    } else {
    feedbackElement.className = 'feedback-box info';
    feedbackElement.innerHTML = `📊 Good try! Your prediction accuracy: ${accuracy.toFixed(1)}%`;
    }
}

async function resetVisualization(metric) {
    if (!metric) return;
    
    const chartId = `${metric}-chart`;
    const feedbackId = `${metric.toLowerCase()}-feedback`;
    const studentNameId = `${metric.toLowerCase()}-student-name`;
    const testId = `${metric.toLowerCase()}-test`;
    
    try {
    // Reset feedback
    const feedbackElement = document.getElementById(feedbackId);
    if (feedbackElement) {
        feedbackElement.style.display = 'none';
    }
    
    // Reset student details
    const studentNameElement = document.getElementById(studentNameId);
    if (studentNameElement) {
        studentNameElement.textContent = 'Click on a data point to explore';
    }
    
    const testElement = d3.select(`#${testId}`);
    testElement.selectAll('*').remove();
    
    // Clear existing chart
    d3.select(`#${chartId}`).selectAll('*').remove();
    
    // Recreate visualization
    const data = await generateMetricData(metric);
    visualizations[metric] = createScatterPlot(chartId, data, metric);
    } catch (error) {
    console.error(`Error resetting ${metric} visualization:`, error);
    }
}

// Navigation functions
function showSlide(slideIndex) {
    // Ensure slideIndex is within bounds
    if (slideIndex < 0 || slideIndex >= totalSlides) return;
    
    document.querySelectorAll('.slide').forEach(slide => slide.classList.remove('active'));
    document.querySelectorAll('.nav-dot').forEach((dot, index) => {
    dot.classList.toggle('active', index === slideIndex);
    });
    
    const targetSlide = document.querySelector(`.slide[data-index="${slideIndex}"]`);
    if (targetSlide) {
    targetSlide.classList.add('active');
    }
    
    // Immediately scroll to top with no animation to avoid conflicts
    window.scrollTo(0, 0);
    
    // Also ensure body scroll is reset
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    
    updateNavigation(slideIndex);

    // Hide navigation hints after first slide
    if (slideIndex > 0) {
    const nextPageHint = document.getElementById('nextPageHint');
    const scrollHint = document.getElementById('scrollHint');
    if (nextPageHint) nextPageHint.classList.add('hidden');
    if (scrollHint) scrollHint.classList.add('hidden');
    }
    
    // Load visualizations when needed
    if (slideIndex >= 2 && slideIndex <= 5) {
    const metrics = ['HR', 'TEMP', 'EDA', 'ACC']; // Fixed order to match slide indices
    const metric = metrics[slideIndex - 2];
    
    // Clear existing visualization first
    const chartContainer = document.querySelector(`#${metric}-chart`);
    if (chartContainer && !chartContainer.querySelector('svg')) {
        setTimeout(async () => {
        try {
            const data = await generateMetricData(metric);
            visualizations[metric] = createScatterPlot(`${metric}-chart`, data, metric);
        } catch (error) {
            console.error(`Error creating ${metric} visualization:`, error);
        }
        }, 100);
    }
    }
}

function changeSlide(direction) {
    const newSlide = currentSlide + direction;
    if (newSlide >= 0 && newSlide < totalSlides) {
    currentSlide = newSlide;
    
    // Force scroll to top before showing new slide
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    
    showSlide(currentSlide);
    
    // Ensure we stay at top after slide transition
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 100);
    }
}

function updateNavigation(slideIndex) {
    try {
    const currentSlideElement = document.getElementById('currentSlide');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (currentSlideElement) {
        currentSlideElement.textContent = slideIndex + 1;
    }
    
    if (prevBtn) {
        prevBtn.disabled = slideIndex === 0;
    }
    
    if (nextBtn) {
        nextBtn.disabled = slideIndex === totalSlides - 1;
    }
    } catch (error) {
    console.error('Error updating navigation:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Ensure we start at the top of the page
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    history.scrollRestoration = 'manual';
    // Set up navigation dots
    document.querySelectorAll('.nav-dot').forEach((dot, index) => {
    dot.addEventListener('click', function() {
        currentSlide = index;
        showSlide(currentSlide);
    });
    });

    // Set up keyboard navigation
    document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') changeSlide(-1);
    if (e.key === 'ArrowRight') changeSlide(1);
    if (e.key === 'Escape') closeStudentModal();
    });

    // Set up scroll navigation
    let scrollTimeout;
    let isScrolling = false;
    
    document.addEventListener('wheel', function(e) {
    // Don't navigate if modal is open
    const modal = document.getElementById('studentModal');
    if (modal && modal.classList.contains('show')) {
        return;
    }
    
    if (isScrolling) return;
    
    // Check if we're at the top or bottom of the page
    const isAtTop = window.scrollY <= 10;
    const isAtBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 10;
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        if (Math.abs(e.deltaY) > 50) { // Minimum scroll threshold
        isScrolling = true;
        
        if (e.deltaY > 0) {
            // Scrolling down - next slide (only if at bottom or page doesn't scroll)
            if (isAtBottom || document.body.scrollHeight <= window.innerHeight) {
            changeSlide(1);
            }
        } else {
            // Scrolling up - previous slide (only if at top)
            if (isAtTop) {
            changeSlide(-1);
            }
        }
        
        // Reset scrolling flag after animation
        setTimeout(() => {
            isScrolling = false;
        }, 600);
        }
    }, 100);
    }, { passive: false });

    // Set up modal click outside to close
    document.getElementById('studentModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeStudentModal();
    }
    });

    // Initialize navigation
    updateNavigation(currentSlide);
});
