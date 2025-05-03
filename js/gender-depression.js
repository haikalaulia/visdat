// gender-depression.js

const svg = d3.select("#gender-depression");
const width = +svg.attr("width");
const height = +svg.attr("height");
const margin = { top: 40, right: 30, bottom: 50, left: 60 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

// Load data dari file CSV (b_depressed.csv)
d3.csv("b_depressed.csv", d => ({
  sex: +d.sex,             // 1 = laki-laki, 0 = perempuan
  depressed: +d.depressed  // 1 = depresi, 0 = tidak depresi
})).then(data => {
  // Kelompokkan data berdasarkan gender dan status depresi
  const counts = d3.rollup(
    data,
    v => ({
      depressed: v.filter(d => d.depressed === 1).length,   // Jumlah yang depresi
      notDepressed: v.filter(d => d.depressed === 0).length  // Jumlah yang tidak depresi
    }),
    d => d.sex === 1 ? "Laki-laki" : "Perempuan"
  );

  // Convert to array of objects for charting
  const chartData = Array.from(counts, ([gender, value]) => ({
    gender,
    depressed: value.depressed,
    notDepressed: value.notDepressed
  }));

  // Skala X (gender)
  const x = d3.scaleBand()
    .domain(chartData.map(d => d.gender))
    .range([0, innerWidth])
    .padding(0.4);

  // Skala Y (jumlah orang)
  const y = d3.scaleLinear()
    .domain([0, d3.max(chartData, d => d.depressed + d.notDepressed)])
    .nice()
    .range([innerHeight, 0]);

  // Sumbu X
  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x));

  // Sumbu Y
  g.append("g")
    .call(d3.axisLeft(y));

  // Bar Chart untuk gender dan status depresi
  g.selectAll("rect.depressed")
    .data(chartData)
    .enter()
    .append("rect")
      .attr("x", d => x(d.gender))
      .attr("y", d => y(d.depressed + d.notDepressed)) // posisi Y dimulai dari bawah
      .attr("width", x.bandwidth())
      .attr("height", d => innerHeight - y(d.depressed)) // tinggi bagian depresi
      .attr("fill", "#ff6f61"); // Warna bagian depresi

  g.selectAll("rect.not-depressed")
    .data(chartData)
    .enter()
    .append("rect")
      .attr("class", "not-depressed")
      .attr("x", d => x(d.gender))
      .attr("y", d => y(d.notDepressed)) // posisi Y untuk bagian tidak depresi
      .attr("width", x.bandwidth())
      .attr("height", d => innerHeight - y(d.notDepressed)) // tinggi bagian tidak depresi
      .attr("fill", "#69b3a2"); // Warna bagian tidak depresi

  // Menambahkan label angka untuk setiap bar
  g.selectAll("text.depressed-label")
    .data(chartData)
    .enter()
    .append("text")
      .attr("class", "depressed-label")
      .attr("x", d => x(d.gender) + x.bandwidth() / 2)
      .attr("y", d => y(d.depressed) - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .text(d => d.depressed);

  g.selectAll("text.not-depressed-label")
    .data(chartData)
    .enter()
    .append("text")
      .attr("class", "not-depressed-label")
      .attr("x", d => x(d.gender) + x.bandwidth() / 2)
      .attr("y", d => y(d.notDepressed) + 10)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .text(d => d.notDepressed);
});
