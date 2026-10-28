const EDITABLE_FIELDS = [
  "title",
  "issueSummary",
  "recommendedDepartment",
  "recommendedTools",
  "recommendedSteps",
  "safetyPrecautions",
  "estimatedDuration",
  "suggestedPriority",
  "assignedTeam",
  "status",
];

function sameEditableValues(previous, next) {
  return EDITABLE_FIELDS.every(field => JSON.stringify(previous[field] ?? null) === JSON.stringify(next[field] ?? null));
}

export async function saveApprovedWorkOrder({ db, complaintId, data, user, expectedUpdatedAt = null, now = new Date().toISOString() }) {
  const ref = db.collection("workOrders").doc(complaintId);

  return db.runTransaction(async transaction => {
    const existing = await transaction.get(ref);
    if (existing.exists) {
      const previous = existing.data();
      const versionMatches = expectedUpdatedAt && expectedUpdatedAt === previous.updatedAt;
      if (!versionMatches) {
        if (sameEditableValues(previous, data)) return { workOrder: previous, unchanged: true };
        return { conflict: true };
      }

      const updated = {
        ...previous,
        ...data,
        id: complaintId,
        createdAt: previous.createdAt || now,
        approvedAt: previous.approvedAt || now,
        approvedBy: previous.approvedBy || { uid: user.uid, email: user.email },
      };
      transaction.update(ref, {
        ...data,
        id: complaintId,
        createdAt: updated.createdAt,
        approvedAt: updated.approvedAt,
        approvedBy: updated.approvedBy,
      });
      return { workOrder: updated, unchanged: false };
    }

    if (expectedUpdatedAt) return { conflict: true };

    const created = {
      ...data,
      id: complaintId,
      createdAt: now,
      approvedAt: now,
      approvedBy: { uid: user.uid, email: user.email },
    };
    transaction.create(ref, created);
    return { workOrder: created, unchanged: false };
  });
}
