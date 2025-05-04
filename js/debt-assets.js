// js/debt-assets.js

// Ukuran SVG dan margin chart
const svgWidth = 700;
const svgHeight = 400;
const chartMargin = { top: 40, right: 40, bottom: 60, left: 10 };
const chartWidth = svgWidth - chartMargin.left - chartMargin.right;
const chartHeight = svgHeight - chartMargin.top - chartMargin.bottom;

// Seleksi SVG dan atur ukuran
const chartSvg = d3.select("#debt-assets")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

// Buat group utama dan geser sesuai margin
const chart = chartSvg.append("g")
    .attr("transform", `translate(${chartMargin.left},${chartMargin.top})`);

// Load data
d3.csv("b_depressed.csv", d3.autoType).then(data => {
  // Hitung total utang dan aset
  data.forEach(d => {
    d.debt = d.living_expenses + d.other_expenses;
    d.assets = d.gained_asset + d.durable_asset + d.save_asset;
  });

  // Skala X dan Y
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.assets)).nice()
    .range([0, chartWidth]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.debt)).nice()
    .range([chartHeight, 0]);

  // Warna berdasarkan status depresi
  const color = d => d.depressed === 1 ? "red" : "green";

  // Sumbu X
  chart.append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x));

  // Tambahkan label sumbu X
  chart.append("text")
    .attr("x", chartWidth / 2)  // Menempatkan label di tengah sumbu X
    .attr("y", chartHeight + chartMargin.bottom - 10)  // Memberi jarak sedikit di bawah
    .attr("text-anchor", "middle")
    .attr("fill", "#000")
    .text("Total Aset");

  // Sumbu Y
  chart.append("g")
    .call(d3.axisLeft(y));

  // Label sumbu Y
  chart.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -chartHeight / 2)
    .attr("y", -chartMargin.left + -70)
    .attr("text-anchor", "middle")
    .attr("fill", "#000")
    .text("Total Pengeluaran");

  // Titik-titik scatter
  chart.selectAll("circle")
    .data(data)
    .enter().append("circle")
    .attr("cx", d => x(d.assets))
    .attr("cy", d => y(d.debt))
    .attr("r", 4)
    .attr("fill", d => color(d))
    .attr("opacity", 0.7);

  // Hitung jumlah masing-masing kategori
  const counts = data.reduce((acc, d) => {
    acc[d.depressed] = (acc[d.depressed] || 0) + 1;
    return acc;
  }, {});
  // counts[0] = jumlah tidak depresi
  // counts[1] = jumlah depresi

  // Hapus legend lama jika ada
  chartSvg.selectAll(".legend").remove();

  // Tambahkan legenda dengan count
  const legend = chartSvg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${svgWidth - 150}, ${chartMargin.top})`);

  // Legend Tidak Depresi
  legend.append("circle")
    .attr("cx", 0).attr("cy", 0)
    .attr("r", 5)
    .attr("fill", "green");
  legend.append("text")
    .attr("x", 10).attr("y", 5)
    .text(`Tidak Depresi (${counts[0] || 0})`)
    .style("font-size", "12px");

  // Legend Depresi
  legend.append("circle")
    .attr("cx", 0).attr("cy", 20)
    .attr("r", 5)
    .attr("fill", "red");
  legend.append("text")
    .attr("x", 10).attr("y", 25)
    .text(`Depresi (${counts[1] || 0})`)
    .style("font-size", "12px");
  
}).catch(error => {
  console.error("Error loading the CSV file: ", error);
});
