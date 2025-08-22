import time
from playwright.sync_api import sync_playwright, Page, expect

def run(page: Page):
    base_url = "http://localhost:3000"

    page.goto(f"{base_url}/login", timeout=60000)
    page.get_by_label("Email").fill("test@example.com")
    page.get_by_label("Password").fill("password")
    page.get_by_role("button", name="Login").click()

    # Wait for navigation to the dashboard
    expect(page).to_have_url(f"{base_url}/dashboard", timeout=10000)
    print("Login successful, redirected to dashboard.")

    # Navigate to a video page
    video_url = f"{base_url}/videos/wK_bksFW27g"
    page.goto(video_url, timeout=60000)

    # Take a screenshot of the video page
    page.screenshot(path="jules-scratch/verification/video_page.png")
    print("Took screenshot of the video page")

    # Simulate switching tabs
    new_page = page.context.new_page()
    new_page.goto("https://www.google.com")
    time.sleep(2)
    page.bring_to_front()
    time.sleep(2)

    # Take another screenshot to verify no redirect
    page.screenshot(path="jules-scratch/verification/video_page_after_tab_switch.png")
    print("Took screenshot after tab switch")

    # Verify we are still on the video page
    expect(page).to_have_url(video_url)
    print("URL check after tab switch successful")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run(page)
        browser.close()

if __name__ == "__main__":
    main()
