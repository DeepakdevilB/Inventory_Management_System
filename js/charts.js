// Chart management module for Inventory Management System
// Handles Chart.js setup and data updates for dashboard and reports views

(function () {
  if (typeof window === 'undefined') {
    return;
  }

  // Guard against missing Chart.js or ApiService
  if (typeof Chart === 'undefined') {
    console.warn('[ChartManager] Chart.js not detected. Charts will be skipped.');
    return;
  }

  if (typeof ApiService === 'undefined') {
    console.warn('[ChartManager] ApiService not detected. Charts will be skipped.');
    return;
  }

  const COLOR_PALETTE = [
    '#4361EE',
    '#3A0CA3',
    '#4CC9F0',
    '#4895EF',
    '#7209B7',
    '#F72585',
    '#FF9E00',
    '#8AC926',
    '#FF595E',
    '#1982C4',
  ];

  const lightenColor = (hex, percent = 20) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;

    return (
      '#' +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  };

  const getCanvas = (id) => document.getElementById(id);

  const ChartManager = {
    initialized: false,
    charts: {},

    initialize() {
      if (this.initialized) {
        return;
      }

      this.createDashboardCharts();
      this.createReportCharts();

      this.initialized = true;
    },

    createDashboardCharts() {
      this.charts.topItemsChart = this.createChart(
        'topItemsChart',
        'bar',
        {
          labels: [],
          datasets: [
            {
              label: 'Quantity',
              data: [],
              backgroundColor: COLOR_PALETTE[0],
              borderRadius: 6,
            },
          ],
        },
        {
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } },
          },
        }
      );

      this.charts.supplierDonutChart = this.createChart(
        'supplierDonutChart',
        'doughnut',
        {
          labels: [],
          datasets: [
            {
              label: 'Quantity',
              data: [],
              backgroundColor: COLOR_PALETTE,
            },
          ],
        },
        {
          plugins: {
            legend: { position: 'bottom' },
          },
        }
      );
    },

    createReportCharts() {
      this.charts.topItemsChartReport = this.createChart(
        'topItemsChartReport',
        'bar',
        {
          labels: [],
          datasets: [
            {
              label: 'Quantity',
              data: [],
              backgroundColor: COLOR_PALETTE[1],
              borderRadius: 6,
            },
          ],
        },
        {
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } },
          },
        }
      );

      this.charts.bottomItemsChartReport = this.createChart(
        'bottomItemsChartReport',
        'bar',
        {
          labels: [],
          datasets: [
            {
              label: 'Quantity',
              data: [],
              backgroundColor: COLOR_PALETTE[4],
              borderRadius: 6,
            },
          ],
        },
        {
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: { beginAtZero: true, ticks: { precision: 0 } },
          },
        }
      );

      this.charts.supplierStackedChart = this.createChart(
        'supplierStackedChart',
        'bar',
        {
          labels: [],
          datasets: [],
        },
        {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: { mode: 'index', intersect: false },
          },
          scales: {
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
          },
        }
      );

      this.charts.supplierValueChart = this.createChart(
        'supplierValueChart',
        'bar',
        {
          labels: [],
          datasets: [
            {
              label: 'Total Value ($)',
              data: [],
              backgroundColor: COLOR_PALETTE.map((color) => lightenColor(color, 15)),
              borderRadius: 6,
            },
          ],
        },
        {
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => `$${Number(context.parsed.y || 0).toFixed(2)}`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => `$${value}`,
              },
            },
          },
        }
      );

      this.charts.categoryBarChart = this.createChart(
        'categoryBarChart',
        'bar',
        {
          labels: [],
          datasets: [
            {
              label: 'Total Quantity',
              data: [],
              backgroundColor: COLOR_PALETTE[2],
              borderRadius: 6,
            },
          ],
        },
        {
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } },
          },
        }
      );

      this.charts.categoryPieChart = this.createChart(
        'categoryPieChart',
        'pie',
        {
          labels: [],
          datasets: [
            {
              label: 'Inventory Value',
              data: [],
              backgroundColor: COLOR_PALETTE,
            },
          ],
        },
        {
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = Number(context.parsed || 0);
                  const total = context.dataset.data.reduce((sum, val) => sum + Number(val || 0), 0);
                  const percentage = total ? ((value / total) * 100).toFixed(1) : 0;
                  return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
                },
              },
            },
          },
        }
      );
    },

    createChart(id, type, data, options) {
      const canvas = getCanvas(id);
      if (!canvas) {
        return null;
      }

      const context = canvas.getContext('2d');
      return new Chart(context, {
        type,
        data,
        options: Object.assign(
          {
            maintainAspectRatio: false,
            animation: { duration: 300 },
          },
          options || {}
        ),
      });
    },

    async updateAll() {
      try {
        const [quantityExtremes, supplierData, categoryData] = await Promise.all([
          ApiService.getQuantityExtremes(),
          ApiService.getSupplierStockReport(),
          ApiService.getCategoryStockReport(),
        ]);

        this.updateQuantityCharts(quantityExtremes);
        this.updateSupplierCharts(supplierData);
        this.updateCategoryCharts(categoryData);
        this.updateSupplierReportTable(supplierData);
      } catch (error) {
        console.error('[ChartManager] Failed to update charts:', error);
      }
    },

    updateQuantityCharts(data) {
      if (!data) return;
      const { top5 = [], bottom5 = [] } = data;

      const formatItems = (items) => ({
        labels: items.map((item) => item.name),
        quantities: items.map((item) => item.quantity),
      });

      const top = formatItems(top5);
      const bottom = formatItems(bottom5);

      this.updateChartDataset(this.charts.topItemsChart, top.labels, top.quantities);
      this.updateChartDataset(this.charts.topItemsChartReport, top.labels, top.quantities);
      this.updateChartDataset(this.charts.bottomItemsChartReport, bottom.labels.reverse(), bottom.quantities.reverse());
    },

    updateSupplierCharts(supplierData) {
      const suppliers = Object.keys(supplierData || {});
      if (suppliers.length === 0) {
        this.updateChartDataset(this.charts.supplierDonutChart, [], []);
        this.updateStackedChart(this.charts.supplierStackedChart, [], {});
        this.updateChartDataset(this.charts.supplierValueChart, [], []);
        return;
      }

      const quantityValues = suppliers.map((supplier) => supplierData[supplier].totalQuantity || 0);
      this.updateChartDataset(this.charts.supplierDonutChart, suppliers, quantityValues);

      const supplierValues = suppliers.map((supplier) => supplierData[supplier].totalValue || 0);
      this.updateChartDataset(this.charts.supplierValueChart, suppliers, supplierValues);

      const categories = new Set();
      suppliers.forEach((supplier) => {
        const categoryMap = supplierData[supplier].categories || {};
        Object.keys(categoryMap).forEach((category) => categories.add(category));
      });

      this.updateStackedChart(this.charts.supplierStackedChart, suppliers, Object.fromEntries(
        Array.from(categories).map((category, index) => [
          category,
          suppliers.map((supplier) => supplierData[supplier].categories?.[category] || 0),
        ])
      ));
    },

    updateCategoryCharts(categoryData) {
      const categories = Object.keys(categoryData || {});
      if (categories.length === 0) {
        this.updateChartDataset(this.charts.categoryBarChart, [], []);
        this.updateChartDataset(this.charts.categoryPieChart, [], []);
        return;
      }

      const quantities = categories.map((category) => categoryData[category].totalQuantity || 0);
      const values = categories.map((category) => categoryData[category].totalValue || 0);

      this.updateChartDataset(this.charts.categoryBarChart, categories, quantities);
      this.updateChartDataset(this.charts.categoryPieChart, categories, values);
    },

    updateSupplierReportTable(supplierData) {
      const tableBody = document.getElementById('supplierReportBody');
      if (!tableBody) return;

      const suppliers = Object.keys(supplierData || {});
      if (suppliers.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="4" class="text-center text-muted">No supplier data available</td>
          </tr>
        `;
        return;
      }

      tableBody.innerHTML = suppliers
        .map((supplier) => {
          const data = supplierData[supplier];
          return `
            <tr>
              <td>${supplier}</td>
              <td>${data.totalItems ?? 0}</td>
              <td>${data.totalQuantity ?? 0}</td>
              <td>$${Number(data.totalValue ?? 0).toFixed(2)}</td>
            </tr>
          `;
        })
        .join('');
    },

    updateChartDataset(chart, labels, data) {
      if (!chart) return;
      chart.data.labels = labels;

      if (chart.data.datasets.length > 0) {
        chart.data.datasets[0].data = data;

        if (Array.isArray(chart.data.datasets[0].backgroundColor) && data.length !== chart.data.datasets[0].backgroundColor.length) {
          chart.data.datasets[0].backgroundColor = data.map((_, idx) => COLOR_PALETTE[idx % COLOR_PALETTE.length]);
        }
      }

      chart.update();
    },

    updateStackedChart(chart, labels, datasetMap) {
      if (!chart) return;

      const categories = Object.keys(datasetMap);
      chart.data.labels = labels;
      chart.data.datasets = categories.map((category, index) => ({
        label: category,
        data: datasetMap[category],
        backgroundColor: COLOR_PALETTE[index % COLOR_PALETTE.length],
        borderRadius: 4,
      }));

      chart.update();
    },
  };

  window.ChartManager = ChartManager;
})();

