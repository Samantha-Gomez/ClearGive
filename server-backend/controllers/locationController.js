const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const csvPath = path.join(__dirname, '..', 'data', 'pangasinan-locations.csv');

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');

const locations = parse(fs.readFileSync(csvPath, 'utf8'), {
  columns: true,
  skip_empty_lines: true,
  bom: true,
  relax_column_count: false,
})
  .map((record) => ({
    barangayPsgcCode: normalize(record.barangay_psgc_code),
    barangay: normalize(record.barangay),
    municipalityCity: normalize(record.municipality_city),
    province: normalize(record.province),
  }))
  .filter(
    (record) =>
      record.barangayPsgcCode &&
      record.barangay &&
      record.municipalityCity &&
      record.province,
  );

const uniqueSorted = (values) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

const getQueryValue = (value) => (typeof value === 'string' ? value.trim() : '');

const getProvinces = (req, res) => {
  res.json({ provinces: uniqueSorted(locations.map((location) => location.province)) });
};

const getCities = (req, res) => {
  const province = getQueryValue(req.query.province);
  if (!province) {
    return res.status(400).json({ message: 'The province query parameter is required.' });
  }

  const matches = locations.filter((location) => location.province === province);
  if (!matches.length) {
    return res.status(404).json({ message: 'No locations found for the selected province.' });
  }

  return res.json({ province, cities: uniqueSorted(matches.map((location) => location.municipalityCity)) });
};

const getBarangays = (req, res) => {
  const province = getQueryValue(req.query.province);
  const city = getQueryValue(req.query.city);
  if (!province || !city) {
    return res.status(400).json({ message: 'The province and city query parameters are required.' });
  }

  const matches = locations.filter(
    (location) => location.province === province && location.municipalityCity === city,
  );
  if (!matches.length) {
    return res.status(404).json({ message: 'No barangays found for the selected province and city.' });
  }

  return res.json({
    province,
    city,
    barangays: matches
      .map((location) => ({ name: location.barangay, psgcCode: location.barangayPsgcCode }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  });
};

module.exports = { getProvinces, getCities, getBarangays };
