// Vercel serverless function for health check
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    platform: 'Vercel',
    message: 'Fitness Tracker API is running on Vercel'
  });
}
