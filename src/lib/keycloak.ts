import Keycloak from 'keycloak-js'

const url = import.meta.env.VITE_KEYCLOAK_URL
const realm = import.meta.env.VITE_KEYCLOAK_REALM
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID

export const isKeycloakConfigured = Boolean(url && realm && clientId)

export const keycloak = isKeycloakConfigured
  ? new Keycloak({ url, realm, clientId })
  : null

let initialization: Promise<boolean> | null = null

export function initializeKeycloak() {
  if (!keycloak) {
    return Promise.reject(
      new Error('Configure o Keycloak no arquivo .env.local antes de autenticar.'),
    )
  }

  if (!initialization) {
    initialization = keycloak.init({
      onLoad: 'check-sso',
      checkLoginIframe: false,
      pkceMethod: 'S256',
    })
  }

  return initialization
}

export async function getKeycloakAccessToken() {
  if (!keycloak?.authenticated) return null
  await keycloak.updateToken(30)
  return keycloak.token ?? null
}
