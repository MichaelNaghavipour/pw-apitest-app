import { request, expect } from '@playwright/test'
import user from './.auth/user.json'
import fs from 'fs'

const authFile = '.auth/user.json'

export default async function globalSetup() {

    const context = await request.newContext()

    const responseToken = await context.post('https://conduit-api.bondaracademy.com/api/users/login', {
        data: {
          "user":{"email":"test100%@test.com","password":"1234qwer"}
        }
      })
      const responseBody = await responseToken.json()
      const accessToken = responseBody.user.token
      user.origins[0].localStorage[0].value = accessToken
      fs.writeFileSync(authFile, JSON.stringify(user))

      process.env['ACCESS_TOKEN'] = accessToken

      const articleResponse = await context.post('https://conduit-api.bondaracademy.com/api/articles/', {
        data: {
          "article":{"title":"Global Likes test article","description":"This is a description","body":"This is a body","tagList":[]}
        },
        headers: {
            'Authorization': `Token ${process.env.ACCESS_TOKEN}` 
        }
      })
      expect(articleResponse.status()).toEqual(201)
      const response = await articleResponse.json()
      const slugId = response.article.slug
      process.env['SLUGID'] = slugId
}