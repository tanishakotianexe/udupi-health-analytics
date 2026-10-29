import express from 'express';
import cors from 'cors';
import multer from 'multer';
import XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;
const originalPath = path.join(__dirname, 'data', 'aarogya-data.json');
const atlasPath = path.join(__dirname, 'data', 'original-atlas-data');
const frontendDist = process.env.FRONTEND_DIST;
const upload = multer({
  dest: path.join(__dirname, 'uploads'),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(ext === '.csv' || ext === '.xlsx' || ext === '.xls' ? null : new Error('Upload a CSV or Excel file (.csv, .xlsx, .xls).'), ext === '.csv' || ext === '.xlsx' || ext === '.xls');
  }
});

const originalData = JSON.parse(fs.readFileSync(originalPath, 'utf8'));
let active = structuredClone(originalData);
let datasetSource = 'original';
let lastUpdated = new Date().toISOString();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const facilityAliases = {
  name: ['name','facility','facility_name','facility name','hospital','hospital_name','hospital name'],
  type: ['type','facility_type','facility type','category'],
  taluk: ['taluk','area','subdistrict','sub_district'],
  address: ['address','location','facility_address'],
  lon: ['lon','longitude','lng','long'],
  lat: ['lat','latitude'],
  beds: ['beds','bed_capacity','bed capacity','total_beds','total beds'],
  ownership: ['ownership','owner','facility_ownership','provider']
};
const normalizeKey = (v) => String(v ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
function normalizeFacility(row, index) {
  const mapped = {};
  const entries = Object.entries(row);
  for (const [field, aliases] of Object.entries(facilityAliases)) {
    const found = entries.find(([key]) => aliases.map(normalizeKey).includes(normalizeKey(key)));
    if (found) mapped[field] = found[1];
  }
  const name = String(mapped.name ?? '').trim();
  const lat = Number(mapped.lat), lon = Number(mapped.lon), beds = Number(mapped.beds ?? 0);
  if (!name) throw new Error(`Row ${index + 2}: facility name is required.`);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error(`Row ${index + 2}: valid latitude and longitude are required for mapping.`);
  }
  if (!Number.isFinite(beds) || beds < 0) throw new Error(`Row ${index + 2}: beds must be a non-negative number.`);
  const ownershipRaw = String(mapped.ownership ?? 'Unknown').trim();
  const ownership = /gov/i.test(ownershipRaw) ? 'Government' : /private/i.test(ownershipRaw) ? 'Private' : ownershipRaw || 'Unknown';
  return {
    id: index, name, type: String(mapped.type ?? 'Unspecified').trim() || 'Unspecified',
    taluk: String(mapped.taluk ?? 'Unspecified').trim() || 'Unspecified',
    address: String(mapped.address ?? '').trim(), lon, lat, beds, ownership,
    source: 'User upload'
  };
}
function readRows(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  if (ext === '.csv') {
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    const lines = raw.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) throw new Error('The uploaded file has a header row and at least one data row.');
    const parse = (line) => {
      const cells=[]; let value='', quoted=false;
      for (let i=0;i<line.length;i++) {
        const ch=line[i];
        if (ch === '"' && line[i+1] === '"' && quoted) { value+='"'; i++; }
        else if (ch === '"') quoted=!quoted;
        else if (ch === ',' && !quoted) { cells.push(value); value=''; }
        else value+=ch;
      }
      cells.push(value); return cells;
    };
    const headers = parse(lines[0]).map(v=>v.trim());
    return lines.slice(1).map(line => Object.fromEntries(parse(line).map((v,i)=>[headers[i] || `column_${i+1}`,v])));
  }
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error('The workbook does not contain a readable worksheet.');
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}
app.get('/api/health', (_req,res) => res.json({ status:'ok', service:'udupi-health-api' }));
app.get('/api/data', (_req,res) => res.json({
  ...active, datasetSource, lastUpdated,
  facilityCount: active.facilities.length,
  bedTotal: active.facilities.reduce((sum,f)=>sum+(Number(f.beds)||0),0),
  taluks: [...new Set(active.facilities.map(f=>f.taluk).filter(Boolean))].sort()
}));
app.get('/api/template', (_req,res) => {
  const rows = [['name','type','taluk','address','lat','lon','beds','ownership'],
    ['Example Community Health Centre','CHC','Udupi','Udupi district',13.3409,74.7421,30,'Government']];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Facilities');
  const buffer = XLSX.write(wb, { type:'buffer', bookType:'xlsx' });
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition','attachment; filename="udupi-health-template.xlsx"');
  res.send(buffer);
});
app.post('/api/upload', upload.single('dataset'), (req,res) => {
  let filePath = req.file?.path;
  try {
    if (!req.file) return res.status(400).json({ error:'Choose a CSV or Excel file to upload.' });
    const rows = readRows(filePath, req.file.originalname);
    if (!rows.length) return res.status(400).json({ error:'No data rows were found in the uploaded file.' });
    const facilities = rows.map(normalizeFacility);
    active = { facilities, capacityRegister: facilities.map(({name,taluk,type,beds,ownership})=>({name,taluk,type,beds,ownership})), history: originalData.history, years: originalData.years };
    datasetSource = 'upload'; lastUpdated = new Date().toISOString();
    res.json({ message:`Loaded ${facilities.length} facilities successfully.`, facilityCount:facilities.length, dataSource:datasetSource });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not process the uploaded file.' });
  } finally {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
});
app.post('/api/reset', (_req,res) => {
  active = structuredClone(originalData); datasetSource='original'; lastUpdated=new Date().toISOString();
  res.json({ message:'Restored the original Udupi dataset.', facilityCount:active.facilities.length, dataSource:datasetSource });
});
if (frontendDist && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req,res,next) => {
    if (req.path === '/api' || req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}
app.use((err,_req,res,_next) => res.status(err instanceof multer.MulterError ? 400 : 400).json({ error:err.message || 'Request failed.' }));
app.listen(PORT, '0.0.0.0', () => console.log(`Udupi Health API listening on ${PORT}`));
