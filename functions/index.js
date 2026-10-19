const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

exports.recordKerbalistCounter = onCall(
  { enforceAppCheck: true, maxInstances: 5 },
  async (request) => {
    if (!request.app) {
      throw new HttpsError('failed-precondition', 'App Check required.');
    }

    const fields = {
      planner_visit: 'plannerVisits',
      transfer_planned: 'transfersPlanned',
      window_planner_opened: 'windowPlannerOpens'
    };

    const field = fields[request.data?.event];
    if (!field) {
      throw new HttpsError('invalid-argument', 'Unknown event.');
    }

    await db.collection('communityStats').doc('main').set({
      [field]: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    return { ok: true };
  }
);
