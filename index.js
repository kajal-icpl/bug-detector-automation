import { chromium } from '@playwright/test';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR);
}

const GITHUB_API_URL = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/issues`;

async function captureConsoleErrors(page) {
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });
    return errors;
}

async function detectBugAndReport() {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const errors = await captureConsoleErrors(page);
    
    try {
        // Navigate to the test website
        await page.goto('https://the-internet.herokuapp.com/broken_images');
        
        // Check for broken images
        const brokenImages = await page.$$eval('img', imgs =>
            imgs.filter(img => img.naturalWidth === 0).map(img => img.src)
        );

        // Check for JavaScript errors
        const jsErrors = errors.length > 0;
        
        if (brokenImages.length > 0 || jsErrors) {
            console.log('Bugs detected!');
            
            // Take screenshot
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const screenshotPath = path.join(SCREENSHOTS_DIR, `bug_${timestamp}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });

            // Create issue description
            let description = '## Bug Report\n\n';
            
            if (brokenImages.length > 0) {
                description += '### Broken Images:\n';
                brokenImages.forEach(img => {
                    description += `- ${img}\n`;
                });
            }

            if (jsErrors) {
                description += '\n### JavaScript Errors:\n';
                errors.forEach(error => {
                    description += `- ${error}\n`;
                });
            }

            // Upload screenshot and create issue
            const imageData = fs.readFileSync(screenshotPath, { encoding: 'base64' });
            const imgUrl = await uploadImageToGitHub(imageData, `bug_${timestamp}.png`);
            description += `\n### Screenshot:\n![Bug Screenshot](${imgUrl})`;

            await createGitHubIssue('Bug Detected: Broken Elements Found', description);
        } else {
            console.log('No bugs detected.');
        }
    } catch (error) {
        console.error('Error during bug detection:', error);
        await createGitHubIssue(
            'Error in Bug Detection Script',
            `An error occurred while running the bug detection script:\n\`\`\`\n${error.stack}\n\`\`\``
        );
    } finally {
        await browser.close();
    }
}

async function uploadImageToGitHub(imageData, filename) {
    const url = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/screenshots/${filename}`;

    try {
        const response = await axios.put(url, {
            message: 'Upload bug screenshot',
            content: imageData,
            branch: 'main'
        }, {
            headers: {
                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.content.download_url;
    } catch (error) {
        console.error('Error uploading image:', error.response?.data || error.message);
        throw error;
    }
}

async function createGitHubIssue(title, body) {
    try {
        const response = await axios.post(GITHUB_API_URL, {
            title,
            body,
            labels: ['bug', 'automated']
        }, {
            headers: {
                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('GitHub issue created successfully:', response.data.html_url);
        return response.data;
    } catch (error) {
        console.error('Error creating issue:', error.response?.data || error.message);
        throw error;
    }
}

// Run the script
detectBugAndReport().catch(console.error);