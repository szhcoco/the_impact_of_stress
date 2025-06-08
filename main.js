// Dataset structure handler
class DataHandler {
    constructor() {
        this.datasetPath = 'dataset/';
        this.students = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'];
        this.exams = ['Midterm 1', 'Midterm 2', 'Final'];
        this.signals = ['HR', 'EDA', 'TEMP'];
        this.grades = {
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
        this.loadedData = {};
    }
    
    // Get file path based on student, exam, and signal
    getFilePath(student, exam, signal) {
        return `${this.datasetPath}${student}_processed/${exam}/${signal}.csv`;
    }
    
    // Load and parse CSV data
    async loadCSVData(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`Failed to fetch ${filePath}`);
            
            const csvText = await response.text();
            return this.parseCSV(csvText);
        } catch (error) {
            console.error('Error loading CSV:', error);
            return null;
        }
    }
    
    // Parse CSV text into structured data
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim());
        const signal = headers[0]; // First column is the signal type
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',');
            const entry = {};

            for (let j = 0; j < headers.length; j++) {
                const key = headers[j];
                const value = values[j] ? values[j].trim() : '';
                entry[key] = value;
            }

            // Add parsed numeric fields if present
            if (entry[signal] !== undefined) entry.value = parseFloat(entry[signal]);
            if (entry.time_seconds !== undefined) entry.time_seconds = parseFloat(entry.time_seconds);

            data.push(entry);
        }

        return data;
    }
    
    // Load data for a specific student and signal across all exams
    async loadStudentData(student, exam) {
        const studentData = {};
        
        for (const signal of this.signals) {
            const filePath = this.getFilePath(student, exam, signal);
            studentData[signal] = await this.loadCSVData(filePath);
        }
        
        this.loadedData[student] = this.loadedData[student] || {};
        this.loadedData[student][exam] = studentData;

        return studentData;
    }
    
    // Get grade for a student and exam
    getGrade(student, exam) {
        return this.grades[student]?.[exam] || null;
    }
    
    // Generate mock data for demonstration purposes
    generateMockData(student, exam, signal) {
        const duration = exam === 'Final' ? 180 : 90; // minutes
        const data = [];
        const startTime = new Date();
        
        for (let i = 0; i < duration * 60; i += 10) { // 10-second intervals
            let value;
            let period;
            
            // Determine period
            if (i < 15 * 60) period = 'pre-test';
            else if (i < (duration - 15) * 60) period = 'in-test';
            else period = 'post-test';
            
            // Generate values based on signal type
            if (signal === 'HR') {
                // Heart rate: baseline 70-80, increases during test
                value = 70 + Math.random() * 10;
                if (period === 'in-test') value += 15 + Math.random() * 10;
            } else if (signal === 'EDA') {
                // EDA: baseline 1-3, increases during test
                value = 1 + Math.random() * 2;
                if (period === 'in-test') value += 3 + Math.random() * 2;
            } else if (signal === 'TEMP') {
                // Temperature: baseline 36-37, decreases during stress
                value = 36.0 + Math.random() * 1.0;
                if (period === 'in-test') value -= 0.5 + Math.random() * 0.5;
            } else if (signal === 'BVP') {
                // BVP: baseline 0.4-0.6, decreases during stress
                value = 0.4 + Math.random() * 0.2;
                if (period === 'in-test') value -= 0.1 + Math.random() * 0.1;
            }
            
            // Add some noise and variation
            value += (Math.random() - 0.5) * (value * 0.1);
            
            // Create data point
            data.push({
                signal: signal,
                timestamp: new Date(startTime.getTime() + i * 1000).toISOString(),
                time_seconds: i,
                period: period,
                value: value
            });
        }
        
        return data;
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    const dataHandler = new DataHandler();
    let currentStudent = 'S1';
    let currentExam = 'Midterm 1';

    // Add animations for scrolldown elements

    // Smooth scroll to next section on click
    document.getElementById('scroll-down-btn').addEventListener('click', function() {
    // Find the next element after the hero section
    const heroSection = this.closest('.hero');
    let next = heroSection.nextElementSibling;
    // Skip text nodes or comments
    while (next && next.nodeType !== 1) next = next.nextSibling;
    if (next) {
        next.scrollIntoView({ behavior: 'smooth' });
    }
    // Animate the button
    this.style.transform = 'translateY(20px)';
    setTimeout(() => {
        this.style.transform = '';
    }, 300);
    });
    
    // DOM elements
    const studentSelect = document.getElementById('student-select');
    const examSelect = document.getElementById('exam-select');
    // const refreshBtn = document.getElementById('refresh-btn');
    const loadDataBtn = document.getElementById('load-data-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const periodSelect = document.getElementById('period-select');
    const signalSelect = document.getElementById('signal-select');
    
    // Initialize charts with empty data
    renderTimelineChart('hr-chart', [], currentExam, 'HR');
    renderTimelineChart('eda-chart', [], currentExam, 'EDA');
    renderTimelineChart('temp-chart', [], currentExam, 'TEMP');

    // TODO: Fix this later!
    renderPerformanceChart(dataHandler, signalSelect.value);

    // Load data button
    loadDataBtn.addEventListener('click', async function() {
        try {
            loadingIndicator.style.display = 'block';
            
            // Get current selections
            currentStudent = studentSelect.value;
            currentExam = examSelect.value;
            
            // Load data for the selected student and signal
            await dataHandler.loadStudentData(currentStudent, currentExam);
            
            // Update charts
            updateCharts(dataHandler, currentStudent, currentExam);
            
            loadingIndicator.style.display = 'none';
        } catch (error) {
            console.error('Error loading data:', error);
            loadingIndicator.style.display = 'none';
            alert('Error loading data. Using mock data for demonstration.');
            useMockData(dataHandler, currentStudent, currentExam);
        }
    });
    
    // Refresh button
    // refreshBtn.addEventListener('click', function() {
    //     currentStudent = studentSelect.value;
    //     currentSignal = signalSelect.value;
    //     updateCharts(dataHandler, currentStudent, currentSignal);
    // });
    
    // Period select change
    periodSelect.addEventListener('change', function() {
        renderPerformanceChart(dataHandler, signalSelect.value);
    });

    // Signal select change
    signalSelect.addEventListener('change', function() {
        renderPerformanceChart(dataHandler, signalSelect.value);
    });
    
    // Use mock data for initial demonstration
    useMockData(dataHandler, currentStudent, currentExam);
});

// Use mock data for demonstration
function useMockData(dataHandler, student, exam) {
    const mockData = {};
    
    for (const signal of dataHandler.signals) {
        mockData[signal] = dataHandler.generateMockData(student, exam, signal);
    }
    
    dataHandler.loadedData[student] = dataHandler.loadedData[student] || {};
    dataHandler.loadedData[student][exam] = mockData;
    
    updateCharts(dataHandler, student, exam);
}

// Update all charts
function updateCharts(dataHandler, student, exam) {
    const studentData = dataHandler.loadedData[student]?.[exam];
    
    if (studentData) {
        renderTimelineChart('hr-chart', studentData['HR'], exam, 'HR');
        renderTimelineChart('eda-chart', studentData['EDA'], exam, 'EDA');
        renderTimelineChart('temp-chart', studentData['TEMP'], exam, 'TEMP');
    }
    
}

// Render timeline chart
function renderTimelineChart(containerId, data, examTitle, signal) {
    const container = d3.select(`#${containerId}`);
    container.html('');
    
    // Add tooltip (append to the chart container div, not SVG)
    let tooltip = container.select('.tooltip');
    if (tooltip.empty()) {
        tooltip = d3.select(container.node())
            .append('div')
            .attr('class', 'tooltip');
    }
    
    const width = container.node().clientWidth;
    const height = container.node().clientHeight;
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // If no data, show message
    if (!data || data.length === 0) {
        svg.append('text')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight / 2)
            .attr('text-anchor', 'middle')
            .attr('fill', '#6c757d')
            .text('Load data to visualize physiological signals');
        return;
    }
    
    // Scales
    const xScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.time_seconds) - 20, d3.max(data, d => d.time_seconds) + 20])
        .range([0, innerWidth]);
    
    const yMin = d3.min(data, d => d.value) * 0.95;
    const yMax = d3.max(data, d => d.value) * 1.05;
    const yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([innerHeight, 0]);
    
    // Color scale for periods
    const colorScale = d3.scaleOrdinal()
        .domain(['pre-test', 'in-test', 'post-test'])
        .range(['#6a89cc', '#f8c291', '#82ccdd']);
    
    // Draw period backgrounds
    const periodBoundaries = {
        'pre-test': { start: 0, end: 15 * 60 },
        'in-test': { 
            start: 15 * 60, 
            end: (examTitle === 'Final' ? 180 : 90) * 60 - 15 * 60 
        },
        'post-test': { 
            start: (examTitle === 'Final' ? 180 : 90) * 60 - 15 * 60, 
            end: (examTitle === 'Final' ? 180 : 90) * 60 
        }
    };
    
    for (const [period, boundary] of Object.entries(periodBoundaries)) {
        svg.append('rect')
            .attr('x', xScale(boundary.start))
            .attr('y', 0)
            .attr('width', xScale(boundary.end - boundary.start))
            .attr('height', innerHeight)
            .attr('fill', colorScale(period))
            .attr('opacity', 0.1);
    }
    
    // Line generator
    const line = d3.line()
        .x(d => xScale(d.time_seconds))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);
    
    // Draw line
    svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#9d4edd')
        .attr('stroke-width', 2)
        .attr('d', line);
    
    // Draw dots for interaction
    const dots = svg.selectAll('.dot')
        .data(data.filter((d, i) => i % 20 === 0)) // Sample points for performance
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', d => xScale(d.time_seconds))
        .attr('cy', d => yScale(d.value))
        .attr('r', 3)
        .attr('fill', d => colorScale(d.period))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .on('mouseover', function(event, d) {
            // Position tooltip relative to the container
            const containerRect = d3.select(this.parentNode.parentNode.parentNode).node().getBoundingClientRect();
            const xPos = event.clientX - containerRect.left;
            const yPos = event.clientY - containerRect.top;
            
            // Update tooltip content
            tooltip.html(`
                <div class="tooltip-title">${d.period.replace('-', ' ').toUpperCase()}</div>
                <div class="tooltip-content">
                    <p>Time: ${Math.floor(d.time_seconds/60)}:${(d.time_seconds%60).toString().padStart(2, '0')}</p>
                    <p>${signal}: ${d.value.toFixed(2)}</p>
                </div>
            `)
            .style('left', (xPos + 10) + 'px')
            .style('top', (yPos - 20) + 'px')
            .style('opacity', 1);
        })
        .on('mouseout', function() {
            tooltip.style('opacity', 0);
        });
    
    // Add axes
    const xAxis = d3.axisBottom(xScale)
        .ticks(6)
        .tickFormat(d => {
            const mins = Math.floor(d / 60);
            return `${mins} min`;
        });
        
    const yAxis = d3.axisLeft(yScale).ticks(5);
    
    svg.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis);
    
    svg.append('g')
        .call(yAxis);
    
    // Add axis labels
    svg.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + margin.bottom - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6c757d')
        .text('Exam Time');
    
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -margin.left + 15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6c757d')
        .text(signal);
    
    // Add chart title
    svg.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#343a40')
        .attr('font-weight', '600')
        .text(examTitle);

    // draw axes
  svg.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(xAxis);
  svg.append('g')
    .call(yAxis);

  // add a hidden vertical line for hover
  const hoverLine = svg.append('line')
    .attr('class', 'hover-line')
    .attr('y1', 0)
    .attr('y2', innerHeight)
    .attr('stroke', '#666')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4 4')
    .style('opacity', 0);

  // bisector to find nearest x
  const bisect = d3.bisector(d => d.time_seconds).left;

  // transparent overlay to capture mouse events
  svg.append('rect')
    .attr('class', 'overlay')
    .attr('width', innerWidth)
    .attr('height', innerHeight)
    .style('fill', 'none')
    .style('pointer-events', 'all')
    .on('mousemove', onMouseMove)
    .on('mouseout', () => {
      hoverLine.style('opacity', 0);
      tooltip.style('opacity', 0);
    });

  function onMouseMove(event) {
    const [mouseX] = d3.pointer(event);
    const x0 = xScale.invert(mouseX);
    const i = bisect(data, x0);
    const d0 = data[i - 1];
    const d1 = data[i];
    // pick nearest of the two
    const d = (!d1 || (x0 - d0.time_seconds) < (d1.time_seconds - x0)) ? d0 : d1;

    // move hover line
    hoverLine
      .attr('x1', xScale(d.time_seconds))
      .attr('x2', xScale(d.time_seconds))
      .style('opacity', 1);

    // position & populate tooltip
    const containerRect = container.node().getBoundingClientRect();
    const tooltipX = xScale(d.time_seconds) + margin.left;
    const tooltipY = yScale(d.value) + margin.top;

    tooltip.html(`
        <div class="tooltip-title">${d.period.replace('-', ' ').toUpperCase()}</div>
        <div class="tooltip-content">
          <p>Time: ${Math.floor(d.time_seconds/60)}:${(d.time_seconds%60).toString().padStart(2,'0')}</p>
          <p>${signal}: ${d.value.toFixed(2)}</p>
        </div>`)
      .style('left', `${tooltipX + 10}px`)
      .style('top',  `${tooltipY - 20}px`)
      .style('opacity', 1);
  }
}

// Render performance chart
function renderPerformanceChart(dataHandler, signal) {
    const container = d3.select('#performance-chart');
    container.html('');
    
    const width = container.node().clientWidth;
    const height = container.node().clientHeight;
    const margin = { top: 30, right: 30, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Get selected period
    const period = document.getElementById('period-select').value;
    
    // Generate mock data for demonstration
    const data = [];
    for (const student of dataHandler.students) {
        // Get grade for the final exam
        const grade = dataHandler.getGrade(student, 'Final');
        
        // Generate mock signal value for the selected period
        let signalValue;
        if (signal === 'HR') {
            signalValue = 70 + Math.random() * 15;
            if (period === 'in-test') signalValue += 10 + Math.random() * 10;
        } else if (signal === 'EDA') {
            signalValue = 2 + Math.random() * 3;
            if (period === 'in-test') signalValue += 2 + Math.random() * 2;
        } else if (signal === 'TEMP') {
            signalValue = 36.0 + Math.random() * 1.0;
            if (period === 'in-test') signalValue -= 0.4 + Math.random() * 0.4;
        } else if (signal === 'BVP') {
            signalValue = 0.4 + Math.random() * 0.2;
            if (period === 'in-test') signalValue -= 0.1 + Math.random() * 0.1;
        }
        
        data.push({
            student: student,
            signal: signalValue,
            grade: grade
        });
    }
    
    // Scales for the grades
    const xScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.signal) * 0.9, d3.max(data, d => d.signal) * 1.1])
        .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
        .domain([80, 190])
        .range([innerHeight, 0]);
    
    // Draw points
    svg.selectAll('.point')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'point')
        .attr('cx', d => xScale(d.signal))
        .attr('cy', d => yScale(d.grade))
        .attr('r', 8)
        .attr('fill', '#9d4edd')
        .attr('opacity', 0.7);
    
    // Add trend line
    const line = d3.line()
        .x(d => xScale(d.signal))
        .y(d => yScale(d.grade));
    
    const trendData = data.map(d => ({signal: d.signal, grade: d.grade}))
        .sort((a, b) => a.signal - b.signal);
    
    svg.append('path')
        .datum(trendData)
        .attr('fill', 'none')
        .attr('stroke', '#4cc9f0')
        .attr('stroke-width', 2)
        .attr('d', line);
    
    // Add axes
    const xAxis = d3.axisBottom(xScale).ticks(5);
    const yAxis = d3.axisLeft(yScale).ticks(5);
    
    svg.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis);
    
    svg.append('g')
        .call(yAxis);
    
    // Add axis labels
    svg.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + margin.bottom - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6c757d')
        .text(`Average ${signal} during ${period.replace('-', ' ')}`);
    
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -margin.left + 15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6c757d')
        .text('Final Exam Grade');
    
    // Add title
    svg.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#343a40')
        .attr('font-weight', '600')
        .text(`Performance vs. ${signal} during ${period.replace('-', ' ')}`);
}