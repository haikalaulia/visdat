// script2.js - Histogram usia berdasarkan status depresi (side-by-side, proporsi)

d3.csv("b_depressed.csv").then(function(data) {
    // Parsing dan konversi tipe data
    data.forEach(d => {
      d.age = +d.Age;
      d.depressed = d.depressed === "1" ? "Depresi" : "Tidak Depresi";
    });
  
    // Setup SVG dan margin
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
  
    const svg = d3.select("#chart2")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    // Subset data berdasarkan status depresi
    const depresi = data.filter(d => d.depressed === "Depresi");
    const tidakDepresi = data.filter(d => d.depressed === "Tidak Depresi");
  
    // Skala X
    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.age))
      .range([0, width]);
  
    const histogram = d3.histogram()
      .value(d => d.age)
      .domain(x.domain())
      .thresholds(x.ticks(20)); // 20 bin usia
  
    // Hitung bins dan normalisasi
    const bins1 = histogram(depresi);
    const bins2 = histogram(tidakDepresi);
  
    bins1.forEach(bin => bin.normalized = bin.length / depresi.length);
    bins2.forEach(bin => bin.normalized = bin.length / tidakDepresi.length);
  
    // Skala Y
    const y = d3.scaleLinear()
      .domain([0, d3.max([...bins1, ...bins2], d => d.normalized)])
      .range([height, 0]);
  
    // Sumbu X
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));
  
    // Sumbu Y
    svg.append("g").call(d3.axisLeft(y));
  
    // Gridlines
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat(""))
      .attr("stroke-opacity", 0.1);
  
    // Warna
    const color = {
      "Depresi": "#e74c3c",
      "Tidak Depresi": "#3498db"
    };
  
    // Lebar batang dibagi dua
    const barWidth = (x(bins1[0].x1) - x(bins1[0].x0)) / 2 - 1;
  
    // Bar Depresi
    svg.selectAll(".bar.depresi")
      .data(bins1)
      .enter()
      .append("rect")
      .attr("class", "bar depresi")
      .attr("x", d => x(d.x0))
      .attr("y", d => y(d.normalized))
      .attr("width", barWidth)
      .attr("height", d => height - y(d.normalized))
      .style("fill", color["Depresi"]);
  
    // Bar Tidak Depresi
    svg.selectAll(".bar.tidakdepresi")
      .data(bins2)
      .enter()
      .append("rect")
      .attr("class", "bar tidakdepresi")
      .attr("x", d => x(d.x0) + barWidth + 1)
      .attr("y", d => y(d.normalized))
      .attr("width", barWidth)
      .attr("height", d => height - y(d.normalized))
      .style("fill", color["Tidak Depresi"]);
  
    // Judul
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("Distribusi Usia Berdasarkan Status Depresi");
  
    // Label X
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .text("Usia");
  
    // Label Y
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -45)
      .attr("text-anchor", "middle")
      .text("Proporsi Individu");
  
    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 130}, 10)`);
  
    const categories = ["Depresi", "Tidak Depresi"];
    categories.forEach((cat, i) => {
      const g = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);
  
      g.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", color[cat]);
  
      g.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text(cat);
    });
  });