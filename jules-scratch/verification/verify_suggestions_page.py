from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Go to the login page and take a screenshot
        page.goto("http://localhost:3000/login")
        page.screenshot(path="jules-scratch/verification/login-page.png")

        # Log in
        page.fill("input[name='email']", "sharjeelaslam96@gmail.com")
        page.fill("input[name='password']", "1234567")
        page.click("button[type='submit']")

        # Wait for navigation to the dashboard
        page.wait_for_url("http://localhost:3000/dashboard")

        # Go to the suggestions page
        page.goto("http://localhost:3000/suggestions")

        # Wait for the content to load
        page.wait_for_selector("text=Content Ideas")

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/suggestions-page-authenticated.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
