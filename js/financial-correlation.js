document.addEventListener('DOMContentLoaded', function() {
    // Memuat dan memproses data CSV
    d3.csv('b_depressed.csv').then(function(data) {
      // Mengubah nilai string menjadi angka
      data.forEach(d => {
        d.living_expenses = +d.living_expenses;
        d.other_expenses = +d.other_expenses;
        d.farm_expenses = +d.farm_expenses;
        d.total_expenses = +d.living_expenses + +d.other_expenses + +d.farm_expenses;
        
        d.incoming_salary = +d.incoming_salary;
        d.incoming_own_farm = +d.incoming_own_farm;
        d.incoming_business = +d.incoming_business;
        d.incoming_no_business = +d.incoming_no_business;
        d.incoming_agricultural = +d.incoming_agricultural;
        d.total_income = +d.incoming_salary + +d.incoming_own_farm + +d.incoming_business + 
                         +d.incoming_no_business + +d.incoming_agricultural;
        
        d.depressed = +d.depressed;
      });
  
      // Membuat dua visualisasi: Scatter Plot dan Heatmap
      buatScatterPlot(data);
      buatHeatmap(data);
    }).catch(function(error) {
      console.error('Kesalahan saat memuat file CSV:', error);
      document.getElementById('financial-correlation').innerHTML = 
        '<text x="50%" y="50%" text-anchor="middle">Kesalahan memuat data: ' + error.message + '</text>';
    });
  });
  
  function buatScatterPlot(data) {
    // Mengatur dimensi dan margin
    const margin = {top: 40, right: 100, bottom: 60, left: 80};
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Membuat elemen SVG
    const svg = d3.select('#scatter-plot')
      .append('g')
        .attr('class', 'scatter-plot')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Mengatur skala
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total_income)])
      .nice()
      .range([0, width]);
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total_expenses)])
      .nice()
      .range([height, 0]);
    
    // Menambahkan sumbu X dan Y dengan format angka yang bersih
    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format('.0f')))
      .append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', 40)
        .attr('fill', 'black')
        .attr('text-anchor', 'middle')
        .text('Total Pendapatan');
    
    svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('.0f')))
      .append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -60)
        .attr('fill', 'black')
        .attr('text-anchor', 'middle')
        .text('Total Pengeluaran');
    
    // Menambahkan titik-titik scatter plot
    svg.append('g')
      .selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
        .attr('cx', d => xScale(d.total_income))
        .attr('cy', d => yScale(d.total_expenses))
        .attr('r', 5)
        .attr('fill', d => d.depressed === 1 ? '#e74c3c' : '#3498db') // Merah untuk depresi, Biru untuk tidak depresi
        .attr('stroke', '#333')
        .attr('stroke-width', 1)
        .attr('opacity', 0.7)
        .append('title')
          .text(d => `ID: ${d.Survey_id}\nPendapatan: ${d3.format(',')(d.total_income)}\nPengeluaran: ${d3.format(',')(d.total_expenses)}\nStatus: ${d.depressed === 1 ? 'Depresi' : 'Tidak Depresi'}`);
    
    // Menambahkan legenda
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width + 10}, 20)`);
    
    // Tidak depresi
    legend.append('circle')
      .attr('cx', 10)
      .attr('cy', 10)
      .attr('r', 5)
      .attr('fill', '#3498db');
    
    legend.append('text')
      .attr('x', 25)
      .attr('y', 15)
      .text('Tidak Depresi');
    
    // Depresi
    legend.append('circle')
      .attr('cx', 10)
      .attr('cy', 40)
      .attr('r', 5)
      .attr('fill', '#e74c3c');
    
    legend.append('text')
      .attr('x', 25)
      .attr('y', 45)
      .text('Depresi');
    
    // Menambahkan judul
    svg.append('text')
      .attr('class', 'chart-title')
      .attr('x', width / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Scatter Plot: Pendapatan vs Pengeluaran berdasarkan Status Depresi');
    
    // Menghitung jumlah Depresi dan Tidak Depresi
    const depresiCount = data.filter(d => d.depressed === 1).length;
    const tidakDepresiCount = data.filter(d => d.depressed === 0).length;
  
    // Menampilkan jumlah Depresi dan Tidak Depresi di atas grafik
    svg.append('text')
      .attr('x', width / 4)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#e74c3c')
      .text(`Depresi: ${depresiCount}`);
    
    svg.append('text')
      .attr('x', (width / 4) * 3)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#3498db')
      .text(`Tidak Depresi: ${tidakDepresiCount}`);
  }
  
  
  
  function buatHeatmap(data) {
    // Menghitung matriks korelasi
    const hitungKorelasi = (values1, values2) => {
      const n = values1.length;
      if (n === 0) return 0;
      
      let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;
      for (let i = 0; i < n; i++) {
        sum1 += values1[i];
        sum2 += values2[i];
        sum1Sq += values1[i] ** 2;
        sum2Sq += values2[i] ** 2;
        pSum += values1[i] * values2[i];
      }
      
      const num = pSum - (sum1 * sum2 / n);
      const den = Math.sqrt((sum1Sq - sum1 ** 2 / n) * (sum2Sq - sum2 ** 2 / n));
      return den === 0 ? 0 : num / den;
    };
    
    // Mendefinisikan variabel finansial untuk dianalisis
    const variabel = [
      { name: 'Pengeluaran Hidup', key: 'living_expenses' },
      { name: 'Pengeluaran Lain', key: 'other_expenses' },
      { name: 'Pengeluaran Pertanian', key: 'farm_expenses' },
      { name: 'Gaji', key: 'incoming_salary' },
      { name: 'Pendapatan Pertanian', key: 'incoming_agricultural' },
      { name: 'Pendapatan Bisnis', key: 'incoming_business' },
      { name: 'Total Pendapatan', key: 'total_income' },
      { name: 'Total Pengeluaran', key: 'total_expenses' },
      { name: 'Status Depresi', key: 'depressed' }
    ];
    
    // Menghitung matriks korelasi
    const matriksKorelasi = [];
    for (let i = 0; i < variabel.length; i++) {
      matriksKorelasi[i] = [];
      for (let j = 0; j < variabel.length; j++) {
        const values1 = data.map(d => +d[variabel[i].key]);
        const values2 = data.map(d => +d[variabel[j].key]);
        matriksKorelasi[i][j] = hitungKorelasi(values1, values2);
      }
    }
    
    // Mengatur dimensi dan margin untuk heatmap
    const margin = {top: 80, right: 20, bottom: 110, left: 120};
    const width = 700 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    // Membuat elemen SVG
    const svg = d3.select('#heatmap')
      .append('g')
        .attr('class', 'heatmap')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Mengatur skala
    const x = d3.scaleBand()
      .range([0, width])
      .domain(variabel.map(d => d.name))
      .padding(0.05);
    
    const y = d3.scaleBand()
      .range([height, 0])
      .domain(variabel.map(d => d.name))
      .padding(0.05);
    
    // Skala warna untuk nilai korelasi (-1 hingga 1)
    const skalawarna = d3.scaleSequential()
      .interpolator(d3.interpolateRdBu)
      .domain([1, -1]);
    
    // Menambahkan sumbu X dan Y
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)');
    
    svg.append('g')
      .call(d3.axisLeft(y).tickSize(0));
    
    // Membuat dan mengisi sel heatmap
    for (let i = 0; i < variabel.length; i++) {
      for (let j = 0; j < variabel.length; j++) {
        svg.append('rect')
          .attr('x', x(variabel[j].name))
          .attr('y', y(variabel[i].name))
          .attr('width', x.bandwidth())
          .attr('height', y.bandwidth())
          .style('fill', skalawarna(matriksKorelasi[i][j]))
          .append('title')
            .text(`${variabel[i].name} vs ${variabel[j].name}: ${matriksKorelasi[i][j].toFixed(2)}`);
        
        // Menambahkan teks korelasi
        if (i !== j) { // Lewati diagonal (selalu 1)
          svg.append('text')
            .attr('x', x(variabel[j].name) + x.bandwidth() / 2)
            .attr('y', y(variabel[i].name) + y.bandwidth() / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-size', '8px')
            .attr('fill', Math.abs(matriksKorelasi[i][j]) > 0.5 ? '#fff' : '#000')
            .text(matriksKorelasi[i][j].toFixed(2));
        }
      }
    }
    
    // Menambahkan judul
    svg.append('text')
      .attr('class', 'heatmap-title')
      .attr('x', width / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Heatmap Korelasi: Faktor Finansial dan Status Depresi');
    
    // Menambahkan legenda warna
    const legendWidth = 300;
    const legendHeight = 20;
    
    const legendX = d3.scaleLinear()
      .domain([-1, 1])
      .range([0, legendWidth]);
    
    const legendAxis = d3.axisBottom()
      .scale(legendX)
      .ticks(5);
    
    const defs = svg.append('defs');
    
    const linearGradient = defs.append('linearGradient')
      .attr('id', 'linear-gradient');
    
    linearGradient.selectAll('stop')
      .data([
        {offset: '0%', color: skalawarna(1)},
        {offset: '50%', color: skalawarna(0)},
        {offset: '100%', color: skalawarna(-1)}
      ])
      .enter().append('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color);
    
    svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width/2 - legendWidth/2},${height + 60})`);
    
    svg.select('.legend')
      .append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#linear-gradient)');
    
    svg.select('.legend')
      .call(legendAxis);
  }