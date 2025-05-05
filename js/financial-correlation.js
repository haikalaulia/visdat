d3.csv("b_depressed.csv").then(data => {
  // Konversi tipe data
  data.forEach(d => {
    d.incoming_agricultural = +d.incoming_agricultural;
    d.farm_expenses = +d.farm_expenses;
    d.depressed = +d.depressed;
  });

  // ====== SCATTER PLOT ======
  const svgScatter = d3.select("#scatter-plot"),
        width = +svgScatter.attr("width"),
        height = +svgScatter.attr("height"),
        margin = { top: 20, right: 100, bottom: 50, left: 60 },
        plotWidth = width - margin.left - margin.right,
        plotHeight = height - margin.top - margin.bottom;

  const gScatter = svgScatter.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.incoming_agricultural)).nice()
    .range([0, plotWidth]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.farm_expenses)).nice()
    .range([plotHeight, 0]);

  // Warna berdasarkan status depresi
  const color = d3.scaleOrdinal()
    .domain([0, 1])
    .range(["#1f77b4", "#d62728"]); // biru dan merah

  gScatter.append("g")
    .attr("transform", `translate(0,${plotHeight})`)
    .call(d3.axisBottom(x));
    
  gScatter.append("g")
    .call(d3.axisLeft(y));

  // Titik scatter
  gScatter.selectAll("circle")
    .data(data)
    .enter().append("circle")
    .attr("cx", d => x(d.incoming_agricultural))
    .attr("cy", d => y(d.farm_expenses))
    .attr("r", 4)
    .attr("fill", d => color(d.depressed))
    .attr("opacity", 0.7);

  // Label sumbu
  svgScatter.append("text")
    .attr("x", width / 2)
    .attr("y", height - 5)
    .attr("text-anchor", "middle")
    .text("Pendapatan Pertanian");

  svgScatter.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -70)
    .attr("text-anchor", "middle")
    .text("Pengeluaran Pertanian");

  // Legend
  const legendData = [
    { label: "Tidak Depresi", color: "#1f77b4" },
    { label: "Depresi", color: "#d62728" },
  ];

  const legend = svgScatter.append("g")
    .attr("transform", `translate(${width - margin.right + 10}, 30)`);

  legend.selectAll("rect")
    .data(legendData)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 25)
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", d => d.color);

  legend.selectAll("text")
    .data(legendData)
    .enter()
    .append("text")
    .attr("x", 24)
    .attr("y", (d, i) => i * 25 + 13)
    .text(d => d.label)
    .attr("font-size", "14px")
    .attr("fill", "#333");


  // ====== HEATMAP KORELASI ======
  const svgHeat = d3.select("#heatmap"),
        heatMargin = { top: 30, right: 20, bottom: 30, left: 80 },
        heatWidth = +svgHeat.attr("width") - heatMargin.left - heatMargin.right,
        heatHeight = +svgHeat.attr("height") - heatMargin.top - heatMargin.bottom;

  const gHeat = svgHeat.append("g")
    .attr("transform", `translate(${heatMargin.left},${heatMargin.top})`);

  // Hitung korelasi antar variabel
  const variables = ["incoming_agricultural", "farm_expenses", "depressed"];

  function correlation(x, y) {
    const n = x.length;
    const avgX = d3.mean(x), avgY = d3.mean(y);
    const cov = d3.sum(x.map((d, i) => (d - avgX) * (y[i] - avgY))) / n;
    const stdX = d3.deviation(x), stdY = d3.deviation(y);
    return cov / (stdX * stdY);
  }

  const matrix = [];
  variables.forEach((v1, i) => {
    variables.forEach((v2, j) => {
      const val = correlation(data.map(d => +d[v1]), data.map(d => +d[v2]));
      matrix.push({ x: v1, y: v2, value: val });
    });
  });

  const xHeat = d3.scaleBand().range([0, heatWidth]).domain(variables).padding(0.05);
  const yHeat = d3.scaleBand().range([0, heatHeight]).domain(variables).padding(0.05);

  const colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateRdBu)
    .domain([-1, 1]);

  gHeat.selectAll()
    .data(matrix)
    .enter()
    .append("rect")
    .attr("x", d => xHeat(d.x))
    .attr("y", d => yHeat(d.y))
    .attr("width", xHeat.bandwidth())
    .attr("height", yHeat.bandwidth())
    .style("fill", d => colorScale(d.value));

  gHeat.selectAll()
    .data(matrix)
    .enter()
    .append("text")
    .attr("x", d => xHeat(d.x) + xHeat.bandwidth() / 2)
    .attr("y", d => yHeat(d.y) + yHeat.bandwidth() / 2)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .attr("fill", "#000")
    .text(d => d.value.toFixed(2));

  gHeat.append("g").call(d3.axisTop(xHeat));
  gHeat.append("g").call(d3.axisLeft(yHeat));

  // Judul Heatmap
  svgHeat.append("text")
    .attr("x", svgHeat.attr("width") / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("fill", "#333")
    .text("Matriks Korelasi (Pendapatan, Pengeluaran, Depresi)");
});
