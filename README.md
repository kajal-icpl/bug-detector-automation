# Bug Detector Automation

This project automatically detects bugs on web pages and creates GitHub issues with screenshots and detailed information.

## Features

- Detects broken images
- Captures JavaScript console errors
- Takes full-page screenshots
- Automatically creates GitHub issues with detailed bug reports
- Uploads screenshots to GitHub repository

## Setup

1. Clone the repository:
```bash
git clone https://github.com/kajal-icpl/bug-detector-automation.git
cd bug-detector-automation
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```env
GITHUB_TOKEN=your_personal_access_token
GITHUB_OWNER=your_github_username
GITHUB_REPO=bug-detector-automation
```

4. Install Playwright browsers:
```bash
npx playwright install chromium
```

## Usage

Run the bug detection script:
```bash
npm start
```

The script will:
1. Navigate to the test website
2. Check for broken images and JavaScript errors
3. Take a screenshot if bugs are found
4. Create a GitHub issue with the bug report and screenshot

## GitHub Issue Format

The created issues will include:
- Title indicating the type of bug found
- Description of the detected issues
- List of broken images (if any)
- JavaScript console errors (if any)
- Screenshot of the page
- Automatic "bug" and "automated" labels

## Contributing

Feel free to submit issues and enhancement requests!