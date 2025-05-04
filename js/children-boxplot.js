// children-boxplot.js

d3.csv("b_depressed.csv").then(data => {
    // Parsing data
    data.forEach(d => {
      d.Number_children = +d.Number_children;
      d.depressed = d.depressed === "1" ? "Depresi" : "Tidak Depresi";
    });
  
    // Kelompokkan berdasarkan status depresi
    const grouped = d3.group(data, d => d.depressed);
  
    // Hitung nilai box plot (min, Q1, median, Q3, max) untuk tiap grup
    function getBoxStats(values) {
      const sorted = values.sort(d3.ascending);
      const q1 = d3.quantileSorted(sorted, 0.25);
      const median = d3.quantileSorted(sorted, 0.5);
      const q3 = d3.quantileSorted(sorted, 0.75);
      const min = d3.min(sorted);
      const max = d3.max(sorted);
      return { min, q1, median, q3, max };
    }
  
    const stats = Array.from(grouped, ([key, values]) => {
      const jumlahAnak = values.map(d => d.Number_children);
      const stat = getBoxStats(jumlahAnak);
      return {
        status: key,
        ...stat
      };
    });
  
    // Setup margin dan SVG
    const marginBox = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = 700 - marginBox.left - marginBox.right;
    const height = 400 - marginBox.top - marginBox.bottom;
  
    const svg = d3.select("#children-boxplot")
      .attr("width", width + marginBox.left + marginBox.right)
      .attr("height", height + marginBox.top + marginBox.bottom)
      .append("g")
      .attr("transform", `translate(${marginBox.left},${marginBox.top})`);
  
    const x = d3.scaleBand()
      .domain(stats.map(d => d.status))
      .range([0, width])
      .paddingInner(0.5)
      .paddingOuter(0.25);
  
    const y = d3.scaleLinear()
      .domain([0, d3.max(stats, d => d.max)])
      .range([height, 0]);
  
    // Sumbu
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));
  
    svg.append("g")
      .call(d3.axisLeft(y));
  
    // Warna
    const color = {
      "Depresi": "#e74c3c",
      "Tidak Depresi": "#3498db"
    };
  
    // Gambar box plot
    const boxWidth = 50;
  
    svg.selectAll("vertLines")
      .data(stats)
      .enter()
      .append("line")
      .attr("x1", d => x(d.status) + x.bandwidth() / 2)
      .attr("x2", d => x(d.status) + x.bandwidth() / 2)
      .attr("y1", d => y(d.min))
      .attr("y2", d => y(d.max))
      .attr("stroke", "black");
  
    svg.selectAll("boxes")
      .data(stats)
      .enter()
      .append("rect")
      .attr("x", d => x(d.status) + x.bandwidth() / 2 - boxWidth / 2)
      .attr("y", d => y(d.q3))
      .attr("height", d => y(d.q1) - y(d.q3))
      .attr("width", boxWidth)
      .attr("stroke", "black")
      .style("fill", d => color[d.status]);
  
    svg.selectAll("medianLines")
      .data(stats)
      .enter()
      .append("line")
      .attr("x1", d => x(d.status) + x.bandwidth() / 2 - boxWidth / 2)
      .attr("x2", d => x(d.status) + x.bandwidth() / 2 + boxWidth / 2)
      .attr("y1", d => y(d.median))
      .attr("y2", d => y(d.median))
      .attr("stroke", "black")
      .style("width", 80);

          // Judul
    svg.append("text")
    .attr("x", width / 2)
    .attr("y", -15)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Jumlah Anak Berdasarkan Status Depresi");

  // Label sumbu Y
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -marginBox.left + 15)
    .attr("x", -height / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Jumlah Anak");

  // Label sumbu X
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + marginBox.bottom - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Status Depresi");

  // Legenda
  const legend = svg.selectAll(".legend")
    .data(Object.entries(color))
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  legend.append("rect")
    .attr("x", width - 18)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", d => d[1]);

  legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .style("font-size", "12px")
    .text(d => d[0]);

  });