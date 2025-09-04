import { spawn } from 'child_process';
import express from 'express';

const app = express();
const port = process.env.PORT || 5000;

// Start the automation script as a child process
console.log('🚀 Starting Email to Jira Automation...');
const automation = spawn('node', ['automation.js'], {
  stdio: 'inherit',
  env: process.env
});

automation.on('error', (error) => {
  console.error('❌ Failed to start automation:', error);
});

automation.on('exit', (code) => {
  console.log(`📋 Automation process exited with code ${code}`);
  if (code !== 0) {
    console.log('🔄 Restarting automation in 10 seconds...');
    setTimeout(() => {
      const newAutomation = spawn('node', ['automation.js'], {
        stdio: 'inherit',
        env: process.env
      });
    }, 10000);
  }
});

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'running', 
    service: 'Email to Jira Automation',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Email to Jira Automation Service',
    status: 'running',
    description: 'Background service processing emails and creating Jira tasks',
    health_check: '/health'
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🌐 Health check server running on port ${port}`);
  console.log(`📧 Email automation is running in the background`);
});