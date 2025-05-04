(() => {
  const svgSocio = d3.select("#socio-edu-marriage"),
    width = +svgSocio.attr("width"),
    height = +svgSocio.attr("height"),
    margin = { top: 40, right: 20, bottom: 100, left: 60 };

  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const g = svgSocio.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  d3.csv("b_depressed.csv").then(function (data) {
    const filtered = data.filter((d) => d.education_level && d.Married && d.depressed);

    const grouped = d3.rollup(
      filtered,
      (v) => ({
        depressed: d3.sum(v, (d) => (d.depressed === "1" ? 1 : 0)),
        notDepressed: d3.sum(v, (d) => (d.depressed === "0" ? 1 : 0)),
      }),
      (d) => d.education_level,
      (d) => d.Married
    );

    const formatted = [];
    grouped.forEach((marriedMap, edu) => {
      const row = { education_level: edu };
      marriedMap.forEach((val, married) => {
        row[married === "1" ? "Married" : "Single"] = val.depressed;
        row[(married === "1" ? "Married" : "Single") + "_not"] = val.notDepressed;
      });
      formatted.push(row);
    });

    const categories = ["Married", "Single"];
    const series = d3
      .stack()
      .keys(categories)
      .value((d, key) => d[key] || 0)(formatted);

    const x = d3
      .scaleBand()
      .domain(formatted.map((d) => d.education_level))
      .range([0, chartWidth])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(series, (s) => d3.max(s, (d) => d[1]))])
      .nice()
      .range([chartHeight, 0]);

    const color = d3.scaleOrdinal().domain(categories).range(["#1f77b4", "#ff7f0e"]);

   g.append("g")
  .attr("transform", `translate(0,${chartHeight})`)
  .call(d3.axisBottom(x).tickFormat((d) => "Level " + d))
  .selectAll("text")
  .style("text-anchor", "end")
  .attr("dx", "-0.8em")
  .attr("dy", "0.15em")
  .attr("transform", "rotate(-40)");


    g.append("g").call(d3.axisLeft(y));

    g.selectAll(".serie")
      .data(series)
      .join("g")
      .attr("fill", (d) => color(d.key))
      .selectAll("rect")
      .data((d) => d)
      .join("rect")
      .attr("x", (d) => x(d.data.education_level))
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth());

    const legend = svgSocio.append("g").attr("transform", `translate(${width - 150}, 20)`);

    categories.forEach((cat, i) => {
      const l = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
      l.append("rect").attr("width", 15).attr("height", 15).attr("fill", color(cat));
      l.append("text").attr("x", 20).attr("y", 12).text(cat);
    });
  });
})();
