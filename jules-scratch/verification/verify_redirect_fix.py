import time
from playwright.sync_api import sync_playwright, Page, expect

def run(page: Page):
    base_url = "http://localhost:3000"

    def login(page: Page):
        page.goto(f"{base_url}/login")
        page.wait_for_load_state("networkidle")
        page.get_by_label("Email").fill("test@example.com")
        page.get_by_label("Password").fill("password")
        page.get_by_role("button", name="Sign in").click()
        time.sleep(2) # wait for login to complete
        # Check if login was successful by looking for a dashboard element
        try:
            expect(page.get_by_role("heading", name="Dashboard")).to_be_visible(timeout=10000)
            print("Login successful")
        except:
            print("Login failed, attempting signup")
            signup(page)

    def signup(page: Page):
        page.goto(f"{base_url}/signup")
        page.wait_for_load_state("networkidle")
        page.get_by_label("Email").fill("test@example.com")
        page.get_by_label("Password").fill("password")
        page.get_by_role("button", name="Create account").click()
        time.sleep(2) # wait for signup to complete
        # After signup, we might be redirected to a confirmation page or login
        # For this test, we'll just try to log in again
        login(page)

    # Start with login
    login(page)

    # Navigate to a video page
    video_url = f"{base_url}/videos/wK_bksFW27g"
    page.goto(video_url, timeout=60000)
    page.wait_for_load_state("networkidle")

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
