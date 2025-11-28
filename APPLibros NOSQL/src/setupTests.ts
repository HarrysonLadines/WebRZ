import '@testing-library/jest-dom'
import { vi } from 'vitest'
import dotenv from 'dotenv'


dotenv.config()

global.alert = vi.fn()

global.fetch = vi.fn((input: RequestInfo | URL) => {
  const mockedResponse = {
    ok: true,
    status: 200,
    json: () => Promise.resolve([
      { id: 1, contenido: 'Test', calificacion: 5, votos: [] }
    ]),
    text: () => Promise.resolve(""),
    headers: new Headers(),
    redirected: false,
    statusText: "OK",
    type: "basic",
    url: typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url,
    clone: () => mockedResponse as Response,
    body: null,
    bodyUsed: false,
  }

  return Promise.resolve(mockedResponse as Response)
})
