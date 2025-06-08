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
    d3.select('body').selectAll('*').remove();
}

//add head back when back to the first slide
function addHead() {
    d3.select('body').append('h1').text('Score and Stress');
    d3.select('body').append('h2').text('How is stress related to score? How does stress change during the test?');
}
//add div and tooltip back for scatter and line plots
function addDiv() {
    d3.select('body').append('div').attr('id', 'layout');
    d3.select('#layout').append('div').attr('id', 'chart');
    d3.select('#layout').append('div').attr('id', 'container');
    d3.select('#container').append('div').attr('id', 'tooltip').attr('style', 'opacity: 0;');
    d3.select('#container').append('div').attr('id', 'main');
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
        d3.select('body').append('p').text('Stress plays a significant role in our academic performance—but to what extent does it actually affect exam outcomes? Some theories suggest that moderate stress can motivate students to focus and perform better, while others argue that excessive stress can impair concentration and lead to lower scores.');
        d3.select('body').append('p').text('In this project, we examine the relationship between stress and exam performance by analyzing physiological signals from four dimensions: Heart Rate (HR), Electrodermal Activity (EDA), Temperature, and Accelerometer (ACC) data. By correlating these metrics with students’ test scores, we aim to find out how stress varies between individuals and how it might influence academic results.');
        break;
    case 1:
        removeAll();
        addDiv();
        d3.select('#chart').append('p').text('explanation for HR');
        d3.select('#chart').append('div').attr('id', 'chart2');
        HR_scatt.renderScatterPlot();
        break;
    case 2:
        removeAll();
        addDiv();
        d3.select('#chart').append('p').text('explanation for EDA');
        d3.select('#chart').append('div').attr('id', 'chart1');
        EDA_scatt.renderScatterPlot();
        break;
    case 3:
        removeAll();
        addDiv();
        d3.select('#chart').append('p').text('explanation for TEMP');
        d3.select('#chart').append('div').attr('id', 'chart3');
        TEMP_scatt.renderScatterPlot();
        break;
    case 4:
        removeAll();
        addDiv();
        d3.select('#chart').append('p').text('explanation for ACC');
        d3.select('#chart').append('div').attr('id', 'chart4');
        ACC_scatt.renderScatterPlot();
        break;
    case 5:
        removeAll();
        d3.select('body').append('p').text('conclusion');
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

window.addEventListener("wheel", onScroll);