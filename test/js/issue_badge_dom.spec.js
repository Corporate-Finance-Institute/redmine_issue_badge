// Copyright 2026 Corporate Finance Institute
// SPDX-License-Identifier: GPL-2.0-or-later

const path = require('node:path')
const { test, expect } = require('@playwright/test')

const scriptPath = path.resolve(__dirname, '../../assets/javascripts/issue_badge.js')

async function installBadgeRoutes(page) {
  await page.route('http://redmine.test/issue_badge', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: true,
        all_issues_count: 7,
        badge_color: 'red',
        content_path: 'http://redmine.test/issue_badge/load'
      })
    })
  })

  await page.route('http://redmine.test/issue_badge/load', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<div id="issue_badge_contents"><button id="popup-inside">inside</button></div>'
    })
  })
}

test('mounts in the Redmine 7 profile menu and survives responsive relocation', async ({ page }) => {
  await installBadgeRoutes(page)
  await page.setViewportSize({ width: 1200, height: 800 })
  await page.setContent(`
    <base href="http://redmine.test/">
    <body>
      <nav id="top-menu">
        <div class="profile-menu"><div id="account"></div></div>
      </nav>
      <div id="quick-search"><form></form></div>
    </body>
  `)
  await page.addScriptTag({ path: scriptPath })
  await page.evaluate(() => loadBadge('http://redmine.test/issue_badge'))

  await expect(page.locator('#issue_badge_number')).toHaveText('7')
  await expect(page.locator('#top-menu .profile-menu > #issue_badge')).toHaveCount(1)
  await expect(page.locator('#issue_badge + #account')).toHaveCount(1)

  await page.click('#link_issue_badge')
  await expect(page.locator('#popup-inside')).toBeVisible()
  await page.click('#popup-inside')
  await expect(page.locator('#issue_badge_contents')).toHaveCount(1)

  await page.setViewportSize({ width: 800, height: 800 })
  await expect(page.locator('#quick-search > #issue_badge')).toHaveCount(1)

  await page.setViewportSize({ width: 1200, height: 800 })
  await expect(page.locator('#top-menu .profile-menu > #issue_badge')).toHaveCount(1)
})

test('retains the legacy Redmine loggedas mount', async ({ page }) => {
  await installBadgeRoutes(page)
  await page.setViewportSize({ width: 1200, height: 800 })
  await page.setContent(`
    <base href="http://redmine.test/">
    <body>
      <div id="account"><span id="loggedas"></span><span id="legacy-tail"></span></div>
      <div id="quick-search"><form></form></div>
    </body>
  `)
  await page.addScriptTag({ path: scriptPath })
  await page.evaluate(() => loadBadge('http://redmine.test/issue_badge'))

  await expect(page.locator('#issue_badge_number')).toHaveText('7')
  await expect(page.locator('#loggedas + #issue_badge')).toHaveCount(1)
})
