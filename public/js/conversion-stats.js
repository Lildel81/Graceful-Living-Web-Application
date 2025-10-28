/**
 * Conversion Stats - Client-side rendering
 * Handles the display of ML conversion prediction statistics
 */

(function() {
  'use strict';

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    initConversionStats();
  });

  function initConversionStats() {
    const container = document.getElementById('conversion-prediction-container');
    if (!container) {
      console.warn('Conversion prediction container not found');
      return;
    }

    // Get data from data attributes
    const conversionStatsData = container.getAttribute('data-conversion-stats');
    const mlPredictionsData = container.getAttribute('data-ml-predictions');
    const highProbabilityLeadsData = container.getAttribute('data-high-probability-leads');

    // Parse JSON data
    let conversionStats = null;
    let mlPredictions = null;
    let highProbabilityLeads = 0;

    try {
      if (conversionStatsData && conversionStatsData !== 'null') {
        conversionStats = JSON.parse(conversionStatsData);
      }
      if (mlPredictionsData && mlPredictionsData !== 'null') {
        mlPredictions = JSON.parse(mlPredictionsData);
      }
      if (highProbabilityLeadsData && highProbabilityLeadsData !== 'null') {
        highProbabilityLeads = parseInt(highProbabilityLeadsData, 10);
      }
    } catch (error) {
      console.error('Error parsing conversion stats data:', error);
      renderErrorMessage(container);
      return;
    }

    // Render appropriate view
    if (conversionStats) {
      renderConversionStats(container, conversionStats, mlPredictions, highProbabilityLeads);
    } else {
      renderNoDataMessage(container);
    }
  }

  /**
   * Render the conversion statistics
   */
  function renderConversionStats(container, stats, predictions, highProbLeads) {
    const html = `
      <div class="ml-metrics-grid ml-fade-in">
        ${renderOverallConversionRate(stats)}
        ${renderRecentActivity(stats)}
        ${renderHighProbabilityLeads(stats, predictions, highProbLeads)}
        ${renderAverageConversionWindow(stats)}
      </div>
      ${renderKeyInsights(stats)}
      ${renderMLPredictions(predictions)}
    `;

    container.innerHTML = html;
  }

  /**
   * Render overall conversion rate stat
   */
  function renderOverallConversionRate(stats) {
    const rate = (stats.conversionRate * 100).toFixed(1);
    return `
      <div class="ml-metric-card">
        <div class="ml-metric-label">📊 Overall Conversion Rate</div>
        <div class="ml-metric-value primary">${rate}%</div>
        <div class="ml-metric-description">
          ${stats.totalConversions} bookings out of ${stats.totalAssessments} assessments
        </div>
      </div>
    `;
  }

  /**
   * Render recent activity stat
   */
  function renderRecentActivity(stats) {
    return `
      <div class="ml-metric-card">
        <div class="ml-metric-label">📅 Recent Activity (Last 90 Days)</div>
        <div class="ml-metric-value">${stats.recentAssessments}</div>
        <div class="ml-metric-description">
          new assessments, ${stats.recentConversions} converted to bookings
        </div>
      </div>
    `;
  }

  /**
   * Render high probability leads stat
   */
  function renderHighProbabilityLeads(stats, predictions, highProbLeads) {
    const leadsCount = highProbLeads || stats.highProbabilityCount || 0;
    const hasMLPredictions = predictions && predictions.length > 0;
    const statusText = hasMLPredictions 
      ? '✅ ML Predictions Available' 
      : 'Database Analysis';

    return `
      <div class="ml-metric-card highlight">
        <div class="ml-metric-label">🎯 High Probability Leads</div>
        <div class="ml-metric-value success">${leadsCount}</div>
        <div class="ml-metric-description">${statusText}</div>
      </div>
    `;
  }

  /**
   * Render average conversion window stat
   */
  function renderAverageConversionWindow(stats) {
    const days = stats.avgConversionDays ? stats.avgConversionDays.toFixed(1) : 'N/A';
    return `
      <div class="ml-metric-card">
        <div class="ml-metric-label">⏱️ Average Conversion Window</div>
        <div class="ml-metric-value">${days}</div>
        <div class="ml-metric-description">days from quiz to booking</div>
      </div>
    `;
  }

  /**
   * Render key insights section
   */
  function renderKeyInsights(stats) {
    if (!stats.topFactors || stats.topFactors.length === 0) {
      return '';
    }

    const factorsList = stats.topFactors
      .map(factor => `
        <li>
          <strong>${escapeHtml(factor.category)}</strong>: ${escapeHtml(factor.description)}
        </li>
      `)
      .join('');

    return `
      <div class="ml-insights-section ml-fade-in">
        <h3 class="ml-insights-title">🔍 Key Insights</h3>
        <ul class="ml-insights-list">
          ${factorsList}
        </ul>
      </div>
    `;
  }

  /**
   * Render ML predictions section
   */
  function renderMLPredictions(predictions) {
    if (!predictions || predictions.length === 0) {
      return '';
    }

    // Filter and sort high probability leads
    const highProbPredictions = predictions
      .filter(p => p.conversion_probability >= 0.7)
      .sort((a, b) => b.conversion_probability - a.conversion_probability)
      .slice(0, 9);

    if (highProbPredictions.length === 0) {
      return '';
    }

    const leadCards = highProbPredictions
      .map(prediction => {
        const probability = (prediction.conversion_probability * 100).toFixed(1);
        const email = escapeHtml(prediction.email || 'Unknown');
        const riskLevel = escapeHtml(prediction.risk_level || 'Unknown');

        return `
          <div class="ml-lead-card">
            <div class="ml-lead-email">${email}</div>
            <div class="ml-lead-probability">
              ${probability}%
              <span class="ml-lead-probability-label">likely to book</span>
            </div>
            <div class="ml-lead-risk">${riskLevel}</div>
          </div>
        `;
      })
      .join('');

    const totalHighProb = predictions.filter(p => p.conversion_probability >= 0.7).length;
    const showMoreMessage = totalHighProb > 9 
      ? `<p style="margin-top: 20px; color: #6b7280; text-align: center; font-size: 0.95rem;">
           Showing top 9 high-probability leads out of ${totalHighProb} total.
         </p>`
      : '';

    return `
      <div class="ml-leads-section ml-fade-in">
        <div class="ml-leads-header">
          <h3 class="ml-leads-title"> ML Predictions - High Priority Leads</h3>
          <p class="ml-leads-subtitle">
            These users have been predicted to have high booking probability (70%+ conversion rate):
          </p>
        </div>
        <div class="ml-leads-grid">
          ${leadCards}
        </div>
        ${showMoreMessage}
      </div>
    `;
  }

  /**
   * Render no data message
   */
  function renderNoDataMessage(container) {
    const html = `
      <div class="ml-no-data">
        <div class="ml-no-data-icon">⚠️</div>
        <h3 class="ml-no-data-title">ML Model Not Available</h3>
        <p class="ml-no-data-text">
          Conversion rate predictions require the ML Python API to be running.
        </p>
        <div class="ml-no-data-text">
          <strong>To enable predictions:</strong>
        </div>
        <div class="ml-no-data-code">
          cd ml_model<br>
          ./start_ml_api.sh
        </div>
        <div class="ml-no-data-code">
          python3 ml_api.py
        </div>
        <div class="ml-no-data-note">
          <strong>Note:</strong> The ML model predicts conversion probability based on quiz 
          results using trained models (Logistic Regression, Random Forest, etc.)
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Render error message
   */
  function renderErrorMessage(container) {
    const html = `
      <div class="ml-no-data">
        <div class="ml-no-data-icon">❌</div>
        <h3 class="ml-no-data-title">Error Loading Data</h3>
        <p class="ml-no-data-text">
          There was an error loading the conversion statistics.
        </p>
        <p class="ml-no-data-text">
          Please try refreshing the page or contact support if the problem persists.
        </p>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    if (typeof text !== 'string') {
      return text;
    }
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

})();


