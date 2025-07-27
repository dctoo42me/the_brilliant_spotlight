import fs from 'fs/promises';
import path from 'path';

const API_KEY = 'the-brilliant-spotlight-123';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(403).send('Unauthorized');
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'businesses.json');
    const content = await fs.readFile(filePath, 'utf8');
    const businesses = JSON.parse(content);

    const newBusiness = req.body;
    if (!newBusiness.name || !newBusiness.image || !newBusiness.website) {
      return res.status(400).send('Missing required fields');
    }

    newBusiness.id = businesses.length ? Math.max(...businesses.map(b => b.id)) + 1 : 1;
    businesses.push(newBusiness);

    await fs.writeFile(filePath, JSON.stringify(businesses, null, 2));
    res.status(201).json(newBusiness);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to save data');
  }
}
