// js/socio-edu-marriage.js

// Pilih elemen tooltip yang sudah ada di HTML
const tooltip = d3.select("#tooltip");

d3.csv("b_depressed.csv").then(data => {
  // Konversi tipe data ke numeric
  data.forEach(d => {
    d.Married = +d.Married;
    d.education_level = +d.education_level;
    d.depressed = +d.depressed;
  });

  // Grouping data: per education_level dan Married
  const grouped = d3.rollup(
    data,
    v => ({
      Depresi: v.filter(d => d.depressed === 1).length,
      TidakDepresi: v.filter(d => d.depressed === 0).length
    }),
    d => d.education_level,
    d => d.Married
  );

  // Format ulang ke array untuk grouped bar
  const formatted = [];
  for (const [edu, marriedMap] of grouped.entries()) {
    for (const [married, counts] of marriedMap.entries()) {
      const labelGroup = `P${edu} - ${married === 1 ? "M" : "B"}`; 
      // singkatan: P{level} - M(enikah)/B(elum)
      formatted.push(
        { group: labelGroup, kategori: "Depresi",      value: counts.Depresi },
        { group: labelGroup, kategori: "Tidak Depresi", value: counts.TidakDepresi }
      );
    }
  }

  // Ukuran & margin
  const svg    = d3.select("#socio-edu-marriage"),
        width  = +svg.attr("width"),
        height = +svg.attr("height"),
        margin = { top: 40, right: 30, bottom: 80, left: 60 };

  // Skala X (dua level: x0 untuk group, x1 untuk kategori)
  const x0 = d3.scaleBand()
    .domain([...new Set(formatted.map(d => d.group))])
    .range([margin.left, width - margin.right])
    .paddingInner(0.2);

  const x1 = d3.scaleBand()
    .domain(["Depresi", "Tidak Depresi"])
    .range([0, x0.bandwidth()])
    .padding(0.05);

  // Skala Y
  const y = d3.scaleLinear()
    .domain([0, d3.max(formatted, d => d.value)]).nice()
    .range([height - margin.bottom, margin.top]);

  // Warna
  const color = d3.scaleOrdinal()
    .domain(["Depresi", "Tidak Depresi"])
    .range(["#e74c3c", "#2ecc71"]);

  // Gambar batang
  svg.append("g")
    .selectAll("g")
    .data(d3.group(formatted, d => d.group))
    .join("g")
      .attr("transform", d => `translate(${x0(d[0])},0)`)
    .selectAll("rect")
    .data(d => d[1])
    .join("rect")
      .attr("x", d => x1(d.kategori))
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => y(0) - y(d.value))
      .attr("fill", d => color(d.kategori));

  // Sumbu X dengan hover pada label
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x0))
    .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        // d adalah isi tick (misal "P10 - M")
        tooltip
          .style("opacity", 1)
          .html(`<strong>${d}</strong>`)
          .style("left",  (event.pageX + 10) + "px")
          .style("top",   (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        tooltip.style("opacity", 0);
      });

  // Sumbu Y
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Legend utama: Depresi & Tidak Depresi
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right - 150},${margin.top})`);

  ["Depresi", "Tidak Depresi"].forEach((key, i) => {
    const g = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
    g.append("rect").attr("width", 15).attr("height", 15).attr("fill", color(key));
    g.append("text").attr("x", 20).attr("y", 12).text(key);
  });

  // Legend tambahan: singkatan P, M, B
  const legend2 = svg.append("g")
    .attr("transform", `translate(${width - margin.right - 150},${margin.top + 60})`);

  const legends = [
    { label: "P{n} = Pendidikan level n",   color: "#000" },
    { label: "M = Menikah",                  color: "#000" },
    { label: "B = Belum Menikah",            color: "#000" }
  ];

  legends.forEach((item, i) => {
    const g2 = legend2.append("g").attr("transform", `translate(0, ${i * 18})`);
    g2.append("rect")
      .attr("x", 0)
      .attr("y", -12)
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", item.color);
    g2.append("text")
      .attr("x", 18)
      .attr("y", 0)
      .attr("alignment-baseline", "middle")
      .style("font-size", "12px")
      .text(item.label);
  });

});
