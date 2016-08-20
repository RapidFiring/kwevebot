'use strict';

const mongoose = require('mongoose');

let schema = new mongoose.Schema({
  jobID: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  installerID: String,
  installerName: {
    type: String,
    index: true
  },
  facilityID: String,
  solarSystemID: String,
  solarSystemName: String,
  stationID: String,
  activityID: Number,
  blueprintID: String,
  blueprintTypeID: String,
  blueprintTypeName: String,
  blueprintLocationID: String,
  outputLocationID: String,
  runs: String,
  cost: String,
  teamID: String,
  licensedRuns: String,
  probability: String,
  productTypeID: String,
  productTypeName: String,
  status: String,
  timeInSeconds: Number,
  startDate: String,
  startDateInt: {
    type: Number,
    index: true
  },
  endDate: String,
  endDateInt: {
    type: Number,
    index: true
  },
  completedDate: String,
  completedCharacterID: String,
  successfulRuns: Number,
});

schema.index({
  startDateInt: 1,
  endDateInt: -1,
});

module.exports = mongoose.model('JobHistory', schema);
