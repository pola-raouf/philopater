const Analytics = require('../Models/analyticsSchema');

const countries = ['China', 'India', 'Italy', 'Spain', 'Thailand', 'Tunisia'];

async function initializeAnalytics() {
  for (let country of countries) {
    await Analytics.updateOne(
      { country },
      { $setOnInsert: { purchases: 0 } },
      { upsert: true }
    );
  }
}
initializeAnalytics();
