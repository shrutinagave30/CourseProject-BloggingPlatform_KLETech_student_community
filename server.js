from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from webdriver_manager.chrome import ChromeDriverManager
import os
import time

# Ensure your server is running on http://localhost:3000 before running this script

# Initialize WebDriver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))

try:
    print("Starting Register and Add Blog Test...")

    # Verify server is running
    driver.get("http://localhost:3000")
    WebDriverWait(driver, 10).until(EC.title_contains("Your Expected Page Title"))  # Adjust this if necessary
    
    # Navigate to the registration page
    driver.get("http://localhost:3000/register")

    # Fill in the registration form
    driver.find_element(By.XPATH, '//input[@placeholder="Enter username"]').send_keys("01fe23bcs428")
    driver.find_element(By.XPATH, '//input[@placeholder="example@kletech.ac.in"]').send_keys("01fe23bcs428@kletech.ac.in")
    driver.find_element(By.XPATH, '//input[@placeholder="6+ strong character"]').send_keys("123456")
    driver.find_element(By.XPATH, '//input[@placeholder="Confirm password"]').send_keys("123456")

    # Click the Register button
    register_button = driver.find_element(By.XPATH, '//button[text()="Register"]')
    driver.execute_script("arguments[0].scrollIntoView(true);", register_button)
    WebDriverWait(driver, 10).until(EC.element_to_be_clickable(register_button))
    driver.execute_script("arguments[0].click();", register_button)

    # Wait for redirection to the dashboard or add story page
    WebDriverWait(driver, 15).until(EC.url_changes("http://localhost:3000/register"))

    # Navigate to the Add Story page directly
    driver.get("http://localhost:3000/addstory")
    print("Navigated to Add Story page.")

    # Fill in the blog details
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "title"))).send_keys("My Test Story")

    # Locate the CKEditor and add content
    ckeditor_frame = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CLASS_NAME, "ck-editor__editable")))
    ActionChains(driver).move_to_element(ckeditor_frame).click().send_keys("This is a test content for the story.").perform()

    # Upload an image
    image_input = driver.find_element(By.XPATH, '//input[@type="file"]')
    
    # Ensure you use a valid file path
    image_path = os.path.abspath(r"C:\Users\shrut\OneDrive\Desktop\testing\BLOG.png")  # Use raw string to avoid escape characters
    image_input.send_keys(image_path)
    print("Image uploaded successfully.")

    # Click the Publish button
    publish_button = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.XPATH, '//button[text()="Publish "]')))
    driver.execute_script("arguments[0].scrollIntoView(true);", publish_button)
    driver.execute_script("arguments[0].click();", publish_button)
    print("Publish button clicked.")

    # Verify redirection to the desired URL after publishing
    WebDriverWait(driver, 15).until(EC.url_to_be("http://localhost:3000/"))
    print("Redirected to blog list page after publishing.")

except Exception as e:
    print(f"Test failed: {e}")

    # Capture a screenshot for debugging
    screenshot_path = os.path.abspath("error_screenshot.png")
    driver.save_screenshot(screenshot_path)
    print(f"Screenshot saved at {screenshot_path}")

finally:
    driver.quit()
    print("Test finished.")
    print("Browser closed.")
