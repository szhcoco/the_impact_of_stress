// Initialize animations when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Create observer to animate elements on scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-on-scroll');
            }
        });
    }, observerOptions);
    
    // Observe all cards and section headers
    document.querySelectorAll('.card, .insight-card, .section-header').forEach(el => {
        observer.observe(el);
    });
    
    // Render initial charts
    renderYerkesChart();
    renderTimelineChart();
    renderScatterChart();
    renderSignalChart();
});

// Render Yerkes-Dodson chart
function renderYerkesChart() {
    const container = d3.select('#yerkes-chart');
    const width = container.node().clientWidth;
    const height = container.node().clientHeight;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Data for the curve (inverted U shape)
    const data = [];
    for (let i = 0; i <= 100; i += 5) {
        const x = i;
        // Quadratic function to create inverted U shape
        const y = 100 - Math.pow((x - 50) / 2.5, 2);
        data.push({x, y});
    }
    
    // Scales
    const xScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([innerHeight, 0]);
    
    // Line generator
    const line = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y))
        .curve(d3.curveNatural);
    
    // Draw the curve
    svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#9d4edd')
        .attr('stroke-width', 3)
        .attr('d', line);
    
    // Add optimal zone
    svg.append('rect')
        .attr('x', xScale(40))
        .attr('y', yScale(80))
        .attr('width', xScale(60) - xScale(40))
        .attr('height', yScale(20) - yScale(80))
        .attr('fill', 'rgba(128, 237, 153, 0.2)')
        .attr('stroke', '#80ed99')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,2');
    
    // Add labels
    svg.append('text')
        .attr('x', xScale(10))
        .attr('y', yScale(20))
        .attr('fill', '#6c757d')
        .attr('font-size', '12px')
        .text('Low Performance');
    
    svg.append('text')
        .attr('x', xScale(10))
        .attr('y', yScale(85))
        .attr('fill', '#6c757d')
        .attr('font-size', '12px')
        .text('High Performance');
    
    svg.append('text')
        .attr('x', xScale(5))
        .attr('y', innerHeight + 20)
        .attr('fill', '#6c757d')
        .attr('font-size', '12px')
        .text('Low Stress');
    
    svg.append('text')
        .attr('x', xScale(85))
        .attr('y', innerHeight + 20)
        .attr('fill', '#6c757d')
        .attr('font-size', '12px')
        .text('High Stress');
    
    svg.append('text')
        .attr('x', xScale(50))
        .attr('y', yScale(90))
        .attr('text-anchor', 'middle')
        .attr('fill', '#80ed99')
        .attr('font-weight', 'bold')
        .attr('font-size', '12px')
        .text('Optimal Zone');
}

// Render timeline chart
function renderTimelineChart() {
    const container = d3.select('#timeline-chart');
    const width = container.node().clientWidth;
    const height = container.node().clientHeight;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Generate sample data
    const data = [];
    for (let i = 0; i <= 90; i++) {
        // Base values with some noise
        let stress = 30 + Math.random() * 10;
        let performance = 70 + Math.random() * 10;
        
        // Add stress events at specific times
        if (i > 15 && i < 20) stress += 30;
        if (i > 40 && i < 45) stress += 40;
        if (i > 70 && i < 75) stress += 35;
        
        // Performance dips after stress events
        if (i > 20 && i < 25) performance -= 20;
        if (i > 45 && i < 50) performance -= 25;
        if (i > 75 && i < 80) performance -= 15;
        
        data.push({ time: i, stress, performance });
    }
    
    // Scales
    const xScale = d3.scaleLinear()
        .domain([0, 90])
        .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([innerHeight, 0]);
    
    // Line generators
    const stressLine = d3.line()
        .x(d => xScale(d.time))
        .y(d => yScale(d.stress))
        .curve(d3.curveMonotoneX);
    
    const perfLine = d3.line()
        .x(d => xScale(d.time))
        .y(d => yScale(d.performance))
        .curve(d3.curveMonotoneX);
    
    // Draw stress line
    svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#4cc9f0')
        .attr('stroke-width', 3)
        .attr('d', stressLine);
    
    // Draw performance line
    svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#80ed99')
        .attr('stroke-width', 3)
        .attr('d', perfLine);
    
    // Add event markers
    const events = [20, 45, 75];
    events.forEach((event, i) => {
        const xPos = xScale(event);
        
        svg.append('circle')
            .attr('cx', xPos)
            .attr('cy', yScale(90))
            .attr('r', 8)
            .attr('fill', '#f07167')
            .attr('stroke', 'white')
            .attr('stroke-width', 2);
        
        svg.append('text')
            .attr('x', xPos)
            .attr('y', yScale(90) - 15)
            .attr('text-anchor', 'middle')
            .attr('fill', '#212529')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .text(`Q${i + 1}`);
    });
    
    // Add axes
    const xAxis = d3.axisBottom(xScale).ticks(6);
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
        .text('Time (minutes)');
    
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -margin.left + 15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6c757d')
        .text('Level (%)');
    
    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${innerWidth - 150}, 20)`);
    
    legend.append('line')
        .attr('x1', 0)
        .attr('x2', 30)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', '#4cc9f0')
        .attr('stroke-width', 2);
    
    legend.append('text')
        .attr('x', 40)
        .attr('y', 4)
        .attr('font-size', '12px')
        .text('Stress Level');
    
    legend.append('line')
        .attr('x1', 0)
        .attr('x2', 30)
        .attr('y1', 20)
        .attr('y2', 20)
        .attr('stroke', '#80ed99')
        .attr('stroke-width', 2);
    
    legend.append('text')
        .attr('x', 40)
        .attr('y', 24)
        .attr('font-size', '12px')
        .text('Performance');
    
    legend.append('circle')
        .attr('cx', 15)
        .attr('cy', 40)
        .attr('r', 6)
        .attr('fill', '#f07167');
    
    legend.append('text')
        .attr('x', 40)
        .attr('y', 44)
        .attr('font-size', '12px')
        .text('Question Event');
}

// Render scatter plot
function renderScatterChart() {
    const container = d3.select('#scatter-chart');
    const width = container.node().clientWidth;
    const height = container.node().clientHeight;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Sample data
    const data = [
        { stress: 0.4, grade: 65, student: 'S4' },
        { stress: 0.5, grade: 72, student: 'S4' },
        { stress: 0.55, grade: 82, student: 'S2' },
        { stress: 0.58, grade: 84, student: 'S1' },
        { stress: 0.6, grade: 88, student: 'S3' },
        { stress: 0.62, grade: 86, student: 'S2' },
        { stress: 0.65, grade: 78, student: 'S1' },
        { stress: 0.68, grade: 88, student: 'S2' },
        { stress: 0.7, grade: 75, student: 'S3' },
        { stress: 0.72, grade: 82, student: 'S1' },
        { stress: 0.75, grade: 70, student: 'S3' },
        { stress: 0.78, grade: 68, student: 'S3' },
    ];
    
    // Scales
    const xScale = d3.scaleLinear()
        .domain([0.3, 0.8])
        .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
        .domain([60, 95])
        .range([innerHeight, 0]);
    
    // Draw optimal zone
    svg.append('rect')
        .attr('x', xScale(0.55))
        .attr('y', yScale(80))
        .attr('width', xScale(0.65) - xScale(0.55))
        .attr('height', yScale(75) - yScale(85))
        .attr('fill', 'rgba(128, 237, 153, 0.2)')
        .attr('stroke', '#80ed99')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,2');
    
    // Draw points
    const points = svg.selectAll('.point')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'point')
        .attr('cx', d => xScale(d.stress))
        .attr('cy', d => yScale(d.grade))
        .attr('r', 6)
        .attr('fill', d => d.student === 'S1' ? '#9d4edd' : '#4cc9f0')
        .attr('opacity', 0.8)
        .attr('stroke', 'white')
        .attr('stroke-width', 1);
    
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
        .text('Stress Index');
    
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -margin.left + 15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6c757d')
        .text('Grade (%)');
}

// Render signal chart
function renderSignalChart() {
    const container = d3.select('#signal-chart');
    const width = container.node().clientWidth;
    const height = container.node().clientHeight;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Generate sample data
    const data = [];
    for (let i = 0; i <= 90; i++) {
        // Base EDA value with noise
        let eda = 2.0 + Math.random() * 0.8;
        
        // Add spikes at event times
        if (i > 15 && i < 20) eda += 1.5;
        if (i > 40 && i < 45) eda += 2.0;
        if (i > 70 && i < 75) eda += 1.8;
        
        data.push({ time: i, eda });
    }
    
    // Scales
    const xScale = d3.scaleLinear()
        .domain([0, 90])
        .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
        .domain([1.5, 5.0])
        .range([innerHeight, 0]);
    
    // Line generator
    const line = d3.line()
        .x(d => xScale(d.time))
        .y(d => yScale(d.eda))
        .curve(d3.curveMonotoneX);
    
    // Draw line
    svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#f07167')
        .attr('stroke-width', 2)
        .attr('d', line);
    
    // Add axes
    const xAxis = d3.axisBottom(xScale).ticks(6);
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
        .text('Time (minutes)');
    
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -margin.left + 15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6c757d')
        .text('EDA (μS)');
    
    // Add event markers
    const events = [20, 45, 75];
    events.forEach((event, i) => {
        const xPos = xScale(event);
        
        svg.append('line')
            .attr('x1', xPos)
            .attr('x2', xPos)
            .attr('y1', yScale(1.5))
            .attr('y2', yScale(5.0))
            .attr('stroke', '#6c757d')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '4,2')
            .attr('opacity', 0.5);
        
        svg.append('text')
            .attr('x', xPos)
            .attr('y', yScale(5.0) + 15)
            .attr('text-anchor', 'middle')
            .attr('fill', '#212529')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .text(`Q${i + 1}`);
    });
}