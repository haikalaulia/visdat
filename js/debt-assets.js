// Tetap gunakan semua konfigurasi awal seperti sebelumnya
const svgWidth = 700;
const svgHeight = 400;
const chartMargin = { top: 40, right: 40, bottom: 60, left: 10 };
const chartWidth = svgWidth - chartMargin.left - chartMargin.right;
const chartHeight = svgHeight - chartMargin.top - chartMargin.bottom;

const chartSvg = d3.select("#debt-assets")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

const chart = chartSvg.append("g")
  .attr("transform", `translate(${chartMargin.left},${chartMargin.top})`);

let allData = []; // Simpan semua data global

// Load data CSV
d3.csv("b_depressed.csv", d3.autoType).then(data => {
  data.forEach(d => {
    d.debt = d.living_expenses + d.other_expenses;
    d.assets = d.gained_asset + d.durable_asset + d.save_asset;
  });

  allData = data; // simpan data global

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.assets)).nice()
    .range([0, chartWidth]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.debt)).nice()
    .range([chartHeight, 0]);

  const color = d => d.depressed === 1 ? "red" : "green";

  // Sumbu
  chart.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x));

  chart.append("text")
    .attr("x", chartWidth / 2)
    .attr("y", chartHeight + chartMargin.bottom - 10)
    .attr("text-anchor", "middle")
    .attr("fill", "#000")
    .text("Total Aset");

  chart.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y));

  chart.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -chartHeight / 2)
    .attr("y", -chartMargin.left + -70)
    .attr("text-anchor", "middle")
    .attr("fill", "#000")
    .text("Total Pengeluaran");

  // Fungsi render ulang berdasarkan filter
  function updateChart(filter) {
    let filteredData = allData;

    if (filter === "depressed") {
      filteredData = allData.filter(d => d.depressed === 1);
    } else if (filter === "not-depressed") {
      filteredData = allData.filter(d => d.depressed === 0);
    }

    // Update titik-titik
    const circles = chart.selectAll("circle")
      .data(filteredData, d => d.id || d); // gunakaan id jika ada

    circles.enter()
      .append("circle")
      .merge(circles)
      .transition()
      .duration(500)
      .attr("cx", d => x(d.assets))
      .attr("cy", d => y(d.debt))
      .attr("r", 4)
      .attr("fill", d => color(d))
      .attr("opacity", 0.7);

    circles.exit().remove();

    // Hitung ulang legenda
    const counts = filteredData.reduce((acc, d) => {
      acc[d.depressed] = (acc[d.depressed] || 0) + 1;
      return acc;
    }, {});

    chartSvg.selectAll(".legend").remove();

    const legend = chartSvg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${svgWidth - 150}, ${chartMargin.top})`);

    legend.append("circle")
      .attr("cx", 0).attr("cy", 0).attr("r", 5).attr("fill", "green");
    legend.append("text")
      .attr("x", 10).attr("y", 5)
      .text(`Tidak Depresi (${counts[0] || 0})`)
      .style("font-size", "12px");

    legend.append("circle")
      .attr("cx", 0).attr("cy", 20).attr("r", 5).attr("fill", "red");
    legend.append("text")
      .attr("x", 10).attr("y", 25)
      .text(`Depresi (${counts[1] || 0})`)
      .style("font-size", "12px");
  }

  // Inisialisasi awal
  updateChart("all");

  // Event listener tombol filter
  d3.selectAll("#filter-buttons button").on("click", function () {
    const filter = d3.select(this).attr("data-filter");
    updateChart(filter);
  });

}).catch(error => {
  console.error("Error loading the CSV file: ", error);
});
