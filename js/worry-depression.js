// Load data
d3.csv("b_depressed.csv").then(data => {
    // Convert string values to numbers
    data.forEach(d => {
      Object.keys(d).forEach(key => {
        if (key !== "Survey_id" && key !== "Ville_id") {
          d[key] = +d[key];
        }
      });
    });
  
    // Prepare grouped data for bar chart
    const sortedByExpenses = [...data].sort((a, b) => a.living_expenses - b.living_expenses);
    const quartile = Math.floor(sortedByExpenses.length / 4);
    const expenseQuartiles = [
      { name: "Very Low Expenses", data: sortedByExpenses.slice(0, quartile) },
      { name: "Low Expenses",      data: sortedByExpenses.slice(quartile, quartile * 2) },
      { name: "High Expenses",     data: sortedByExpenses.slice(quartile * 2, quartile * 3) },
      { name: "Very High Expenses",data: sortedByExpenses.slice(quartile * 3) }
    ];
  
    const expenseGroups = expenseQuartiles.map(q => {
      const total = q.data.length;
      const depressed = q.data.filter(d => d.depressed === 1).length;
      return { category: q.name, depressionRate: (depressed/total)*100 };
    });
  
    // Education level grouping
    const eduGroups = {};
    data.forEach(d => {
      eduGroups[d.education_level] = eduGroups[d.education_level] || { total:0, dep:0 };
      eduGroups[d.education_level].total++;
      if (d.depressed===1) eduGroups[d.education_level].dep++;
    });
    const educationData = Object.entries(eduGroups)
      .map(([lvl, g]) => ({ category: `Education: ${lvl}`, depressionRate: (g.dep/g.total)*100 }));
  
    // Age grouping
    const ageGroups = {"18-30":{total:0,dep:0},"31-45":{total:0,dep:0},"46-60":{total:0,dep:0},"61+":{total:0,dep:0}};
    data.forEach(d => {
      let key;
      if (d.Age <= 30) key = "18-30";
      else if (d.Age <= 45) key = "31-45";
      else if (d.Age <= 60) key = "46-60";
      else key = "61+";
      ageGroups[key].total++;
      if (d.depressed === 1) ageGroups[key].dep++;
    });
    const ageData = Object.entries(ageGroups)
      .map(([age, g]) => ({ category: `Age: ${age}`, depressionRate: (g.dep/g.total)*100 }));
  
    // Combine
    const barChartData = [
      { groupName: "Pengeluaran Hidup", data: expenseGroups },
      { groupName: "Tingkat Pendidikan", data: educationData },
      { groupName: "Kelompok Umur",     data: ageData }
    ];
  
    // Compute correlations
    const vars = ['living_expenses','other_expenses','education_level','Age','Married','Number_children','total_members','incoming_salary','depressed'];
    const corr = calculateCorrelations(data, vars);
  
    // Draw
    createBarChart("#bar-chart-container", barChartData);
    createHeatmap("#heatmap-container", corr, vars);
  });
  
  function correlationCoefficient(x, y) {
    const n = x.length;
    let sx = 0, sy = 0, sxy = 0, sx2 = 0, sy2 = 0;
    for(let i = 0; i < n; i++){
      sx += x[i]; 
      sy += y[i]; 
      sxy += x[i] * y[i]; 
      sx2 += x[i] * x[i]; 
      sy2 += y[i] * y[i];
    }
    const num = n * sxy - sx * sy;
    const den = Math.sqrt((n * sx2 - sx * sx) * (n * sy2 - sy * sy));
    return den ? num / den : 0;
  }
  
  function calculateCorrelations(data, vars) {
    const M = [];
    for(let i = 0; i < vars.length; i++){
      M[i] = [];
      for(let j = 0; j < vars.length; j++){
        M[i][j] = correlationCoefficient(
          data.map(d => d[vars[i]]), 
          data.map(d => d[vars[j]])
        );
      }
    }
    return M;
  }
  
  function createBarChart(selector, barChartData) {
    const container = d3.select(selector); 
    container.selectAll("*").remove();
    const totalW = parseInt(container.style("width"));
    const margin = {top: 60, right: 150, bottom: 100, left: 60};
    const w = totalW - margin.left - margin.right;
    const h = 400 - margin.top - margin.bottom;
    const svg = container.append("svg")
      .attr("viewBox", `0 0 ${totalW} 400`)
      .classed("w-full h-auto", true)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    // Flatten + positions
    let flat = [], grpPos = [], off = 0;
    barChartData.forEach(g => {
      const bw = 30, gap = 10;
      const grpW = g.data.length * (bw + gap) - gap;
      g.data.forEach((d, i) => flat.push({ 
        x: off + i * (bw + gap), 
        y: d.depressionRate, 
        grp: g.groupName,
        category: d.category 
      }));
      grpPos.push({name: g.groupName, mid: off + grpW / 2});
      off += grpW + 60;
    });
  
    const xScale = d3.scaleLinear().domain([0, off - 60]).range([0, w]);
    const yScale = d3.scaleLinear().domain([0, d3.max(flat, d => d.y) * 1.1]).range([h, 0]);
    const color = d3.scaleOrdinal()
      .domain(barChartData.map(d => d.groupName))
      .range(["#4e79a7", "#f28e2c", "#e15759"]);
  
    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(xScale).ticks(0));
    
    svg.append("g")
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => d + "%"));
  
    // Bars + labels
    svg.selectAll("rect.bar")
      .data(flat)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.x))
      .attr("y", d => yScale(d.y))
      .attr("width", 30)
      .attr("height", d => h - yScale(d.y))
      .attr("fill", d => color(d.grp));
    
    svg.selectAll("text.bar-label")
      .data(flat)
      .enter().append("text")
      .attr("class", "bar-label")
      .attr("x", d => xScale(d.x) + 15)
      .attr("y", d => yScale(d.y) - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .text(d => d.y.toFixed(1) + "%");
  
    // Category labels
    svg.selectAll("text.cat-label")
      .data(flat)
      .enter().append("text")
      .attr("class", "cat-label")
      .attr("x", d => xScale(d.x) + 15)
      .attr("y", h + 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("transform", d => `rotate(45, ${xScale(d.x) + 15}, ${h + 15})`)
      .text(d => d.category.split(": ")[1] || d.category);
  
    // Group titles
    svg.append("g").selectAll("text.grp-title")
      .data(grpPos)
      .enter().append("text")
      .attr("class", "grp-title")
      .attr("x", d => xScale(d.mid))
      .attr("y", h + 60)
      .attr("text-anchor", "middle")
      .attr("font-size", "13px")
      .attr("font-weight", "bold")
      .text(d => d.name);
  
    // Chart title
    svg.append("text")
      .attr("x", w / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text("Hubungan antara Faktor Risiko dan Tingkat Depresi");
  
    // Legend
    const leg = svg.append("g").attr("transform", `translate(${w + 20}, 0)`);
    barChartData.forEach((g, i) => {
      leg.append("rect")
        .attr("x", 0)
        .attr("y", i * 25)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", color(g.groupName));
      
      leg.append("text")
        .attr("x", 20)
        .attr("y", i * 25 + 12)
        .attr("font-size", "12px")
        .text(g.groupName);
    });
  
    // Footnote
    svg.append("text")
      .attr("x", w / 2)
      .attr("y", h + 85)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-style", "italic")
      .text("Catatan: Persentase menunjukkan proporsi individu dengan depresi dalam setiap kelompok");
  }
  
  function createHeatmap(selector, M, vars) {
    const container = d3.select(selector); 
    container.selectAll("*").remove();
    const totalW = parseInt(container.style("width"));
    const margin = {top: 80, right: 50, bottom: 120, left: 120};
    const size = Math.min(totalW - margin.left - margin.right, 500);
    const cellSize = size / vars.length;
    
    const svg = container.append("svg")
      .attr("viewBox", `0 0 ${totalW} ${size + margin.top + margin.bottom}`)
      .classed("w-full h-auto", true)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
  
    const x = d3.scaleBand()
      .domain(vars)
      .range([0, size])
      .padding(0.05);
    
    const y = d3.scaleBand()
      .domain(vars)
      .range([0, size])
      .padding(0.05);
    
    const color = d3.scaleSequential(d3.interpolateRdBu)
      .domain([1, -1]);
  
    // Cells + values
    const cells = [];
    M.forEach((row, i) => row.forEach((v, j) => cells.push({i, j, v})));
    
    svg.selectAll("rect")
      .data(cells)
      .enter().append("rect")
      .attr("x", d => x(vars[d.j]))
      .attr("y", d => y(vars[d.i]))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", d => color(d.v));
    
    svg.selectAll("text.val")
      .data(cells)
      .enter().append("text")
      .attr("class", "val")
      .attr("x", d => x(vars[d.j]) + x.bandwidth() / 2)
      .attr("y", d => y(vars[d.i]) + y.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", cellSize < 30 ? "8px" : "10px")
      .attr("fill", d => Math.abs(d.v) > 0.5 ? "#fff" : "#000")
      .text(d => d.v.toFixed(2));
  
    // Axis labels
    svg.append("g").selectAll("text.x")
      .data(vars)
      .enter().append("text")
      .attr("class", "x")
      .attr("x", d => x(d) + x.bandwidth() / 2)
      .attr("y", size + 10)
      .attr("transform", d => `rotate(45, ${x(d) + x.bandwidth() / 2}, ${size + 10})`)
      .attr("text-anchor", "start")
      .attr("font-size", "11px")
      .text(varDisplayName);
  
    svg.append("g").selectAll("text.y")
      .data(vars)
      .enter().append("text")
      .attr("class", "y")
      .attr("x", -10)
      .attr("y", d => y(d) + y.bandwidth() / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("font-size", "11px")
      .text(varDisplayName);
  
    // Title
    svg.append("text")
      .attr("x", size / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text("Matriks Korelasi antara Variabel dan Depresi");
  
    // Legend gradient
    const defs = svg.append("defs");
    const grad = defs.append("linearGradient")
      .attr("id", "correlation-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
    
    grad.append("stop").attr("offset", "0%").attr("stop-color", color(1));
    grad.append("stop").attr("offset", "50%").attr("stop-color", color(0));
    grad.append("stop").attr("offset", "100%").attr("stop-color", color(-1));
  
    const legend = svg.append("g").attr("transform", `translate(${(size - 200) / 2}, ${size + 50})`);
    legend.append("rect")
      .attr("width", 200)
      .attr("height", 10)
      .style("fill", "url(#correlation-gradient)");
    
    ["-1.0", "0.0", "1.0"].forEach((t, i) => {
      legend.append("text")
        .attr("x", i * 100)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .text(t);
    });
    
    legend.append("text")
      .attr("x", 100)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Korelasi");
  
    // Helper function to make variable names more readable
    function varDisplayName(d) {
      const varDisplayNames = {
        'living_expenses': 'Biaya Hidup',
        'other_expenses': 'Biaya Lain',
        'education_level': 'Pendidikan',
        'Age': 'Umur',
        'Married': 'Status Nikah',
        'Number_children': 'Jml Anak',
        'total_members': 'Anggota RT',
        'incoming_salary': 'Gaji',
        'depressed': 'Depresi'
      };
      return varDisplayNames[d] || d;
    }
  }