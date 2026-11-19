
/**
 * FAULTLINE — SPOF Analyzer
 * Compatible with browser and Node.js.
 */

(function (root) {
  const engine = typeof module !== "undefined" && module.exports
    ? require("./engine.js")
    : root.FaultlineEngine;

  function analyzeSinglePointsOfFailure() {
    if (!engine) {
      throw new Error("FAULTLINE engine is not loaded");
    }

    const process = engine.getProcess();
    const nodes = process.nodes;

    const results = nodes.map(node => {
      const blocked = new Set([node.id]);
      let changed = true;

      while (changed) {
        changed = false;

        for (const candidate of nodes) {
          if (blocked.has(candidate.id)) continue;

          if (candidate.requires.some(id => blocked.has(id))) {
            blocked.add(candidate.id);
            changed = true;
          }
        }
      }

      const downstream = nodes.filter(
        item => blocked.has(item.id) && item.id !== node.id
      );

      const count = downstream.length;

      let severity = "LOW";
      if (count >= 3) severity = "CRITICAL";
      else if (count === 2) severity = "HIGH";
      else if (count === 1) severity = "MODERATE";

      return {
        nodeId: node.id,
        nodeName: node.name,
        owner: node.owner,
        blockedCount: count,
        blockedSteps: downstream.map(item => item.name),
        severity,
        isSinglePointOfFailure: count > 0
      };
    });

    const risks = results
      .filter(item => item.isSinglePointOfFailure)
      .sort((a, b) => b.blockedCount - a.blockedCount);

    return {
      process: process.name,
      totalNodes: nodes.length,
      identifiedRisks: risks.length,
      criticalNodes: risks.filter(
        item => item.severity === "CRITICAL"
      ).length,
      risks
    };
  }

  const api = { analyzeSinglePointsOfFailure };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.FaultlineAnalysis = api;
})(typeof window !== "undefined" ? window : globalThis);
