import { test, expect, request } from '@playwright/test';
import tags from '../test-data/tags.json'

test.beforeEach( async ({ page }) => {

  await page.route('*/**/api/tags', async route => {
    await route.fulfill({
      body: JSON.stringify(tags)
    })
  })

  await page.goto('https://conduit.bondaracademy.com/')
  await page.getByText('Sign in').click()
  await page.getByRole('textbox', {name: 'Email'}).fill('test100%@test.com')
  await page.getByRole('textbox', {name: 'Password'}).fill('1234qwer')
  await page.getByRole('button').click()
})

test('has title', async ({ page }) => {
  await page.route('*/**/api/articles*', async route => {
    const response = await route.fetch()
    const responseBody = await response.json()
    responseBody.articles[0].title = 'This is a MOCK test title'
    responseBody.articles[0].description = 'This is a MOCK description'

    await route.fulfill({
      body: JSON.stringify(responseBody)
    })
  })

  await page.getByText('Global Feed').click()

  await expect(page.locator('.navbar-brand')).toHaveText('conduit');
  await expect(page.locator('app-article-list h1').first()).toContainText('This is a MOCK test title')
  await expect(page.locator('app-article-list p').first()).toContainText('This is a MOCK description')
});

test('Delete article', async ({ page, request }) => {
  const response = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
    data: {
      "user":{"email":"test100%@test.com","password":"1234qwer"}
    }
  })
  const responseBody = await response.json()
  const accessToken = responseBody.user.token

  const articleResponse = await request.post('https://conduit-api.bondaracademy.com/api/articles/', {
    data: {
      "article":{"title":"This is a test article","description":"This is a description","body":"This is a body","tagList":[]}
    },
    headers: {
      authorization: `Token ${accessToken}`
    }
  })
  expect(articleResponse.status()).toEqual(201)

  await page.getByText('Global Feed').click()
  await page.getByText('This is a test article').click()
  await page.getByRole('button', {name: 'Delete Article'}).first().click()
  await page.getByText('Global Feed').click()

  await expect(page.locator('app-article-list h1').first()).not.toContainText('This is a test article')

})

test('Create article', async ({ page, request }) => {
  await page.getByText(' New Article ').click()
  await page.getByRole('textbox', { name: 'Article Title'}).fill('Plawright E2E Automation')
  await page.getByRole('textbox', { name: 'What\'s this article about?'}).fill('API testing with Playwright')
  await page.getByRole('textbox', { name: 'Write your article (in markdown)'}).fill('This is the article body')
  await page.getByRole('button').click()

  const articleResponse = await page.waitForResponse('https://conduit-api.bondaracademy.com/api/articles/')
  const articleResponseBody = await articleResponse.json()
  const slugId = await articleResponseBody.article.slug

  await expect(page.locator('.article-page h1')).toHaveText('Plawright E2E Automation')
  await page.getByText('Home').click()
  await page.getByText('Global Feed').click() 
  await expect(page.locator('app-article-list h1').first()).toContainText('Plawright E2E Automation')

  const response = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
    data: {
      "user":{"email":"test100%@test.com","password":"1234qwer"}
    }
  })
  const responseBody = await response.json()
  const accessToken = responseBody.user.token

  const deleteArticleResponse = await request.delete(`https://conduit-api.bondaracademy.com/api/articles/${slugId}`, {
    headers: {
      authorization: `Token ${accessToken}`
    }
  })
  expect(deleteArticleResponse.status()).toEqual(204)
})