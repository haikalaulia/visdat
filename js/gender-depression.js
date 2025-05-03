// gender-depression.js

const svg = d3.select("#gender-depression");
const width = +svg.attr("width");
const height = +svg.attr("height");
const margin = { top: 40, right: 30, bottom: 70, left: 60 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const g = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Load data dari file CSV (b_depressed.csv)
d3.csv("b_depressed.csv", d => ({
  sex: +d.sex,             // 1 = Laki-laki, 0 = Perempuan
  depressed: +d.depressed  // 1 = Depresi, 0 = Tidak Depresi
})).then(data => {

  // Hitung jumlah untuk setiap combo gender & status
  const roll = d3.rollup(
    data,
    v => v.length,
    d => d.sex === 1 ? "Laki-laki" : "Perempuan",
    d => d.depressed === 1 ? "Depresi" : "Tidak Depresi"
  );

  // Bentuk array chartData = [{gender, Depresi, Tidak Depresi}, ...]
  const chartData = Array.from(roll, ([gender, statusMap]) => ({
    gender,
    Depresi: statusMap.get("Depresi") || 0,
    "Tidak Depresi": statusMap.get("Tidak Depresi") || 0
  }));

  const statuses = ["Tidak Depresi", "Depresi"];

  // Skala X utama (gender)
  const x0 = d3.scaleBand()
    .domain(chartData.map(d => d.gender))
    .range([0, innerWidth])
    .padding(0.2);

  // Skala X kedua (status di dalam tiap gender)
  const x1 = d3.scaleBand()
    .domain(statuses)
    .range([0, x0.bandwidth()])
    .padding(0.1);

  // Skala Y (jumlah)
  const y = d3.scaleLinear()
    .domain([0, d3.max(chartData, d => d3.max(statuses, key => d[key]))])
    .nice()
    .range([innerHeight, 0]);

  // Sumbu X
  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x0));

  // Keterangan untuk sumbu X
  g.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 40)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .text("Jenis Kelamin");

  // Sumbu Y
  g.append("g")
    .call(d3.axisLeft(y));

  // Keterangan untuk sumbu Y
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("x", -innerHeight / 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .text("Jumlah Responden");

  // Group untuk tiap gender
  const genderGroups = g.selectAll("g.gender-group")
    .data(chartData)
    .enter().append("g")
      .attr("class", "gender-group")
      .attr("transform", d => `translate(${x0(d.gender)},0)`);

  // Bars untuk masing-masing status
  genderGroups.selectAll("rect")
    .data(d => statuses.map(key => ({ key, value: d[key] })))
    .enter().append("rect")
      .attr("x", d => x1(d.key))
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => innerHeight - y(d.value))
      .attr("fill", d => d.key === "Depresi" ? "#ff6f61" : "#69b3a2")
    .on("mouseover", (event, d) => tooltip
      .style("visibility", "visible")
      .text(`${d.key}: ${d.value}`)
      .style("left", (event.pageX + 5) + "px")
      .style("top", (event.pageY - 30) + "px"))
    .on("mouseout", () => tooltip.style("visibility", "hidden"));

  // Labels di atas bar
  genderGroups.selectAll("text.bar-label")
    .data(d => statuses.map(key => ({ key, value: d[key] })))
    .enter().append("text")
      .attr("class", "bar-label")
      .attr("x", d => x1(d.key) + x1.bandwidth() / 2)
      .attr("y", d => y(d.value) - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(d => d.value);

  // Tooltip container
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "#f1f1f1")
    .style("border", "1px solid #ccc")
    .style("padding", "6px")
    .style("border-radius", "4px");

  // Legenda
  const legend = g.append("g")
    .attr("transform", `translate(${innerWidth - 150}, 0)`);

  statuses.forEach((key, i) => {
    const yOff = i * 25;
    legend.append("rect")
      .attr("x", 0).attr("y", yOff)
      .attr("width", 18).attr("height", 18)
      .attr("fill", key === "Depresi" ? "#ff6f61" : "#69b3a2");
    legend.append("text")
      .attr("x", 24).attr("y", yOff + 14)
      .attr("font-size", "12px")
      .text(key);
  });
});
