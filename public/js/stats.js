let currentCharts = {};

function formatMonthLabel(value) {
  // value like "2025-10" -> "October 2025"
  if (!value) return 'All time';
  const [y, m] = value.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

function updateFilterStatus(stats, monthValue) {
  const labelEl = document.getElementById('filterLabel');
  const countEl = document.getElementById('submissionCountBadge');
  if (labelEl) labelEl.textContent = formatMonthLabel(monthValue);
  if (countEl) {
    const n = Number(stats?.totalSubmissions || 0);
    countEl.textContent = `${n} ${n === 1 ? 'submission' : 'submissions'}`;
  }
}

async function loadStats(forceRefresh = false) {
  const monthPicker = document.getElementById('statsMonthPicker');
  const monthParam = monthPicker?.value ? `?month=${monthPicker.value}` : '';

  const loadingMsg = document.getElementById('statsLoadingMessage');
  const refreshBtn = document.getElementById('refreshStatsBtn');

  try {
    if (forceRefresh) {
      loadingMsg && (loadingMsg.style.display = 'block');
      if (refreshBtn) {
        refreshBtn.disabled = true;
        const t = refreshBtn.querySelector('.refresh-text'); if (t) t.textContent = 'Refreshing...';
      }
      if (!monthParam) await fetch('/stats/api/clear-cache', { method: 'POST' });
    }

    const [chartRes, statsRes] = await Promise.all([
      fetch(`/stats/api/chart-data${monthParam}`),
      fetch(`/stats/api/stats-summary${monthParam}`)
    ]);
    if (!chartRes.ok || !statsRes.ok) throw new Error('Network error');

    const [chartData, stats] = await Promise.all([chartRes.json(), statsRes.json()]);

    // NEW: update status label + count
    updateFilterStatus(stats, monthPicker?.value || '');

    updateTables(stats);
    Object.values(currentCharts).forEach(c => { try { c.destroy(); } catch {} });
    currentCharts = {};
    createCharts(chartData);

  } catch (e) {
    console.error('Error loading stats:', e);
    alert('Error loading statistics. Please try again.');
  } finally {
    loadingMsg && (loadingMsg.style.display = 'none');
    if (refreshBtn) {
      refreshBtn.disabled = false;
      const t = refreshBtn.querySelector('.refresh-text'); if (t) t.textContent = 'Refresh Data';
    }
  }
}

// Update data tables
function updateTables(stats) {
  // Chakra table
  const chakraTableBody = document.getElementById('chakraTableBody');
  const chakras = [
    { key: 'rootChakra', name: '🔴 Root Chakra' },
    { key: 'sacralChakra', name: '🟠 Sacral Chakra' },
    { key: 'solarPlexusChakra', name: '🟡 Solar Plexus Chakra' },
    { key: 'heartChakra', name: '🟢 Heart Chakra' },
    { key: 'throatChakra', name: '🔵 Throat Chakra' },
    { key: 'thirdEyeChakra', name: '🟣 Third Eye Chakra' },
    { key: 'crownChakra', name: '🟣 Crown Chakra' }
  ];

  chakraTableBody.innerHTML = chakras.map(chakra => {
    const data = stats.chakraAverages[chakra.key] || { average: 0, mode: 0 };
    return `
      <tr>
        <td>${chakra.name}</td>
        <td>${data.average}</td>
        <td>${data.mode}</td>
      </tr>
    `;
  }).join('');

  // Quadrant table
  const quadrantTableBody = document.getElementById('quadrantTableBody');
  const quadrants = [
    { key: 'healthWellness', name: '💪 Health & Wellness' },
    { key: 'loveRelationships', name: '❤️ Love & Relationships' },
    { key: 'careerJob', name: '💼 Career/Job' },
    { key: 'timeMoney', name: '💰 Time & Money' }
  ];

  quadrantTableBody.innerHTML = quadrants.map(quadrant => {
    const data = stats.lifeQuadrantAverages[quadrant.key] || { average: 0, mode: 0 };
    return `
      <tr>
        <td>${quadrant.name}</td>
        <td>${data.average}</td>
        <td>${data.mode}</td>
      </tr>
    `;
  }).join('');
}

// Create all charts
function createCharts(chartData) {
  // Chakra Radar Chart
  const chakraCtx = document.getElementById('chakraRadarChart');
  if (chakraCtx) {
    currentCharts.chakraRadar = new Chart(chakraCtx, {
      type: 'radar',
      data: {
        labels: chartData.chakraData.labels,
        datasets: [{
          label: 'Average Chakra Scores',
          data: chartData.chakraData.datasets[0].data,
          backgroundColor: 'rgba(108, 92, 231, 0.2)',
          borderColor: 'rgb(108, 92, 231)',
          borderWidth: 2,
          pointBackgroundColor: chartData.chakraData.datasets[0].borderColor,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: chartData.chakraData.datasets[0].borderColor,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            beginAtZero: true,
            max: 21,
            ticks: { stepSize: 7, font: { size: 12 } },
            pointLabels: { font: { size: 14, weight: 'bold' } }
          }
        },
        plugins: {
          legend: { display: true, position: 'top' }
        }
      }
    });
  }

  // Life Quadrants Bar Chart
  const quadrantsCtx = document.getElementById('lifeQuadrantsChart');
  if (quadrantsCtx) {
    currentCharts.lifeQuadrants = new Chart(quadrantsCtx, {
      type: 'bar',
      data: chartData.lifeQuadrantData,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: { beginAtZero: true, max: 15 }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // Age Distribution Doughnut
  const ageCtx = document.getElementById('ageBracketChart');
  if (ageCtx && chartData.ageBracketData.labels.length > 0) {
    currentCharts.ageBracket = new Chart(ageCtx, {
      type: 'doughnut',
      data: chartData.ageBracketData,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 15 } },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
              }
            }
          }
        }
      }
    });
  }

  // Challenges Bar Chart
  const challengesCtx = document.getElementById('challengesChart');
  if (challengesCtx && chartData.challengesData.labels.length > 0) {
    currentCharts.challenges = new Chart(challengesCtx, {
      type: 'bar',
      data: chartData.challengesData,
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1 } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // Focus Chakra Pie Chart
  const focusCtx = document.getElementById('focusChakraChart');
  if (focusCtx && chartData.focusChakraData.labels.length > 0) {
    currentCharts.focusChakra = new Chart(focusCtx, {
      type: 'pie',
      data: chartData.focusChakraData,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 15 } },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
              }
            }
          }
        }
      }
    });
  }

  // Archetype Bar Chart
  const archetypeCtx = document.getElementById('archetypeChart');
  if (archetypeCtx && chartData.archetypeData && chartData.archetypeData.labels.length > 0) {
    currentCharts.archetype = new Chart(archetypeCtx, {
      type: 'bar',
      data: chartData.archetypeData,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // Experience Pie Chart
  const expCtx = document.getElementById('experienceChart');
  if (expCtx && chartData.experienceData && chartData.experienceData.labels.length > 0) {
    currentCharts.experience = new Chart(expCtx, {
      type: 'doughnut',
      data: chartData.experienceData,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 15 } },
          tooltip: {
            callbacks: {
              label: function(context) {
                const arr = Array.isArray(context.dataset?.data) ? context.dataset.data : [];
                const total = arr.reduce((a,b)=>a+b,0) || 0;
                const pct = total ? ((context.parsed / total) * 100).toFixed(1) : 0;
                return `${context.label}: ${context.parsed} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  // Familiarity Bar Chart
  const famCtx = document.getElementById('familiarityChart');
  if (famCtx && chartData.familiarityData && chartData.familiarityData.labels.length > 0) {
    currentCharts.familiarity = new Chart(famCtx, {
      type: 'bar',
      data: chartData.familiarityData,
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
        plugins: { legend: { display: false } }
      }
    });
  }

  // Healthcare Worker Pie Chart
  const hcCtx = document.getElementById('healthcareChart');
  if (hcCtx && chartData.healthcareData && chartData.healthcareData?.labels?.length) {
    currentCharts.healthcare = new Chart(hcCtx, {
      type: 'bar',
      data: chartData.healthcareData,
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
        plugins: { legend: { display: false } }
      }
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const picker = document.getElementById('statsMonthPicker');
  const clearBtn = document.getElementById('clearMonthBtn');

  if (picker && !picker.value) picker.value = new Date().toISOString().slice(0, 7);

  clearBtn?.addEventListener('click', () => {
    if (picker) picker.value = '';
    loadStats(true);
  });

  document.getElementById('refreshStatsBtn')?.addEventListener('click', () => loadStats(true));

  // initial load
  loadStats(false);
});