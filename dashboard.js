
/**
 * FAULTLINE — Interactive Risk Dashboard
 * Uses the deterministic simulation and SPOF engines.
 */

(function () {
  const engine = window.FaultlineEngine;
  const analysis = window.FaultlineAnalysis;

  if (!engine || !analysis) {
    console.error("FAULTLINE modules failed to load.");
    return;
  }

  const style = document.createElement("style");
  style.textContent = `
    #faultline-live {
      margin: 32px auto;
      max-width: 1100px;
      padding: 24px;
      color: #e8edf5;
      background: #111827;
      border: 1px solid #334155;
      border-radius: 16px;
      font-family: Arial, sans-serif;
    }
    #faultline-live h2 { margin-top: 0; }
    #faultline-live .fl-muted { color: #94a3b8; }
    #faultline-live .fl-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit,minmax(160px,1fr));
      gap: 12px;
      margin: 20px 0;
    }
    #faultline-live .fl-card {
      padding: 16px;
      border-radius: 12px;
      background: #1e293b;
      border: 1px solid #334155;
    }
    #faultline-live .fl-number {
      font-size: 28px;
      font-weight: 700;
      margin-top: 8px;
    }
    #faultline-live select,
    #faultline-live button {
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #475569;
      font-size: 14px;
    }
    #faultline-live select {
      background: #0f172a;
      color: white;
      max-width: 100%;
    }
    #faultline-live button {
      background: #38bdf8;
      color: #082f49;
      font-weight: 700;
      cursor: pointer;
    }
    #faultline-live .fl-risk {
      padding: 14px;
      margin: 10px 0;
      background: #1e293b;
      border-radius: 9px;
      border-left: 4px solid #64748b;
    }
    #faultline-live .CRITICAL { border-left-color: #ef4444; }
    #faultline-live .HIGH { border-left-color: #f97316; }
    #faultline-live .MODERATE { border-left-color: #eab308; }
    #faultline-live .LOW { border-left-color: #22c55e; }
    #faultline-live .fl-section { margin-top: 28px; }
    #faultline-live li { margin: 8px 0; }
  `;
  document.head.appendChild(style);

  const root = document.createElement("section");
  root.id = "faultline-live";

  root.innerHTML = `
    <h2>FAULTLINE / Operational Resilience</h2>
    <p class="fl-muted">
      Business process failure simulation and dependency analysis
    </p>

    <div class="fl-grid" id="fl-metrics"></div>

    <div class="fl-section">
      <h3>Failure simulation</h3>
      <p class="fl-muted">
        Select a failure and calculate its downstream impact.
      </p>
      <select id="fl-scenario"></select>
      <button id="fl-run">Run simulation</button>
      <div id="fl-simulation-result"></div>
    </div>

    <div class="fl-section">
      <h3>Single Point of Failure analysis</h3>
      <div id="fl-spof-results"></div>
    </div>

    <div class="fl-section">
      <h3>Recovery recommendations</h3>
      <div id="fl-recommendations" class="fl-card">
        Run a simulation to see recommendations.
      </div>
    </div>

    <p class="fl-muted">
      Demo model using synthetic data. Results are illustrative,
      not a production risk assessment.
    </p>
  `;

  document.body.appendChild(root);

  const scenarioSelect = root.querySelector("#fl-scenario");
  const metrics = root.querySelector("#fl-metrics");
  const simulationResult = root.querySelector("#fl-simulation-result");
  const spofResults = root.querySelector("#fl-spof-results");
  const recommendations = root.querySelector("#fl-recommendations");

  function addOption(item) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.label;
    scenarioSelect.appendChild(option);
  }

  engine.getScenarios().forEach(addOption);

  function renderMetrics(report) {
    metrics.innerHTML = "";

    const cards = [
      ["Process steps", report.totalNodes],
      ["Identified SPOFs", report.identifiedRisks],
      ["Critical dependencies", report.criticalNodes]
    ];

    cards.forEach(([label, value]) => {
      const card = document.createElement("div");
      card.className = "fl-card";

      const heading = document.createElement("div");
      heading.className = "fl-muted";
      heading.textContent = label;

      const number = document.createElement("div");
      number.className = "fl-number";
      number.textContent = value;

      card.append(heading, number);
      metrics.appendChild(card);
    });
  }

  function renderSpof(report) {
    spofResults.innerHTML = "";

    report.risks.forEach(risk => {
      const card = document.createElement("div");
      card.className = "fl-risk " + risk.severity;

      const heading = document.createElement("strong");
      heading.textContent = risk.nodeName + " — " + risk.severity;

      const detail = document.createElement("p");
      detail.textContent =
        "Owner: " + risk.owner +
        ". Downstream steps blocked: " + risk.blockedCount + ".";

      const list = document.createElement("ul");

      risk.blockedSteps.forEach(step => {
        const item = document.createElement("li");
        item.textContent = step;
        list.appendChild(item);
      });

      card.append(heading, detail, list);
      spofResults.appendChild(card);
    });

    if (!report.risks.length) {
      spofResults.textContent = "No downstream dependencies detected.";
    }
  }

  function runSimulation() {
    const result = engine.simulate(scenarioSelect.value);

    simulationResult.innerHTML = "";

    const card = document.createElement("div");
    card.className = "fl-card";

    const title = document.createElement("h4");
    title.textContent = result.scenario;

    const impact = document.createElement("div");
    impact.className = "fl-number";
    impact.textContent = result.impactPercent + "%";

    const detail = document.createElement("p");
    detail.textContent =
      result.affectedCount + " of " + result.totalSteps +
      " process steps affected.";

    const status = document.createElement("p");
    status.textContent = "Status: " + result.status;

    card.append(title, impact, detail, status);
    simulationResult.appendChild(card);

    recommendations.innerHTML = "";
    const list = document.createElement("ul");

    result.recommendations.forEach(text => {
      const item = document.createElement("li");
      item.textContent = text;
      list.appendChild(item);
    });

    recommendations.appendChild(list);
  }

  root.querySelector("#fl-run").addEventListener("click", runSimulation);

  const report = analysis.analyzeSinglePointsOfFailure();
  renderMetrics(report);
  renderSpof(report);
  runSimulation();
})();
