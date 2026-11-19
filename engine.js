
/**
 * FAULTLINE — Operational Resilience Engine
 * Deterministic business process failure simulator.
 * Demo data only. Not a production risk assessment.
 */

const FaultlineEngine = (() => {
  const processDefinition = {
    name: "Purchase approval",
    nodes: [
      {
        id: "request",
        name: "Purchase request",
        owner: "Employee",
        requires: []
      },
      {
        id: "manager",
        name: "Manager approval",
        owner: "Manager",
        requires: ["request"]
      },
      {
        id: "finance",
        name: "Finance approval",
        owner: "Finance",
        requires: ["manager"]
      },
      {
        id: "erp",
        name: "ERP registration",
        owner: "ERP system",
        requires: ["finance"]
      },
      {
        id: "payment",
        name: "Payment",
        owner: "Finance team",
        requires: ["erp"]
      }
    ]
  };

  const failureTypes = {
    manager_unavailable: {
      label: "Manager unavailable",
      target: "manager",
      category: "people"
    },
    finance_unavailable: {
      label: "Finance approver unavailable",
      target: "finance",
      category: "people"
    },
    erp_offline: {
      label: "ERP system offline",
      target: "erp",
      category: "technology"
    },
    supplier_missing: {
      label: "Supplier unavailable",
      target: "payment",
      category: "supplier"
    }
  };

  function simulate(failureId) {
    const failure = failureTypes[failureId];

    if (!failure) {
      throw new Error("Unknown failure scenario: " + failureId);
    }

    const blocked = new Set([failure.target]);
    let changed = true;

    // Propagate failure through dependent process steps.
    while (changed) {
      changed = false;

      for (const node of processDefinition.nodes) {
        if (blocked.has(node.id)) continue;

        if (node.requires.some(id => blocked.has(id))) {
          blocked.add(node.id);
          changed = true;
        }
      }
    }

    const affected = processDefinition.nodes
      .filter(node => blocked.has(node.id))
      .map(node => ({
        id: node.id,
        name: node.name,
        owner: node.owner
      }));

    const total = processDefinition.nodes.length;
    const impactPercent = Math.round((affected.length / total) * 100);

    const recommendations = {
      manager_unavailable: [
        "Assign a formally approved deputy manager.",
        "Document delegated approval authority.",
        "Test the backup approval route."
      ],
      finance_unavailable: [
        "Define a secondary finance approver.",
        "Establish an escalation deadline.",
        "Review segregation-of-duties requirements."
      ],
      erp_offline: [
        "Define a controlled manual registration procedure.",
        "Document recovery and reconciliation steps.",
        "Test the ERP outage recovery process."
      ],
      supplier_missing: [
        "Identify an approved alternative supplier.",
        "Document supplier substitution criteria.",
        "Test the procurement contingency route."
      ]
    };

    return {
      process: processDefinition.name,
      scenario: failure.label,
      category: failure.category,
      status: affected.length > 0 ? "AT_RISK" : "CLEAR",
      impactPercent,
      affectedCount: affected.length,
      totalSteps: total,
      affected,
      recommendations: recommendations[failureId],
      generatedAt: new Date().toISOString()
    };
  }

  function getScenarios() {
    return Object.entries(failureTypes).map(([id, item]) => ({
      id,
      label: item.label,
      category: item.category
    }));
  }

  function getProcess() {
    return JSON.parse(JSON.stringify(processDefinition));
  }

  return {
    simulate,
    getScenarios,
    getProcess
  };
})();

if (typeof window !== "undefined") {
  window.FaultlineEngine = FaultlineEngine;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = FaultlineEngine;
}
