import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import * as HR_scatt from './HR_scatt.js';
import * as EDA_scatt from './EDA_scatt.js';
import * as TEMP_scatt from './TEMP_scatt.js';
import * as ACC_scatt from './ACC_scatt.js';

// index of slide is [0, totalSlides-1]
let currentSlide = 0;
const totalSlides = 6;
let isScrolling = false;

//remove all things inside body
function removeAll() {
    d3.select('#slides').selectAll('*').remove();
}

//add head back when back to the first slide
function addHead() {
    d3.select('#slides').append('section').attr('class', 'slide').attr('data-index', '0');
    d3.select('.slide').append('h1').text('Score and Stress');
    d3.select('.slide').append('h2').text('How is stress related to score? How does stress change during the test?');
}
//add div and tooltip back for scatter and line plots
function addDiv(feature) {
    d3.select('.slide').append('div').attr('class', 'slide-header').text(feature);
    d3.select('.slide').append('div').attr('class', 'chart-container').attr('id', 'charts');
    d3.select('#charts').append('div').attr('id', 'chart').attr('class', 'container');
    d3.select('#charts').append('div').attr('id', 'container').attr('class', 'container');
    d3.select('#container').append('div').attr('class', 'tooltip').attr('style', 'opacity: 0;');
    d3.select('#container').append('div').attr('id', 'main').attr('class', 'container');
    d3.select('#main').append('h4').attr('id', 'student-name');
    d3.select('#main').append('svg').attr('id', 'test').attr('height', '200px');
}

//show the slide
function showSlide(slideIndex) {
  // You update your chart here based on slideIndex
  console.log("Displaying slide", slideIndex);

  d3.select("#chart").selectAll("*").remove(); // Clear current chart

  // Example switch for different plots
  switch (slideIndex) {
    case 0:
        removeAll();
        addHead();
        d3.select('.slide').append('p').text('Stress plays a significant role in our academic performance—but to what extent does it actually affect exam outcomes? Some theories suggest that moderate stress can motivate students to focus and perform better, while others argue that excessive stress can impair concentration and lead to lower scores.');
        d3.select('.slide').append('p').text('In this project, we examine the relationship between stress and exam performance by analyzing physiological signals from four dimensions: Heart Rate (HR), Electrodermal Activity (EDA), Temperature, and Accelerometer (ACC) data. By correlating these metrics with students’ test scores, we aim to find out how stress varies between individuals and how it might influence academic results.');
        break;
    case 1:
        removeAll();
        d3.select('#slides').append('section').attr('class', 'slide').attr('data-index', '1');
        addDiv('Heart Rate (HR)');
        d3.select('.slide-header').append('p').text('explanation for HR');
        d3.select('#chart').append('div').attr('id', 'HR-chart');
        HR_scatt.renderScatterPlot();
        break;
    case 2:
      removeAll();
      d3.select('#slides').append('section').attr('class', 'slide').attr('data-index', '2');
      addDiv('EDA');
      d3.select('.slide-header').append('p').text('explanation for EDA');
      d3.select('#chart').append('div').attr('id', 'EDA-chart');
      EDA_scatt.renderScatterPlot();
      break;
    case 3:
      removeAll();
      d3.select('#slides').append('section').attr('class', 'slide').attr('data-index', '3');
      addDiv('TEMP');
      d3.select('.slide-header').append('p').text('explanation for TEMP');
      d3.select('#chart').append('div').attr('id', 'TEMP-chart');
      TEMP_scatt.renderScatterPlot();
      break;
    case 4:
      removeAll();
      d3.select('#slides').append('section').attr('class', 'slide').attr('data-index', '4');
      addDiv('ACC');
      d3.select('.slide-header').append('p').text('explanation for ACC');
      d3.select('#chart').append('div').attr('id', 'ACC-chart');
      ACC_scatt.renderScatterPlot();
      break;
    case 5:
      removeAll();
      d3.select('#slides').append('section').attr('class', 'slide').attr('data-index', '5');
      d3.select('.slide').append('p').text('Conclusion');
      break;
  }
}

// set change of slide number
function onScroll(event) {
  if (isScrolling) return;
  isScrolling = true;

  if (event.deltaY > 0 && currentSlide < totalSlides - 1) {
    currentSlide++;
  } else if (event.deltaY < 0 && currentSlide > 0) {
    currentSlide--;
  }

  showSlide(currentSlide);

  // prevent triggering multiple times rapidly by 500ms debounce
  setTimeout(() => {
    isScrolling = false;
  }, 1500);
}

document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.hook-section');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const content = entry.target.querySelector('.metrics-list')
                    || entry.target.querySelector('.bullet-list')
                    || entry.target.querySelector('.quote-card');
      if (content) content.classList.toggle('hook-visible', entry.isIntersecting);
    });
  }, { threshold: 0.3 });

  sections.forEach(sec => observer.observe(sec));

  document.querySelectorAll('.scroll-indicator').forEach(indicator => {
    indicator.addEventListener('click', () => {
      const targetSelector = indicator.getAttribute('data-target');
      const targetElem = document.querySelector(targetSelector);
      targetElem.scrollIntoView({ behavior: 'smooth' });
      if (targetSelector === '#slides') {
        // clear any previous slide state
        document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
        // show the Heart-Rate slide (data-index="1")
        document.querySelector('.slide[data-index="1"]').classList.add('active');
      }
    });
  });

  HR_scatt.renderScatterPlot();
  EDA_scatt.renderScatterPlot();
  TEMP_scatt.renderScatterPlot();
  ACC_scatt.renderScatterPlot();
});