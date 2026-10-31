
function initCharts() {
  const { months, inboundByMonth, outboundByMonth } = DB.getChartData();

  const lineCtx = document.getElementById('chart-line')?.getContext('2d');
  if (lineCtx) {
    new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Inbound',
            data: inboundByMonth,
            borderColor: '#1a56db',
            backgroundColor: 'rgba(26,86,219,0.08)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#1a56db',
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Outbound',
            data: outboundByMonth,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16,185,129,0.08)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#10b981',
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { family: 'Plus Jakarta Sans', size: 12 }, boxWidth: 12, usePointStyle: true },
          },
          tooltip: {
            mode: 'index', intersect: false,
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${formatNumber(ctx.raw)} unit`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Plus Jakarta Sans', size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { family: 'Plus Jakarta Sans', size: 11 },
              callback: v => formatNumber(v),
            },
          },
        },
      },
    });
  }

  const donutCtx = document.getElementById('chart-donut')?.getContext('2d');
  if (donutCtx) {
    const barang = DB.getAllBarang();
    const kategoriMap = {};
    barang.forEach(b => {
      kategoriMap[b.kategori] = (kategoriMap[b.kategori] || 0) + Number(b.stok || 0);
    });
    const labels = Object.keys(kategoriMap);
    const values = Object.values(kategoriMap);
    const colors = ['#1a56db','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

    new Chart(donutCtx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { family: 'Plus Jakarta Sans', size: 12 }, boxWidth: 12, usePointStyle: true },
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${formatNumber(ctx.raw)} unit`,
            },
          },
        },
        cutout: '68%',
      },
    });
  }
}

document.addEventListener('DOMContentLoaded', initCharts);
