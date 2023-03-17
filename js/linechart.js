function movingAverage(a, window) {
  window = Math.round(window);
  if (window % 2 == 0) {
    window += 1;
  }
  if (a.length < window || window < 2) return null;
  let halfWindow = Math.floor((window-1)/2);
  const out = [];
  for (let i = 0; i < a.length; i++) {
    if (i === 0 || i === a.length - 1) {
      // Pin the ends at actual values. Stories move quickly at the ends.
      out.push(a[i]);
      continue;
    }
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(a.length, i + halfWindow);
    const sample = a.slice(start, end);
    const avg = sample.reduce((total, cur) => total + cur, 0.0) / sample.length;
    out.push(avg);
  }
  return out;
}

const dataColor = "gray"

window.LineChart = function(data, {
  x = ([x]) => x, // given d in data, returns the (temporal) x-value
  y = ([, y]) => y, // given d in data, returns the (quantitative) y-value
  title, // given d in data, returns the title text
  defined, // for gaps in data
  curve = d3.curveLinear, // method of interpolation between points
  marginTop = 70, // top margin, in pixels
  marginRight = 30, // right margin, in pixels
  marginBottom = 30, // bottom margin, in pixels
  marginLeft = 40, // left margin, in pixels
  width = 640, // outer width, in pixels
  height = 400, // outer height, in pixels
  xType = d3.scaleLinear, // type of x-scale
  xDomain, // [xmin, xmax]
  xRange = [marginLeft, width - marginRight], // [left, right]
  yType = d3.scaleLinear, // type of y-scale
  yDomain, // [ymin, ymax]
  yRange = [height - marginBottom, marginTop], // [bottom, top]
  color = "#fff", // stroke color of line
  strokeWidth = 1.5, // stroke width of line, in pixels
  strokeLinejoin = "round", // stroke line join of line
  strokeLinecap = "round", // stroke line cap of line
  yFormat, // a format specifier string for the y-axis
  yLabel, // a label for the y-axis
} = {}) {
  // Compute values.
  const X = d3.map(data, x);
  const Y = d3.map(data, y);
  const O = d3.map(data, d => d);

  // Compute which data points are considered defined.
  if (defined === undefined) defined = (d, i) => !isNaN(X[i]) && !isNaN(Y[i]);
  const D = d3.map(data, defined);

  // Compute default domains.
  if (xDomain === undefined) xDomain = d3.extent(X);
  if (yDomain === undefined) yDomain = [0, d3.max(Y)];

  // Construct scales and axes.
  const xScale = xType(xDomain, xRange);
  const yScale = yType(yDomain, yRange);
  const xAxis = d3.axisBottom(xScale).tickValues([]).tickSize(0);
  const yAxis = d3.axisLeft(yScale).ticks(height / 40, yFormat);

  const line = d3.line()
      .x((d, idx) => xScale(idx))
      .y((d, idx) => yScale(y(d)))

  let avgLines = [2, 4, 8, 16].map(window => {
    const ma = movingAverage(data.map(y), data.length / window);
    return ma;
  }).filter(a => a);
  avgLines = [avgLines[avgLines.length-1]];

  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .style("-webkit-tap-highlight-color", "transparent")
      .style("overflow", "visible")
      .on("pointerenter pointermove", pointermoved)
      .on("pointerleave", pointerleft)
      .on("touchstart", event => event.preventDefault());

  svg.append("g")
      .attr("transform", `translate(0,${yScale(0)})`)
      .call(xAxis);

  svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(yAxis)
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
          .attr("x2", width - marginLeft - marginRight)
          .attr("stroke-opacity", 0.1))
      .call(g => g.append("text")
          .attr("x", -marginLeft)
          .attr("y", 10)
          .attr("fill", "#fff")
          .attr("text-anchor", "start")
          .text(yLabel));

  svg.append("path")
      .attr("fill", "none")
      .attr("stroke", dataColor)
      .attr("stroke-width", strokeWidth)
      .attr("stroke-linejoin", strokeLinejoin)
      .attr("stroke-linecap", strokeLinecap)
      .attr("d", line(data));

  const avgColor = d3.hsl("#fff");
  avgLines.forEach(avgData => {
    if (!avgData) return;
    avgColor.l += .075;
    const avgLine = d3.line()
        .curve(d3.curveNatural)
        .x((d, idx) => xScale(idx))
        .y((d, idx) => yScale(d))
    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", avgColor)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-linejoin", strokeLinejoin)
        .attr("stroke-linecap", strokeLinecap)
        .attr("d", avgLine(avgData));
  });

  const tooltip = svg.append("g")
      .attr("transform", `translate(10, 10)`)
      .attr("fill", "#fff")
      .attr("width", 200)

  function pointermoved(event) {
    const i = d3.bisectCenter(X, xScale.invert(d3.pointer(event)[0]));
    const item = data[i];
    svg.selectAll("circle").remove()
    const cirlce = svg.append("circle")
      .attr("cx", xScale(i))
      .attr("cy", yScale(y(item)))
      .attr("r", 5)
      .attr("fill", dataColor)
      .attr("stroke", dataColor)

    tooltip.selectAll("text").remove();
    const lineLength = 70;
    let lineIdx = 0;
    const words = item.reason.split(" ");
    while (words.length) {
      let subText = ""
      while (words.length && subText.length < lineLength) {
        subText += words.shift() + " ";
      }
      const text = tooltip.append("text")
        .text(subText)
        .attr("x", 0).attr("y", lineIdx * 20)
        .attr("font-size", 15)
      lineIdx++;
    }
  }

  function pointerleft() {
    //tooltip.style("display", "none");
    //svg.node().value = null;
    //svg.dispatch("input", {bubbles: true});
  }

  return Object.assign(svg.node(), {value: null});
}
