import { Router } from 'itty-router'

const router = Router()

const fetchCodePush = async (url, headers) => {
    const urlParts = new URL(url)

    urlParts.protocol = 'https'
    urlParts.host = 'codepush.appcenter.ms'

    const response = await fetch(urlParts.toString(), {
        headers,
    })

    return response.text()
}

const fetchAndUpdateCache = async (version, url, headers) => {
    const responseText = await fetchCodePush(url, headers)
    await CACHE.put(version, responseText)

    return responseText
}

router.get(
    '/v0.1/public/codepush/update_check',
    async ({ url, headers, query }, event) => {
        const { app_version } = query

        const cachedEntry = await CACHE.get(app_version)
        const fetchPromise = fetchAndUpdateCache(app_version, url, headers)

        event.waitUntil(fetchPromise)

        if (cachedEntry) {
            return new Response(cachedEntry)
        }

        const responseText = await fetchPromise

        return new Response(responseText)
    }
)

router.all('*', () => new Response('404, not found!', { status: 404 }))

addEventListener('fetch', event => {
    event.respondWith(router.handle(event.request, event))
})
