import { i18nObject } from "../app/i18n/i18n-util"
import { loadLocale } from "../app/i18n/i18n-util.sync"
import { goBack, selector } from "./utils"
import { payInvoice } from "./utils/graphql"

describe("Receive Payment Flow", async () => {
  loadLocale("en")
  const LL = i18nObject("en")
  const timeout = 30000
  let invoice: string

  it("Click 'Back Home' on the stablesats tutorial modal", async () => {
    try {
      const backHomeButton = await $(selector(LL.common.backHome(), "Button"))
      await backHomeButton.waitForDisplayed({ timeout: 5000 })
      if (await backHomeButton.isDisplayed()) {
        await backHomeButton.click()
      } else {
        expect(await backHomeButton.isDisplayed()).toBeFalsy()
      }
    } catch (e) {
      expect(false).toBeFalsy()
    }
  })

  it("Click Receive", async () => {
    const receiveButton = await $(selector(LL.MoveMoneyScreen.receive(), "Other"))
    await receiveButton.waitForDisplayed({ timeout })
    await receiveButton.click()
  })

  it("Click Copy Invoice to prompt for notification permission popup", async () => {
    let copyInvoiceButton
    if (process.env.E2E_DEVICE === "ios") {
      copyInvoiceButton = await $('(//XCUIElementTypeOther[@name="Copy Invoice"])[2]')
    } else {
      copyInvoiceButton = await $(selector("Copy Invoice", "Button"))
    }
    await copyInvoiceButton.waitForDisplayed({ timeout })
    await copyInvoiceButton.click()
  })

  it("Get Invoice from clipboard to prompt for notification permission popup", async () => {
    await browser.pause(800)
    const invoiceBase64 = await browser.getClipboard()
    invoice = Buffer.from(invoiceBase64, "base64").toString()
  })

  it("Click OK to allow push notifications", async () => {
    try {
      if (process.env.E2E_DEVICE === "android") {
        const okButton = await $(selector(LL.common.ok(), "Button"))
        await okButton.waitForDisplayed({ timeout: 8000 })
        await okButton.click()
      }
      const allowButton = await $(selector("Allow", "Button"))
      await allowButton.waitForDisplayed({ timeout: 8000 })
      await allowButton.click()
    } catch (e) {
      // keep going, it might have already been clicked
    }
  })

  it("Click Copy Invoice", async () => {
    let copyInvoiceButton
    if (process.env.E2E_DEVICE === "ios") {
      copyInvoiceButton = await $('(//XCUIElementTypeOther[@name="Copy Invoice"])[2]')
    } else {
      copyInvoiceButton = await $(selector("Copy Invoice", "Button"))
    }
    await copyInvoiceButton.waitForDisplayed({ timeout })
    await copyInvoiceButton.click()
  })

  it("Get Invoice from clipboard (android) or share link (ios)", async () => {
    await browser.pause(2000)
    if (process.env.E2E_DEVICE === "ios") {
      // on ios, get invoice from share link because copy does not
      // work on physical device for security reasons
      const shareButton = await $('(//XCUIElementTypeOther[@name="Share Invoice"])[2]')
      await shareButton.waitForDisplayed({ timeout: 8000 })
      await shareButton.click()
      const invoiceSharedScreen = await $('//*[contains(@name,"lntbs")]')
      await invoiceSharedScreen.waitForDisplayed({
        timeout: 8000,
      })
      invoice = await invoiceSharedScreen.getAttribute("name")
      const closeShareButton = await $(selector("Close", "Button"))
      await closeShareButton.waitForDisplayed({ timeout: 8000 })
      await closeShareButton.click()
    } else {
      // get from clipboard in android
      const invoiceBase64 = await browser.getClipboard()
      invoice = Buffer.from(invoiceBase64, "base64").toString()
    }
  })

  it("External User Pays the Invoice through API", async () => {
    const payResult = await payInvoice(invoice)
    expect(payResult).toBeTruthy()
  })

  it("Wait for Green check", async () => {
    const successCheck = await $(selector("Success Icon", "Other"))
    await successCheck.waitForDisplayed({ timeout })
    expect(await successCheck.isDisplayed()).toBeTruthy()
  })

  it("go back to main screen", async () => {
    const backButton = await $(goBack())
    await backButton.waitForDisplayed({ timeout })
    await backButton.click()
    await browser.pause(2000)
  })
})
